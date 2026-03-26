import test from 'node:test';
import assert from 'node:assert/strict';
import { getBlogPageFromSearchParams, paginateArticles } from '../src/lib/blog.ts';

function createArticle(slug, date) {
  return {
    slug,
    date,
    tags: [],
    title: { zh: slug, en: slug },
    summary: { zh: slug, en: slug },
    readingTime: { zh: '1 分钟', en: '1 min' },
    category: 'ai',
    contentType: 'original',
  };
}

test('paginateArticles returns first 10 articles on page 1', () => {
  const articles = Array.from({ length: 23 }, (_, index) => createArticle(`article-${index + 1}`, `2026-03-${String(index + 1).padStart(2, '0')}`));

  const page = paginateArticles(articles, 1);

  assert.equal(page.pageSize, 10);
  assert.equal(page.totalPages, 3);
  assert.equal(page.currentPage, 1);
  assert.equal(page.items.length, 10);
  assert.equal(page.items[0].slug, 'article-1');
  assert.equal(page.items[9].slug, 'article-10');
});

test('paginateArticles returns remaining articles on last page', () => {
  const articles = Array.from({ length: 23 }, (_, index) => createArticle(`article-${index + 1}`, `2026-03-${String(index + 1).padStart(2, '0')}`));

  const page = paginateArticles(articles, 3);

  assert.equal(page.totalPages, 3);
  assert.equal(page.currentPage, 3);
  assert.equal(page.items.length, 3);
  assert.equal(page.items[0].slug, 'article-21');
  assert.equal(page.items[2].slug, 'article-23');
});

test('paginateArticles clamps an out-of-range page number', () => {
  const articles = Array.from({ length: 11 }, (_, index) => createArticle(`article-${index + 1}`, `2026-03-${String(index + 1).padStart(2, '0')}`));

  const page = paginateArticles(articles, 99);

  assert.equal(page.totalPages, 2);
  assert.equal(page.currentPage, 2);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].slug, 'article-11');
});

test('getBlogPageFromSearchParams reads a positive page value', () => {
  const params = new URLSearchParams('page=3');

  assert.equal(getBlogPageFromSearchParams(params), 3);
});

test('getBlogPageFromSearchParams falls back to 1 for invalid values', () => {
  assert.equal(getBlogPageFromSearchParams(new URLSearchParams('page=0')), 1);
  assert.equal(getBlogPageFromSearchParams(new URLSearchParams('page=-2')), 1);
  assert.equal(getBlogPageFromSearchParams(new URLSearchParams('page=abc')), 1);
  assert.equal(getBlogPageFromSearchParams(new URLSearchParams('')), 1);
});
