export type LifeGrid = boolean[][];

interface CreateLifeGridOptions {
  rows: number;
  cols: number;
  density?: number;
  random?: () => number;
}

export function createLifeGrid({
  rows,
  cols,
  density = 0.28,
  random = Math.random,
}: CreateLifeGridOptions): LifeGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => random() < density),
  );
}

export function countAliveCells(grid: LifeGrid) {
  return grid.reduce(
    (total, row) => total + row.reduce((rowTotal, cell) => rowTotal + (cell ? 1 : 0), 0),
    0,
  );
}

export function areLifeGridsEqual(left: LifeGrid, right: LifeGrid) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((row, rowIndex) => {
    const otherRow = right[rowIndex];

    if (!otherRow || row.length !== otherRow.length) {
      return false;
    }

    return row.every((cell, colIndex) => cell === otherRow[colIndex]);
  });
}

export function toggleLifeCell(grid: LifeGrid, row: number, col: number): LifeGrid {
  return grid.map((currentRow, rowIndex) =>
    currentRow.map((cell, colIndex) => {
      if (rowIndex === row && colIndex === col) {
        return !cell;
      }

      return cell;
    }),
  );
}

function countNeighbors(grid: LifeGrid, row: number, col: number) {
  let neighbors = 0;

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;

      if (
        nextRow >= 0 &&
        nextRow < grid.length &&
        nextCol >= 0 &&
        nextCol < grid[0].length &&
        grid[nextRow][nextCol]
      ) {
        neighbors += 1;
      }
    }
  }

  return neighbors;
}

export function stepLifeGrid(grid: LifeGrid): LifeGrid {
  return grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const neighbors = countNeighbors(grid, rowIndex, colIndex);

      if (cell) {
        return neighbors === 2 || neighbors === 3;
      }

      return neighbors === 3;
    }),
  );
}
