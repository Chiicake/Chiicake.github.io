import assert from 'node:assert/strict';
import test from 'node:test';

import { computeArticleReadingProgress, resolveActiveTocSectionIdByProgress } from '../src/lib/blog.ts';

test('computeArticleReadingProgress returns 0 when scrollY is 0 (page at top)', () => {
  const progress = computeArticleReadingProgress({
    scrollY: 0,
    articleTop: 300,
    articleBottom: 2000,
    viewportHeight: 800,
  });

  assert.equal(progress, 0);
});

test('computeArticleReadingProgress returns 0 when scroll has not reached article top', () => {
  const progress = computeArticleReadingProgress({
    scrollY: 100,
    articleTop: 300,
    articleBottom: 2000,
    viewportHeight: 800,
  });

  assert.equal(progress, 0);
});

test('computeArticleReadingProgress starts progressing after scrolling past article top', () => {
  // scrollStart = 300, scrollEnd = 2000 - 800 = 1200
  // progress = (600 - 300) / (1200 - 300) = 300 / 900 = 0.333...
  const progress = computeArticleReadingProgress({
    scrollY: 600,
    articleTop: 300,
    articleBottom: 2000,
    viewportHeight: 800,
  });

  assert.ok(Math.abs(progress - 1/3) < 0.001, `Expected ~0.333, got ${progress}`);
});

test('computeArticleReadingProgress returns 1 when article bottom is in viewport', () => {
  const progress = computeArticleReadingProgress({
    scrollY: 1200,
    articleTop: 300,
    articleBottom: 2000,
    viewportHeight: 800,
  });

  assert.equal(progress, 1);
});

test('resolveActiveTocSectionIdByProgress keeps the first section active at the start', () => {
  const activeId = resolveActiveTocSectionIdByProgress({
    sections: [
      { id: 'intro', progress: 0.06 },
      { id: 'cargo', progress: 0.34 },
      { id: 'apis', progress: 0.68 },
    ],
    progress: 0,
  });

  assert.equal(activeId, 'intro');
});

test('resolveActiveTocSectionIdByProgress follows the latest reached section threshold', () => {
  const activeId = resolveActiveTocSectionIdByProgress({
    sections: [
      { id: 'intro', progress: 0.06 },
      { id: 'cargo', progress: 0.34 },
      { id: 'apis', progress: 0.68 },
    ],
    progress: 0.5,
  });

  assert.equal(activeId, 'cargo');
});

test('resolveActiveTocSectionIdByProgress clamps to the final section near the end', () => {
  const activeId = resolveActiveTocSectionIdByProgress({
    sections: [
      { id: 'intro', progress: 0.06 },
      { id: 'cargo', progress: 0.34 },
      { id: 'apis', progress: 0.68 },
    ],
    progress: 0.98,
  });

  assert.equal(activeId, 'apis');
});
