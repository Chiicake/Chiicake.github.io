export type LifeGrid = boolean[][];
export const LIFE_PATTERN_PRESETS = {
  block: ['11', '11'],
  blinker: ['111'],
  toad: ['0111', '1110'],
  beacon: ['1100', '1100', '0011', '0011'],
  glider: ['010', '001', '111'],
  pulsar: [
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
  ],
  rPentomino: ['011', '110', '010'],
} as const;
export type LifePatternId = keyof typeof LIFE_PATTERN_PRESETS;
const LIFE_TEXT_GLYPHS = {
  ' ': ['0', '0', '0', '0', '0'],
  '!': ['1', '1', '1', '0', '1'],
  ',': ['0', '0', '0', '1', '1'],
  "'": ['1', '1', '0', '0', '0'],
  A: ['0110', '1001', '1111', '1001', '1001'],
  C: ['0111', '1000', '1000', '1000', '0111'],
  E: ['1111', '1000', '1110', '1000', '1111'],
  H: ['1001', '1001', '1111', '1001', '1001'],
  I: ['111', '010', '010', '010', '111'],
  K: ['1001', '1010', '1100', '1010', '1001'],
  L: ['1000', '1000', '1000', '1000', '1111'],
  M: ['1001', '1111', '1111', '1001', '1001'],
  N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['0110', '1001', '1001', '1001', '0110'],
  T: ['1111', '0110', '0110', '0110', '0110'],
  U: ['1001', '1001', '1001', '1001', '0110'],
  Y: ['1001', '1001', '0110', '0110', '0110'],
} as const;

interface CreateLifeGridOptions {
  rows: number;
  cols: number;
  density?: number;
  random?: () => number;
}

export function createEmptyLifeGrid({ rows, cols }: Pick<CreateLifeGridOptions, 'rows' | 'cols'>): LifeGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function createLifeGrid({
  rows,
  cols,
  density = 0.28,
  random = Math.random,
}: CreateLifeGridOptions): LifeGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => random() < density));
}

export function createLifePatternGrid({
  rows,
  cols,
  patternId,
  repeatRows = 1,
  repeatCols = 1,
}: {
  rows: number;
  cols: number;
  patternId: LifePatternId;
  repeatRows?: number;
  repeatCols?: number;
}): LifeGrid {
  const grid = createEmptyLifeGrid({ rows, cols });
  const pattern = LIFE_PATTERN_PRESETS[patternId];
  const patternHeight = pattern.length;
  const patternWidth = Math.max(...pattern.map((row) => row.length));

  const rowStarts = Array.from({ length: Math.max(repeatRows, 1) }, (_, index) => {
    const zoneCenter = ((index + 0.5) * rows) / Math.max(repeatRows, 1);
    return Math.max(0, Math.min(rows - patternHeight, Math.round(zoneCenter - patternHeight / 2)));
  });
  const colStarts = Array.from({ length: Math.max(repeatCols, 1) }, (_, index) => {
    const zoneCenter = ((index + 0.5) * cols) / Math.max(repeatCols, 1);
    return Math.max(0, Math.min(cols - patternWidth, Math.round(zoneCenter - patternWidth / 2)));
  });

  rowStarts.forEach((startRow) => {
    colStarts.forEach((startCol) => {
      pattern.forEach((patternRow, rowOffset) => {
        patternRow.split('').forEach((cell, colOffset) => {
          const rowIndex = startRow + rowOffset;
          const colIndex = startCol + colOffset;

          if (cell !== '1' || rowIndex >= rows || colIndex >= cols) {
            return;
          }

          grid[rowIndex][colIndex] = true;
        });
      });
    });
  });

  return grid;
}

function getGlyph(char: string) {
  return LIFE_TEXT_GLYPHS[char as keyof typeof LIFE_TEXT_GLYPHS] ?? LIFE_TEXT_GLYPHS[' '];
}

function getTextLineWidth(text: string, letterSpacing: number) {
  return text.split('').reduce((width, char, index) => {
    const glyph = getGlyph(char.toUpperCase());
    const glyphWidth = Math.max(...glyph.map((row) => row.length));

    return width + glyphWidth + (index < text.length - 1 ? letterSpacing : 0);
  }, 0);
}

export function createLifeTextGrid({
  rows,
  cols,
  lines,
  lineGap = 1,
  letterSpacing = 1,
}: {
  rows: number;
  cols: number;
  lines: string[];
  lineGap?: number;
  letterSpacing?: number;
}): LifeGrid {
  const grid = createEmptyLifeGrid({ rows, cols });
  const glyphHeight = LIFE_TEXT_GLYPHS.A.length;
  const totalHeight = lines.length * glyphHeight + Math.max(lines.length - 1, 0) * lineGap;
  const startRow = Math.max(0, Math.floor((rows - totalHeight) / 2));

  lines.forEach((line, lineIndex) => {
    const lineWidth = getTextLineWidth(line, letterSpacing);
    let cursorCol = Math.max(0, Math.floor((cols - lineWidth) / 2));
    const lineRowStart = startRow + lineIndex * (glyphHeight + lineGap);

    line.split('').forEach((char, charIndex) => {
      const glyph = getGlyph(char.toUpperCase());
      const glyphWidth = Math.max(...glyph.map((row) => row.length));

      glyph.forEach((glyphRow, rowOffset) => {
        glyphRow.split('').forEach((cell, colOffset) => {
          const rowIndex = lineRowStart + rowOffset;
          const colIndex = cursorCol + colOffset;

          if (cell !== '1' || rowIndex >= rows || colIndex >= cols) {
            return;
          }

          grid[rowIndex][colIndex] = true;
        });
      });

      cursorCol += glyphWidth + (charIndex < line.length - 1 ? letterSpacing : 0);
    });
  });

  return grid;
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
