import type { BlogArticleMeta, BlogIndex } from './blog';
import { LOCAL_BLOG_ADMIN_API_PREFIX } from './localBlogAdminConfig';

export interface LocalDirectoryFile {
  relativePath: string;
  contentBase64: string;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(payload.error || '本地博客管理请求失败');
  }

  return payload;
}

export async function fetchLocalBlogAdminState() {
  const response = await fetch(`${LOCAL_BLOG_ADMIN_API_PREFIX}/state`);
  return readJsonResponse<{ index: BlogIndex }>(response);
}

export async function saveLocalBlogIndex(index: BlogIndex) {
  const response = await fetch(`${LOCAL_BLOG_ADMIN_API_PREFIX}/index`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ index }),
  });

  return readJsonResponse<{ index: BlogIndex }>(response);
}

export async function importLocalArticleFolder(input: {
  index: BlogIndex;
  article: BlogArticleMeta;
  files: LocalDirectoryFile[];
  overwriteFolder?: boolean;
}) {
  const response = await fetch(`${LOCAL_BLOG_ADMIN_API_PREFIX}/import-article`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  return readJsonResponse<{ index: BlogIndex }>(response);
}

export async function deleteLocalArticle(slug: string) {
  const response = await fetch(`${LOCAL_BLOG_ADMIN_API_PREFIX}/article/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });

  return readJsonResponse<{ index: BlogIndex }>(response);
}
