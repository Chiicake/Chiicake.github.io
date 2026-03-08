import { normalizeBlogIndex, type BlogArticleMeta, type BlogCategoryMeta, type BlogCollectionMeta, type BlogIndex } from './blog';

export function createEmptyArticle(index?: BlogIndex): BlogArticleMeta {
  return {
    slug: '',
    date: new Date().toISOString().slice(0, 10),
    tags: [],
    title: {
      zh: '',
      en: '',
    },
    summary: {
      zh: '',
      en: '',
    },
    readingTime: {
      zh: '5 分钟',
      en: '5 min',
    },
    category: index?.categories[0]?.id ?? '',
    collection: '',
    seriesOrder: 1,
    featuredRank: undefined,
  };
}

export function createEmptyCategory(): BlogCategoryMeta {
  return {
    id: '',
    label: {
      zh: '',
      en: '',
    },
    description: {
      zh: '',
      en: '',
    },
  };
}

export function createEmptyCollection(): BlogCollectionMeta {
  return {
    slug: '',
    name: {
      zh: '',
      en: '',
    },
    description: {
      zh: '',
      en: '',
    },
  };
}

export function upsertArticle(index: BlogIndex, article: BlogArticleMeta) {
  const nextArticles = index.articles.some((item) => item.slug === article.slug)
    ? index.articles.map((item) => (item.slug === article.slug ? article : item))
    : [...index.articles, article];

  return normalizeBlogIndex({
    ...index,
    articles: nextArticles,
  });
}

export function renameTag(index: BlogIndex, currentTag: string, nextTag: string) {
  const trimmedNextTag = nextTag.trim();
  if (!trimmedNextTag || currentTag === trimmedNextTag) {
    return index;
  }

  return normalizeBlogIndex({
    ...index,
    tags: index.tags.map((tag) => (tag === currentTag ? trimmedNextTag : tag)),
    articles: index.articles.map((article) => ({
      ...article,
      tags: article.tags.map((tag) => (tag === currentTag ? trimmedNextTag : tag)),
    })),
  });
}

export function removeTag(index: BlogIndex, targetTag: string) {
  return normalizeBlogIndex({
    ...index,
    tags: index.tags.filter((tag) => tag !== targetTag),
    articles: index.articles.map((article) => ({
      ...article,
      tags: article.tags.filter((tag) => tag !== targetTag),
    })),
  });
}

export function addTag(index: BlogIndex, tag: string) {
  return normalizeBlogIndex({
    ...index,
    tags: [...index.tags, tag.trim()],
  });
}

export function renameCategoryId(index: BlogIndex, currentId: string, nextId: string) {
  const trimmedNextId = nextId.trim().toLowerCase();
  if (!trimmedNextId || currentId === trimmedNextId) {
    return index;
  }

  return normalizeBlogIndex({
    ...index,
    categories: index.categories.map((category) =>
      category.id === currentId ? { ...category, id: trimmedNextId } : category
    ),
    articles: index.articles.map((article) =>
      article.category === currentId ? { ...article, category: trimmedNextId } : article
    ),
  });
}

export function renameCollectionSlug(index: BlogIndex, currentSlug: string, nextSlug: string) {
  const trimmedNextSlug = nextSlug.trim().toLowerCase();
  if (!trimmedNextSlug || currentSlug === trimmedNextSlug) {
    return index;
  }

  return normalizeBlogIndex({
    ...index,
    collections: index.collections.map((collection) =>
      collection.slug === currentSlug ? { ...collection, slug: trimmedNextSlug } : collection
    ),
    articles: index.articles.map((article) =>
      article.collection === currentSlug ? { ...article, collection: trimmedNextSlug } : article
    ),
  });
}
