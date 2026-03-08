export type BlogLanguage = 'zh' | 'en';

export interface LocalizedContent {
  zh: string;
  en: string;
  [key: string]: string;
}

export interface BlogCategoryMeta {
  id: string;
  label: LocalizedContent;
  description: LocalizedContent;
}

export interface BlogCollectionMeta {
  slug: string;
  name: LocalizedContent;
  description: LocalizedContent;
}

export interface BlogArticleMeta {
  slug: string;
  date: string;
  tags: string[];
  title: LocalizedContent;
  summary: LocalizedContent;
  readingTime: LocalizedContent;
  category: string;
  collection?: string;
  seriesOrder?: number;
  featuredRank?: number;
}

export interface BlogIndex {
  categories: BlogCategoryMeta[];
  collections: BlogCollectionMeta[];
  articles: BlogArticleMeta[];
}

export interface BlogTocItem {
  id: string;
  text: string;
  depth: number;
}

let blogIndexPromise: Promise<BlogIndex> | null = null;

function sortArticles(articles: BlogArticleMeta[]) {
  return [...articles].sort((left, right) => {
    const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }

    if (left.collection && right.collection && left.collection === right.collection) {
      return (left.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (right.seriesOrder ?? Number.MAX_SAFE_INTEGER);
    }

    return left.slug.localeCompare(right.slug);
  });
}

export function getBlogLanguage(language: string): BlogLanguage {
  return language === 'zh' ? 'zh' : 'en';
}

export function getLocalizedText(content: LocalizedContent, lang: BlogLanguage) {
  return content[lang] ?? content.en ?? Object.values(content)[0] ?? '';
}

export async function fetchBlogIndex() {
  if (!blogIndexPromise) {
    blogIndexPromise = fetch(`${import.meta.env.BASE_URL}blog/index.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch blog index');
        }

        return response.json() as Promise<BlogIndex>;
      })
      .then((data) => ({
        ...data,
        articles: sortArticles(data.articles),
      }))
      .catch((error) => {
        blogIndexPromise = null;
        throw error;
      });
  }

  return blogIndexPromise;
}

export function findBlogCategory(index: BlogIndex, categoryId: string) {
  return index.categories.find((category) => category.id === categoryId);
}

export function findBlogCollection(index: BlogIndex, collectionSlug: string) {
  return index.collections.find((collection) => collection.slug === collectionSlug);
}

export function getCollectionArticles(index: BlogIndex, collectionSlug: string) {
  return [...index.articles]
    .filter((article) => article.collection === collectionSlug)
    .sort((left, right) => {
      const orderDiff = (left.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (right.seriesOrder ?? Number.MAX_SAFE_INTEGER);
      if (orderDiff !== 0) {
        return orderDiff;
      }

      return new Date(right.date).getTime() - new Date(left.date).getTime();
    });
}

export function getFeaturedArticles(index: BlogIndex, maxArticles = 3) {
  return [...index.articles]
    .filter((article) => article.featuredRank !== undefined)
    .sort((left, right) => {
      if (left.featuredRank !== right.featuredRank) {
        return (left.featuredRank ?? Number.MAX_SAFE_INTEGER) - (right.featuredRank ?? Number.MAX_SAFE_INTEGER);
      }

      return new Date(right.date).getTime() - new Date(left.date).getTime();
    })
    .slice(0, maxArticles);
}

export function getArticlesByCategory(index: BlogIndex, categoryId: string) {
  if (categoryId === 'all') {
    return index.articles;
  }

  return index.articles.filter((article) => article.category === categoryId);
}

export function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trimStart();
}

function toPlainHeadingText(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .trim();
}

export function getHeadingAnchorId(text: string) {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

  return slug || 'section';
}

export function parseMarkdownToc(markdown: string) {
  const seenIds = new Map<string, number>();
  let inCodeBlock = false;

  return stripFrontmatter(markdown)
    .split('\n')
    .map((line) => line.trim())
    .reduce<BlogTocItem[]>((items, line) => {
      if (line.startsWith('```') || line.startsWith('~~~')) {
        inCodeBlock = !inCodeBlock;
        return items;
      }

      if (inCodeBlock) {
        return items;
      }

      const match = /^(#{1,4})\s+(.+)$/.exec(line);
      if (!match) {
        return items;
      }

      const depth = match[1].length;
      const text = toPlainHeadingText(match[2]);
      if (!text) {
        return items;
      }

      const baseId = getHeadingAnchorId(text);
      const nextCount = (seenIds.get(baseId) ?? 0) + 1;
      seenIds.set(baseId, nextCount);

      items.push({
        id: nextCount === 1 ? baseId : `${baseId}-${nextCount}`,
        text,
        depth,
      });

      return items;
    }, []);
}
