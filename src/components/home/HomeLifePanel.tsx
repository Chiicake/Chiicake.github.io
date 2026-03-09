import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Pause, Play, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  LIFE_PATTERN_PRESETS,
  countAliveCells,
  createEmptyLifeGrid,
  createLifeGrid,
  createLifeGridFromLines,
  createLifePatternGrid,
  createLifeTextGrid,
  stepLifeGrid,
  toggleLifeCell,
  type LifeGrid,
  type LifePatternId,
} from '../../lib/gameOfLife';
import { ScrollReveal } from '../animations/ScrollReveal';

const LIFE_ROWS = 27;
const LIFE_COLS = 27;
const LIFE_DENSITY = 0.26;
const LIFE_TICK_MS = 500;
const LIFE_GREETING_HOLD_MS = 2_500;
const LIFE_BLANK_HOLD_MS = 300;
const LIFE_MEET_YOU_HOLD_MS = 2_500;
const LIFE_SIGNATURE_HOLD_MS = 2_500;
const LIFE_GREETING_LINES = ['HI!', "I'M", 'CHII', 'CAKE'];
const LIFE_MEET_YOU_LINES = ['NICE', 'TO', 'MEET', 'YOU!'];
const LIFE_SIGNATURE_LINES = [
  '000000000000000000000000000',
  '000000000000000000000000000',
  '000000000000000001000000000',
  '000000000000000011100000000',
  '000011110111111110100000000',
  '000010011100000000100000000',
  '000011000000000000011000000',
  '000010000000000000000110000',
  '000100000110000011000010000',
  '001000000000000000000001000',
  '010000000110000011000001100',
  '010000001000000000011100100',
  '100000000000011000011100100',
  '100001111000101000000000100',
  '100001100000011000000011110',
  '100000000000010000000011011',
  '100000000000000000000011011',
  '110000000000000000000010110',
  '010000000000000000000100100',
  '011000000000000000000001000',
  '001100000000000000000011000',
  '000101100000000000011111000',
  '000100111111000000111001100',
  '000111100111111111110000100',
  '000010000000001111100000110',
  '000011000000000000100001110',
  '000001000000000000100101100',
];
const LIFE_GREETING_PREVIEW = [
  '10010111',
  '10010010',
  '11110010',
  '10010010',
  '10010111',
];
const LIFE_RANDOM_PREVIEW = ['1010', '0110', '1101', '0011'];
const LIFE_PATTERN_LAYOUTS: Partial<Record<LifePatternId, { repeatRows: number; repeatCols: number }>> = {
  pulsar: {
    repeatRows: 1,
    repeatCols: 1,
  },
};

interface LifeRuntime {
  generation: number;
  grid: LifeGrid;
  previousGrid: LifeGrid | null;
}

type LifeSeedMode = 'greeting' | 'random' | LifePatternId;

function createBlankGrid() {
  return createEmptyLifeGrid({ rows: LIFE_ROWS, cols: LIFE_COLS });
}

function createRuntimeFromGrid(
  grid: LifeGrid,
  {
    generation = 0,
    previousGrid = null,
  }: {
    generation?: number;
    previousGrid?: LifeGrid | null;
  } = {},
): LifeRuntime {
  return {
    generation,
    grid,
    previousGrid,
  };
}

function createTextRuntime(lines: string[], previousGrid: LifeGrid | null = createBlankGrid()): LifeRuntime {
  return createRuntimeFromGrid(
    createLifeTextGrid({
      rows: LIFE_ROWS,
      cols: LIFE_COLS,
      lines,
    }),
    { previousGrid },
  );
}

function createLiteralRuntime(lines: string[], previousGrid: LifeGrid | null = createBlankGrid()): LifeRuntime {
  return createRuntimeFromGrid(
    createLifeGridFromLines({
      rows: LIFE_ROWS,
      cols: LIFE_COLS,
      lines,
    }),
    { previousGrid },
  );
}

function createRandomRuntime(previousGrid: LifeGrid | null = createBlankGrid()): LifeRuntime {
  return createRuntimeFromGrid(
    createLifeGrid({ rows: LIFE_ROWS, cols: LIFE_COLS, density: LIFE_DENSITY }),
    { previousGrid },
  );
}

