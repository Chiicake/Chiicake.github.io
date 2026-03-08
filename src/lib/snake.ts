export const SNAKE_BOARD_SIZE = 14;
export const SNAKE_TICK_MS = 170;

export type SnakeDirection = 'up' | 'down' | 'left' | 'right';
export type SnakeStatus = 'idle' | 'running' | 'paused' | 'lost' | 'won';

export interface SnakeCell {
  row: number;
  col: number;
}

export interface SnakeGameState {
  boardSize: number;
  snake: SnakeCell[];
  direction: SnakeDirection;
  food: SnakeCell | null;
  score: number;
  bestScore: number;
  status: SnakeStatus;
  tickMs: number;
}

interface CreateSnakeGameOptions {
  boardSize?: number;
  bestScore?: number;
  random?: () => number;
}

function isSameCell(left: SnakeCell, right: SnakeCell) {
  return left.row === right.row && left.col === right.col;
}

function isOppositeDirection(current: SnakeDirection, next: SnakeDirection) {
  return (
    (current === 'up' && next === 'down') ||
    (current === 'down' && next === 'up') ||
    (current === 'left' && next === 'right') ||
    (current === 'right' && next === 'left')
  );
}

function createInitialSnake(boardSize: number): SnakeCell[] {
  const centerRow = Math.floor(boardSize / 2);
  const centerCol = Math.floor(boardSize / 2);

  return [
    { row: centerRow, col: centerCol + 1 },
    { row: centerRow, col: centerCol },
    { row: centerRow, col: centerCol - 1 },
  ];
}

function createFood(boardSize: number, snake: SnakeCell[], random: () => number): SnakeCell | null {
  const availableCells: SnakeCell[] = [];

  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      const cell = { row, col };

      if (!snake.some((segment) => isSameCell(segment, cell))) {
        availableCells.push(cell);
      }
    }
  }

  if (availableCells.length === 0) {
    return null;
  }

  const nextIndex = Math.min(
    availableCells.length - 1,
    Math.floor(random() * availableCells.length),
  );

  return availableCells[nextIndex];
}

function moveHead(head: SnakeCell, direction: SnakeDirection): SnakeCell {
  switch (direction) {
    case 'up':
      return { row: head.row - 1, col: head.col };
    case 'down':
      return { row: head.row + 1, col: head.col };
    case 'left':
      return { row: head.row, col: head.col - 1 };
    case 'right':
      return { row: head.row, col: head.col + 1 };
  }
}

export function createSnakeGame(options: CreateSnakeGameOptions = {}): SnakeGameState {
  const boardSize = options.boardSize ?? SNAKE_BOARD_SIZE;
  const bestScore = options.bestScore ?? 0;
  const random = options.random ?? Math.random;
  const snake = createInitialSnake(boardSize);

  return {
    boardSize,
    snake,
    direction: 'right',
    food: createFood(boardSize, snake, random),
    score: 0,
    bestScore,
    status: 'idle',
    tickMs: SNAKE_TICK_MS,
  };
}

export function setSnakeDirection(state: SnakeGameState, nextDirection: SnakeDirection): SnakeGameState {
  if (state.snake.length > 1 && isOppositeDirection(state.direction, nextDirection)) {
    return state;
  }

  return {
    ...state,
    direction: nextDirection,
  };
}

export function advanceSnakeGame(state: SnakeGameState, random: () => number = Math.random): SnakeGameState {
  if (state.status !== 'running') {
    return state;
  }

  const nextHead = moveHead(state.snake[0], state.direction);
  const isOutOfBounds =
    nextHead.row < 0 ||
    nextHead.row >= state.boardSize ||
    nextHead.col < 0 ||
    nextHead.col >= state.boardSize;

  if (isOutOfBounds) {
    return {
      ...state,
      status: 'lost',
      bestScore: Math.max(state.bestScore, state.score),
    };
  }

  const eatsFood = state.food !== null && isSameCell(nextHead, state.food);
  const collisionBody = eatsFood ? state.snake : state.snake.slice(0, -1);

  if (collisionBody.some((segment) => isSameCell(segment, nextHead))) {
    return {
      ...state,
      status: 'lost',
      bestScore: Math.max(state.bestScore, state.score),
    };
  }

  const nextSnake = eatsFood
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];

  if (!eatsFood) {
    return {
      ...state,
      snake: nextSnake,
    };
  }

  const nextScore = state.score + 1;
  const nextBestScore = Math.max(state.bestScore, nextScore);
  const nextFood = createFood(state.boardSize, nextSnake, random);

  return {
    ...state,
    snake: nextSnake,
    food: nextFood,
    score: nextScore,
    bestScore: nextBestScore,
    status: nextFood === null ? 'won' : 'running',
  };
}
