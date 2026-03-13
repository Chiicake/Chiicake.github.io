import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveActiveTocSectionIdByProgress } from '../src/lib/blog.ts';

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
