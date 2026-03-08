import assert from 'node:assert/strict';
import test from 'node:test';

import { advanceSnakeGame, createSnakeGame, setSnakeDirection } from '../src/lib/snake.ts';

test('createSnakeGame keeps food outside the initial snake body', () => {
  const game = createSnakeGame({ boardSize: 8, random: () => 0 });

  assert.equal(game.snake.length, 3);
  assert.notEqual(game.food, null);
  assert.equal(
    game.snake.some((segment) => segment.row === game.food?.row && segment.col === game.food?.col),
    false,
  );
});

test('advanceSnakeGame grows the snake and increments score after eating food', () => {
  const game = {
    ...createSnakeGame({ boardSize: 8, random: () => 0 }),
    status: 'running',
    direction: 'right',
    score: 0,
    bestScore: 0,
    snake: [
      { row: 3, col: 3 },
      { row: 3, col: 2 },
      { row: 3, col: 1 },
    ],
    food: { row: 3, col: 4 },
  };

  const next = advanceSnakeGame(game, () => 0);

  assert.equal(next.score, 1);
  assert.equal(next.bestScore, 1);
  assert.equal(next.snake.length, 4);
  assert.deepEqual(next.snake[0], { row: 3, col: 4 });
});

test('advanceSnakeGame marks the game as lost after a wall collision', () => {
  const game = {
    ...createSnakeGame({ boardSize: 8, random: () => 0 }),
    status: 'running',
    direction: 'right',
    score: 2,
    bestScore: 1,
    snake: [
      { row: 2, col: 7 },
      { row: 2, col: 6 },
      { row: 2, col: 5 },
    ],
    food: { row: 0, col: 0 },
  };

  const next = advanceSnakeGame(game, () => 0);

  assert.equal(next.status, 'lost');
  assert.equal(next.bestScore, 2);
});

test('setSnakeDirection ignores reverse turns for a snake longer than one segment', () => {
  const game = createSnakeGame({ boardSize: 8, random: () => 0 });

  const next = setSnakeDirection(game, 'left');

  assert.equal(next.direction, 'right');
});
