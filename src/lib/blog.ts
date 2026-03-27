export type BlogLanguage = 'zh' | 'en';
export type BlogContentType = 'original' | 'repost';

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

export interface BlogArticleSourceMeta {
  site: string;
  author: string;
  title: LocalizedContent;
  url: string;
  publishedAt?: string;
  translator?: string;
}

export interface BlogArticleMeta {
  slug: string;
  date: string;
  tags: string[];
  title: LocalizedContent;
  summary: LocalizedContent;
  readingTime: LocalizedContent;
  category: string;
  contentType: BlogContentType;
  source?: BlogArticleSourceMeta;
  collection?: string;
  seriesOrder?: number;
  featuredRank?: number;
}

export interface BlogIndex {
  tags: string[];
  categories: BlogCategoryMeta[];
  collections: BlogCollectionMeta[];
  articles: BlogArticleMeta[];
}

export interface BlogTocItem {
  id: string;
  text: string;
  depth: number;
}

export interface BlogPaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

const DEFAULT_BLOG_PAGE_SIZE = 10;

let blogIndexPromise: Promise<BlogIndex> | null = null;

function sortUniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right)
  );
}

function normalizeSourceMeta(source?: BlogArticleSourceMeta) {
  if (!source) {
    return undefined;
  }

  const normalized = {
    site: source.site?.trim?.() ?? '',
    author: source.author?.trim?.() ?? '',
    title: {
      zh: source.title?.zh?.trim?.() ?? '',
      en: source.title?.en?.trim?.() ?? '',
    },
    url: source.url?.trim?.() ?? '',
    publishedAt: source.publishedAt?.trim?.() || undefined,
    translator: source.translator?.trim?.() || undefined,
  } satisfies BlogArticleSourceMeta;

  if (!normalized.url && !normalized.site && !normalized.author && !normalized.title.zh && !normalized.title.en) {
    return undefined;
  }

  return normalized;
}

function normalizeArticle(article: BlogArticleMeta): BlogArticleMeta {
  const contentType: BlogContentType = article.contentType === 'repost' ? 'repost' : 'original';

  return {
    ...article,
    tags: sortUniqueStrings(article.tags ?? []),
    contentType,
    source: contentType === 'repost' ? normalizeSourceMeta(article.source) : undefined,
  };
}

export function normalizeBlogIndex(index: Partial<BlogIndex>) {
  const articles = sortArticles((index.articles ?? []).map(normalizeArticle));
  const tags = sortUniqueStrings([...(index.tags ?? []), ...articles.flatMap((article) => article.tags ?? [])]);

  return {
    tags,
    categories: [...(index.categories ?? [])],
    collections: [...(index.collections ?? [])],
    articles,
  } satisfies BlogIndex;
}

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

export function getBlogContentType(article: BlogArticleMeta): BlogContentType {
  return article.contentType === 'repost' ? 'repost' : 'original';
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
      .then((data) => normalizeBlogIndex(data))
      .catch((error) => {
        blogIndexPromise = null;
        throw error;
      });
  }

  return blogIndexPromise;
}

export function primeBlogIndex(index: Partial<BlogIndex>) {
  const normalizedIndex = normalizeBlogIndex(index);
  blogIndexPromise = Promise.resolve(normalizedIndex);
  return normalizedIndex;
}

export function resetBlogIndexCache() {
  blogIndexPromise = null;
}

export function preloadBlogIndex() {
  return fetchBlogIndex();
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

export function getArticlesByContentType(index: BlogIndex, contentType: 'all' | BlogContentType) {
  if (contentType === 'all') {
    return index.articles;
  }

  return index.articles.filter((article) => getBlogContentType(article) === contentType);
}

export function paginateArticles<T>(items: T[], page: number, pageSize = DEFAULT_BLOG_PAGE_SIZE): BlogPaginationResult<T> {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePageSize;

  return {
    items: items.slice(start, start + safePageSize),
    currentPage,
    totalPages,
    pageSize: safePageSize,
  };
}

export function getBlogPageFromSearchParams(searchParams: URLSearchParams) {
  const pageValue = Number.parseInt(searchParams.get('page') ?? '1', 10);

  if (!Number.isFinite(pageValue) || pageValue < 1) {
    return 1;
  }

  return pageValue;
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

export function resolveActiveTocSectionIdByProgress({
  sections,
  progress,
}: {
  sections: Array<{ id: string; progress: number }>;
  progress: number;
}) {
  if (sections.length === 0) {
    return '';
  }

  let activeId = sections[0].id;

  for (const section of sections) {
    if (progress >= section.progress) {
      activeId = section.id;
      continue;
    }

    break;
  }

  return activeId;
}

export function computeArticleReadingProgress({
  scrollY,
  articleTop,
  articleBottom,
  viewportHeight,
}: {
  scrollY: number;
  articleTop: number;
  articleBottom: number;
  viewportHeight: number;
}) {
  // The scrollable range for reading:
  // - Start: when the article top reaches the viewport top (scrollY = articleTop)
  // - End: when the article bottom reaches the viewport bottom (scrollY = articleBottom - viewportHeight)
  const scrollStart = articleTop;
  const scrollEnd = Math.max(articleBottom - viewportHeight, scrollStart);

  if (scrollEnd <= scrollStart) {
    // Article fits entirely in viewport, consider it fully read when visible
    return scrollY >= scrollStart ? 1 : 0;
  }

  if (scrollY <= scrollStart) {
    return 0;
  }

  if (scrollY >= scrollEnd) {
    return 1;
  }

  return (scrollY - scrollStart) / (scrollEnd - scrollStart);
}
