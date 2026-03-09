import assert from 'node:assert/strict';
import test from 'node:test';

import {
  areLifeGridsEqual,
  countAliveCells,
  createEmptyLifeGrid,
  createLifeGrid,
  createLifePatternGrid,
  createLifeTextGrid,
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

test('createLifePatternGrid centers a classic pattern on the board', () => {
  const grid = createLifePatternGrid({
    rows: 7,
    cols: 7,
    patternId: 'glider',
  });

  assert.equal(countAliveCells(grid), 5);
  assert.deepEqual(
    grid.slice(2, 5).map((row) => row.slice(2, 5)),
    [
      [false, true, false],
      [false, false, true],
      [true, true, true],
    ],
  );
});

test('createLifePatternGrid can tile a classic pattern in a 3x3 layout', () => {
  const grid = createLifePatternGrid({
    rows: 15,
    cols: 15,
    patternId: 'glider',
    repeatRows: 3,
    repeatCols: 3,
  });

  assert.equal(countAliveCells(grid), 45);
});

test('createLifePatternGrid supports the r-pentomino preset', () => {
  const grid = createLifePatternGrid({
    rows: 7,
    cols: 7,
    patternId: 'rPentomino',
  });

  assert.equal(countAliveCells(grid), 5);
  assert.deepEqual(
    grid.slice(2, 5).map((row) => row.slice(2, 5)),
    [
      [false, true, true],
      [true, true, false],
      [false, true, false],
    ],
  );
});

test('createLifePatternGrid supports a centered pulsar preset', () => {
  const grid = createLifePatternGrid({
    rows: 15,
    cols: 15,
    patternId: 'pulsar',
  });

  assert.equal(countAliveCells(grid), 48);
  assert.deepEqual(
    grid.slice(1, 14).map((row) => row.slice(1, 14)),
    [
      '0011100011100',
      '0000000000000',
      '1000010100001',
      '1000010100001',
      '1000010100001',
      '0011100011100',
      '0000000000000',
      '0011100011100',
      '1000010100001',
      '1000010100001',
      '1000010100001',
      '0000000000000',
      '0011100011100',
    ].map((row) => row.split('').map((cell) => cell === '1')),
  );
});

test('createLifeTextGrid renders a centered dot-matrix line', () => {
  const grid = createLifeTextGrid({
    rows: 5,
    cols: 8,
    lines: ['HI'],
  });

  assert.deepEqual(grid, [
    [true, false, false, true, false, true, true, true],
    [true, false, false, true, false, false, true, false],
    [true, true, true, true, false, false, true, false],
    [true, false, false, true, false, false, true, false],
    [true, false, false, true, false, true, true, true],
  ]);
});

test('createLifeTextGrid renders the expanded E glyph without clipping', () => {
  const grid = createLifeTextGrid({
    rows: 5,
    cols: 4,
    lines: ['E'],
  });

  assert.deepEqual(grid, [
    [true, true, true, true],
    [true, false, false, false],
    [true, true, true, false],
    [true, false, false, false],
    [true, true, true, true],
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

test('createEmptyLifeGrid creates a dead board with the requested dimensions', () => {
  const grid = createEmptyLifeGrid({ rows: 2, cols: 4 });

  assert.deepEqual(grid, [
    [false, false, false, false],
    [false, false, false, false],
  ]);
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
