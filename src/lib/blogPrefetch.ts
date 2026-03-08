import { preloadBlogIndex } from './blog';

let blogPageImportPromise: Promise<unknown> | null = null;

function importBlogPage() {
  if (!blogPageImportPromise) {
    blogPageImportPromise = import('../pages/Blog');
  }

  return blogPageImportPromise;
}

export function preloadBlogPageAssets() {
  preloadBlogIndex();
  return importBlogPage();
}
