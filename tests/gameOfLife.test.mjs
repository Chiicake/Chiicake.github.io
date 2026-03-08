import assert from 'node:assert/strict';
import test from 'node:test';

import {
  areLifeGridsEqual,
  countAliveCells,
  createLifeGrid,
  stepLifeGrid,
  toggleLifeCell,
} from '../src/lib/gameOfLife.ts';

test('createLifeGrid uses the provided dimensions and random source', () => {
  const values = [0.1, 0.9, 0.2, 0.7, 0.3, 0.8];
  let index = 0;

  const grid = createLifeGrid({
    rows: 2,
    cols: 3,
    density: 0.5,
    random: () => values[index++],
  });

  assert.deepEqual(grid, [
    [true, false, true],
    [false, true, false],
  ]);
});

test('stepLifeGrid evolves a blinker oscillator into its next generation', () => {
  const current = [
    [false, false, false, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, false, false, false],
  ];

  const next = stepLifeGrid(current);

  assert.deepEqual(next, [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, true, true, true, false],
    [false, false, false, false, false],
    [false, false, false, false, false],
  ]);
});

test('countAliveCells and areLifeGridsEqual reflect board state correctly', () => {
  const left = [
    [true, false],
    [false, true],
  ];
  const right = [
    [true, false],
    [false, true],
  ];
  const changed = [
    [true, false],
    [true, false],
  ];

  assert.equal(countAliveCells(left), 2);
  assert.equal(areLifeGridsEqual(left, right), true);
  assert.equal(areLifeGridsEqual(left, changed), false);
});

test('toggleLifeCell flips the target cell without mutating neighbors', () => {
  const grid = [
    [false, false, false],
    [false, true, false],
    [false, false, false],
  ];

  const next = toggleLifeCell(grid, 0, 1);

  assert.deepEqual(next, [
    [false, true, false],
    [false, true, false],
    [false, false, false],
  ]);
  assert.equal(grid[0][1], false);
});