function createPatternRuntime(
  patternId: LifePatternId,
  {
    previousGrid = createBlankGrid(),
    repeatRows = LIFE_PATTERN_LAYOUTS[patternId]?.repeatRows ?? 3,
    repeatCols = LIFE_PATTERN_LAYOUTS[patternId]?.repeatCols ?? 3,
  }: {
    previousGrid?: LifeGrid | null;
    repeatRows?: number;
    repeatCols?: number;
  } = {},
): LifeRuntime {
  return createRuntimeFromGrid(
    createLifePatternGrid({
      rows: LIFE_ROWS,
      cols: LIFE_COLS,
      patternId,
      repeatRows,
      repeatCols,
    }),
    { previousGrid },
  );
}

function createRuntime(seedMode: Exclude<LifeSeedMode, 'greeting'> = 'random'): LifeRuntime {
  return seedMode === 'random' ? createRandomRuntime() : createPatternRuntime(seedMode);
}

export function HomeLifePanel({ compact = false, delay = 0.45 }: { compact?: boolean; delay?: number }) {
  const { t } = useTranslation();
  const [runtime, setRuntime] = useState<LifeRuntime>(() => createTextRuntime(LIFE_GREETING_LINES));
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [seedMenuOpen, setSeedMenuOpen] = useState(false);
  const [activeSeedMode, setActiveSeedMode] = useState<LifeSeedMode>('greeting');
  const seedButtonRef = useRef<HTMLButtonElement | null>(null);
  const seedMenuRef = useRef<HTMLDivElement | null>(null);
  const introTimerRefs = useRef<number[]>([]);
  const scheduleGreetingSequenceRef = useRef<() => void>(() => {});

  const clearIntroSequence = useCallback(() => {
    introTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    introTimerRefs.current = [];
  }, []);

  const scheduleGreetingSequence = useCallback(() => {
    const initialTimer = window.setTimeout(() => {
      setRuntime((current) => createTextRuntime(LIFE_GREETING_LINES, current.grid));
    }, 0);

    const clearTimer = window.setTimeout(() => {
      setRuntime((current) =>
        createRuntimeFromGrid(createBlankGrid(), {
          previousGrid: current.grid,
        }),
      );
    }, LIFE_GREETING_HOLD_MS);

    const meetTimer = window.setTimeout(() => {
      setRuntime((current) => createTextRuntime(LIFE_MEET_YOU_LINES, current.grid));
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS);

    const blankTimer = window.setTimeout(() => {
      setRuntime((current) =>
        createRuntimeFromGrid(createBlankGrid(), {
          previousGrid: current.grid,
        }),
      );
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_MEET_YOU_HOLD_MS);

    const signatureTimer = window.setTimeout(() => {
      setRuntime((current) => createLiteralRuntime(LIFE_SIGNATURE_LINES, current.grid));
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_MEET_YOU_HOLD_MS + LIFE_BLANK_HOLD_MS);

    const finalBlankTimer = window.setTimeout(() => {
      setRuntime((current) =>
        createRuntimeFromGrid(createBlankGrid(), {
          previousGrid: current.grid,
        }),
      );
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_MEET_YOU_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_SIGNATURE_HOLD_MS);

    const restartTimer = window.setTimeout(() => {
      scheduleGreetingSequenceRef.current();
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_MEET_YOU_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_SIGNATURE_HOLD_MS + LIFE_BLANK_HOLD_MS);

    introTimerRefs.current = [initialTimer, clearTimer, meetTimer, blankTimer, signatureTimer, finalBlankTimer, restartTimer];
  }, []);

  useEffect(() => {
    scheduleGreetingSequenceRef.current = scheduleGreetingSequence;
  }, [scheduleGreetingSequence]);

  useEffect(() => {
    clearIntroSequence();
    if (activeSeedMode === 'greeting' && simulationRunning) {
      scheduleGreetingSequence();
    }

    return clearIntroSequence;
  }, [activeSeedMode, clearIntroSequence, scheduleGreetingSequence, simulationRunning]);

  useEffect(() => {
    if (!simulationRunning || activeSeedMode === 'greeting') {
      return;
    }

    const timer = window.setInterval(() => {
      setRuntime((current) => {
        return createRuntimeFromGrid(stepLifeGrid(current.grid), {
          generation: current.generation + 1,
          previousGrid: current.grid,
        });
      });
    }, LIFE_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSeedMode, simulationRunning]);

  useEffect(() => {
    if (!seedMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (seedMenuRef.current?.contains(target) || seedButtonRef.current?.contains(target)) {
        return;
      }

      setSeedMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSeedMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [seedMenuOpen]);

  const population = useMemo(() => countAliveCells(runtime.grid), [runtime.grid]);
  const patternOptions = useMemo(
    () =>
      (Object.keys(LIFE_PATTERN_PRESETS) as LifePatternId[]).map((patternId) => ({
        id: patternId,
        label: t(`hero.lifePatternNames.${patternId}`),
        preview: LIFE_PATTERN_PRESETS[patternId],
      })),
    [t],
  );
  const seedOptions = useMemo(
    () => [
      {
        id: 'greeting' as const,
        label: t('hero.lifeSeedGreetingLabel'),
        preview: LIFE_GREETING_PREVIEW,
      },
      {
        id: 'random' as const,
        label: t('hero.lifeSeedRandomLabel'),
        preview: LIFE_RANDOM_PREVIEW,
      },
      ...patternOptions,
    ],
    [patternOptions, t],
  );
  const cells = useMemo(
    () =>
      runtime.grid.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => ({
          key: `${rowIndex}:${colIndex}`,
          row: rowIndex,
          col: colIndex,
          alive: cell,
          born: cell && !runtime.previousGrid?.[rowIndex]?.[colIndex],
        })),
      ),
    [runtime.grid, runtime.previousGrid],
  );
  const activeSeedLabel =
    activeSeedMode === 'greeting'
      ? t('hero.lifeSeedGreetingLabel')
      : activeSeedMode === 'random'
      ? t('hero.lifeSeedRandomLabel')
      : patternOptions.find((option) => option.id === activeSeedMode)?.label ?? t('hero.lifeSeedRandomLabel');

  const initializeRuntime = (seedMode: LifeSeedMode) => {
    clearIntroSequence();

    if (seedMode === 'greeting') {
      setActiveSeedMode('greeting');
      setSimulationRunning(true);
      setRuntime(createTextRuntime(LIFE_GREETING_LINES));
      setSeedMenuOpen(false);
      return;
    }

    setActiveSeedMode(seedMode);
    setRuntime(createRuntime(seedMode));
    setSimulationRunning(true);
    setSeedMenuOpen(false);
  };

  const toggleSimulation = () => {
    if (simulationRunning) {
      setSimulationRunning(false);
      return;
    }

    setSimulationRunning(true);
  };

  return (
    <ScrollReveal delay={delay} className="h-full">
      <aside
        className={`home-life-panel relative w-full overflow-hidden ${
          compact ? 'max-w-[31rem] rounded-[1.7rem] p-3 md:p-4' : 'max-w-[35rem] rounded-[2rem] p-4 md:p-5'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/65 to-transparent" />

        <div className={`relative ${compact ? 'grid grid-cols-[minmax(0,1fr)_9rem] gap-3' : ''}`}>
          <div
            className={`${
              compact ? 'order-2 grid auto-rows-fr gap-2.5' : 'grid grid-cols-2 gap-2.5 sm:grid-cols-4'
            }`}
          >
            <div className={`engineering-subpanel rounded-[1.1rem] ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}>
              <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                {t('hero.lifeGenerationLabel')}
              </p>
              <p className="mt-1.5 text-base font-bold text-[var(--color-text-primary)]">{runtime.generation}</p>
            </div>

            <div className={`engineering-subpanel rounded-[1.1rem] ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}>
              <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                {t('hero.lifePopulationLabel')}
              </p>
              <p className="mt-1.5 text-base font-bold text-[var(--color-text-primary)]">{population}</p>
            </div>

            <button
              type="button"
              onClick={toggleSimulation}
              className={`engineering-subpanel flex items-center justify-between rounded-[1.1rem] text-left transition-transform hover:-translate-y-0.5 ${
                compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
              } ${
                simulationRunning ? 'border-emerald-500/25' : ''
              }`}
            >
              <div>
                <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                  {t('hero.lifePlaybackLabel')}
                </p>
                <p className="mt-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">
                  {simulationRunning ? t('hero.lifePauseAction') : t('hero.lifeResumeAction')}
                </p>
              </div>

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                  simulationRunning
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                }`}
              >
                {simulationRunning ? <Pause size={16} /> : <Play size={16} />}
              </div>
            </button>

            <div>
              <button
                ref={seedButtonRef}
                type="button"
                aria-expanded={seedMenuOpen}
                aria-haspopup="dialog"
                onClick={() => setSeedMenuOpen((open) => !open)}
                className={`engineering-subpanel flex w-full items-center justify-between rounded-[1.1rem] text-left transition-transform hover:-translate-y-0.5 ${
                  compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
                } ${
                  seedMenuOpen ? 'border-[var(--color-accent)]/35' : ''
                }`}
              >
                <div>
                  <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                    {t('hero.lifeSeedControlLabel')}
                  </p>
                  <p className="mt-1.5 truncate text-sm font-semibold text-[var(--color-text-primary)]">{activeSeedLabel}</p>
                </div>

                <div className="flex items-center gap-2">
                  <ChevronDown
                    size={16}
                    className={`text-[var(--color-text-secondary)] transition-transform ${seedMenuOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

            </div>
          </div>

          <div
            className={`home-life-grid-shell relative ${
              compact ? 'order-1 mt-0 aspect-square self-start overflow-hidden rounded-[1.35rem] p-2.5' : 'mt-3 overflow-hidden rounded-[1.6rem] p-3'
            }`}
          >
            <div
              className="grid gap-[3px] rounded-[1.25rem] bg-white/75 p-[3px] dark:bg-slate-950/80"
              style={{ gridTemplateColumns: `repeat(${LIFE_COLS}, minmax(0, 1fr))` }}
            >
              {cells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  aria-label={`Toggle cell ${cell.row}-${cell.col}`}
                  aria-pressed={cell.alive}
                  onClick={() =>
                    setRuntime((current) => ({
                      generation: current.generation,
                      previousGrid: current.grid,
                      grid: toggleLifeCell(current.grid, cell.row, cell.col),
                    }))
                  }
                  className={
                    cell.alive
                      ? cell.born
                        ? 'home-life-cell is-born'
                        : 'home-life-cell is-surviving'
                      : 'home-life-cell'
                  }
                />
              ))}
            </div>

            {seedMenuOpen && (
              <div
                ref={seedMenuRef}
                className="absolute inset-[0.65rem] z-20 rounded-[1.1rem] border border-gray-200/80 bg-white/92 p-2.5 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/90"
              >
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
                      {t('hero.lifeSeedMenuLabel')}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--color-text-primary)]">
                      {t('hero.lifeSeedMenuTitle')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSeedMenuOpen(false)}
                    className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]"
                  >
                    {activeSeedLabel}
                  </button>
                </div>

                <div className="grid h-[calc(100%-2.9rem)] grid-cols-3 gap-2">
                  {seedOptions.map((option) => {
                    const previewCols = Math.max(...option.preview.map((row) => row.length));
                    const previewCellSize = previewCols >= 12 ? '0.16rem' : previewCols >= 8 ? '0.2rem' : '0.26rem';
                    const isRandomOption = option.id === 'random';

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => initializeRuntime(option.id)}
                        className={`flex min-h-0 flex-col justify-between rounded-[0.95rem] border px-2 py-2 text-left transition-colors ${
                          activeSeedMode === option.id
                            ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10'
                            : 'border-gray-200/80 bg-white/70 hover:border-[var(--color-accent)]/25 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[11px] font-semibold leading-4 text-[var(--color-text-primary)]">
                            {option.label}
                          </p>
                          {isRandomOption ? <Shuffle size={12} className="shrink-0 text-[var(--color-accent)]" /> : null}
                        </div>

                        <div
                          className="mt-2 grid min-h-0 flex-1 place-content-center rounded-[0.8rem] border border-gray-200/80 bg-white/70 p-1.5 dark:border-slate-700/70 dark:bg-slate-950/70"
                          style={{
                            gridTemplateColumns: `repeat(${previewCols}, ${previewCellSize})`,
                            gap: '1px',
                          }}
                        >
                          {option.preview.flatMap((row, rowIndex) =>
                            row.split('').map((cell, colIndex) => (
                              <span
                                key={`${option.id}:${rowIndex}:${colIndex}`}
                                style={{ height: previewCellSize, width: previewCellSize }}
                                className={
                                  cell === '1'
                                    ? 'block rounded-[2px] bg-[var(--color-accent)] shadow-[0_0_8px_rgba(23,147,209,0.24)]'
                                    : 'block rounded-[2px] bg-slate-200/80 dark:bg-slate-800/90'
                                }
                              />
                            )),
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </ScrollReveal>
  );
}
