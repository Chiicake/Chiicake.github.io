import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, RefreshCcw, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  LIFE_PATTERN_PRESETS,
  countAliveCells,
  createEmptyLifeGrid,
  createLifeGrid,
  createLifePatternGrid,
  createLifeTextGrid,
  stepLifeGrid,
  toggleLifeCell,
  type LifeGrid,
  type LifePatternId,
} from '../../lib/gameOfLife';
import { ScrollReveal } from '../animations/ScrollReveal';

const LIFE_ROWS = 21;
const LIFE_COLS = 19;
const LIFE_DENSITY = 0.26;
const LIFE_TICK_MS = 500;
const LIFE_GREETING_HOLD_MS = 5_000;
const LIFE_BLANK_HOLD_MS = 500;
const LIFE_MEET_YOU_HOLD_MS = 5_000;
const LIFE_GREETING_LINES = ['HI!', "I'M", 'CHII', 'CAKE'];
const LIFE_MEET_YOU_LINES = ['NICE', 'TO', 'MEET', 'YOU!'];
const LIFE_RANDOM_PREVIEW = ['1010', '0110', '1101', '0011'];

interface LifeRuntime {
  generation: number;
  grid: LifeGrid;
}

type LifeSeedMode = 'greeting' | 'random' | LifePatternId;

function createTextRuntime(lines: string[]): LifeRuntime {
  return {
    generation: 0,
    grid: createLifeTextGrid({
      rows: LIFE_ROWS,
      cols: LIFE_COLS,
      lines,
    }),
  };
}

function createRuntime(seedMode: LifeSeedMode = 'random'): LifeRuntime {
  return {
    generation: 0,
    grid:
      seedMode === 'greeting'
        ? createTextRuntime(LIFE_GREETING_LINES).grid
        : seedMode === 'random'
        ? createLifeGrid({ rows: LIFE_ROWS, cols: LIFE_COLS, density: LIFE_DENSITY })
        : createLifePatternGrid({
            rows: LIFE_ROWS,
            cols: LIFE_COLS,
            patternId: seedMode,
            repeatRows: 3,
            repeatCols: 3,
          }),
  };
}

export function HomeLifePanel() {
  const { t } = useTranslation();
  const [runtime, setRuntime] = useState<LifeRuntime>(() => createTextRuntime(LIFE_GREETING_LINES));
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [seedMenuOpen, setSeedMenuOpen] = useState(false);
  const [activeSeedMode, setActiveSeedMode] = useState<LifeSeedMode>('greeting');
  const seedButtonRef = useRef<HTMLButtonElement | null>(null);
  const seedMenuRef = useRef<HTMLDivElement | null>(null);
  const introTimerRefs = useRef<number[]>([]);

  useEffect(() => {
    const clearIntroTimers = () => {
      introTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
      introTimerRefs.current = [];
    };

    clearIntroTimers();

    const clearTimer = window.setTimeout(() => {
      setRuntime({
        generation: 0,
        grid: createEmptyLifeGrid({ rows: LIFE_ROWS, cols: LIFE_COLS }),
      });
    }, LIFE_GREETING_HOLD_MS);

    const meetTimer = window.setTimeout(() => {
      setRuntime(createTextRuntime(LIFE_MEET_YOU_LINES));
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS);

    const startTimer = window.setTimeout(() => {
      setSimulationRunning(true);
    }, LIFE_GREETING_HOLD_MS + LIFE_BLANK_HOLD_MS + LIFE_MEET_YOU_HOLD_MS);

    introTimerRefs.current = [clearTimer, meetTimer, startTimer];

    return clearIntroTimers;
  }, []);

  useEffect(() => {
    if (!simulationRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setRuntime((current) => {
        return {
          generation: current.generation + 1,
          grid: stepLifeGrid(current.grid),
        };
      });
    }, LIFE_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [simulationRunning]);

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
        })),
      ),
    [runtime.grid],
  );
  const activeSeedLabel =
    activeSeedMode === 'greeting'
      ? t('hero.lifeSeedGreetingLabel')
      : activeSeedMode === 'random'
      ? t('hero.lifeSeedRandomLabel')
      : patternOptions.find((option) => option.id === activeSeedMode)?.label ?? t('hero.lifeSeedRandomLabel');

  const initializeRuntime = (seedMode: LifeSeedMode) => {
    introTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    introTimerRefs.current = [];
    setActiveSeedMode(seedMode);
    setRuntime(createRuntime(seedMode));
    setSimulationRunning(seedMode !== 'greeting');
    setSeedMenuOpen(false);
  };

  return (
    <ScrollReveal delay={0.45} className="h-full">
      <aside className="home-life-panel relative w-full max-w-[30rem] overflow-hidden rounded-[2rem] p-4 md:p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/65 to-transparent" />

        <div className="relative">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="engineering-subpanel rounded-[1.1rem] px-3 py-2.5">
              <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                {t('hero.lifeGenerationLabel')}
              </p>
              <p className="mt-1.5 text-base font-bold text-[var(--color-text-primary)]">{runtime.generation}</p>
            </div>

            <div className="engineering-subpanel rounded-[1.1rem] px-3 py-2.5">
              <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                {t('hero.lifePopulationLabel')}
              </p>
              <p className="mt-1.5 text-base font-bold text-[var(--color-text-primary)]">{population}</p>
            </div>

            <div className="relative">
              <button
                ref={seedButtonRef}
                type="button"
                aria-expanded={seedMenuOpen}
                aria-haspopup="dialog"
                onClick={() => setSeedMenuOpen((open) => !open)}
                className={`engineering-subpanel flex w-full items-center justify-between rounded-[1.1rem] px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5 ${
                  seedMenuOpen ? 'border-[var(--color-accent)]/35' : ''
                }`}
              >
                <div>
                  <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                    {t('hero.lifeResetLabel')}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">{t('hero.lifeResetAction')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <RefreshCcw size={18} className="text-[var(--color-accent)]" />
                  <ChevronDown
                    size={16}
                    className={`text-[var(--color-text-secondary)] transition-transform ${seedMenuOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {seedMenuOpen && (
                <div
                  ref={seedMenuRef}
                  className="absolute right-0 top-full z-20 mt-2 w-[19rem] rounded-[1.35rem] border border-gray-200/80 bg-white/92 p-3 shadow-[0_20px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/92"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
                        {t('hero.lifeSeedMenuLabel')}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                        {t('hero.lifeSeedMenuTitle')}
                      </p>
                    </div>

                    <span className="rounded-full bg-[var(--color-accent)]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                      {activeSeedLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {seedOptions.map((option) => {
                      const previewCols = Math.max(...option.preview.map((row) => row.length));
                      const isRandomOption = option.id === 'random';

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => initializeRuntime(option.id)}
                          className={`rounded-[1rem] border px-2.5 py-2.5 text-left transition-colors ${
                            activeSeedMode === option.id
                              ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/10'
                              : 'border-gray-200/80 bg-white/70 hover:border-[var(--color-accent)]/25 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/70 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div
                            className="grid min-h-[4.2rem] place-content-center rounded-[0.9rem] border border-gray-200/80 bg-white/70 p-2 dark:border-slate-700/70 dark:bg-slate-950/70"
                            style={{ gridTemplateColumns: `repeat(${previewCols}, 0.42rem)`, gap: '2px' }}
                          >
                            {isRandomOption ? (
                              option.preview.flatMap((row, rowIndex) =>
                                row.split('').map((cell, colIndex) => (
                                  <span
                                    key={`${option.id}:${rowIndex}:${colIndex}`}
                                    className={
                                      cell === '1'
                                        ? 'block h-[0.42rem] w-[0.42rem] rounded-[2px] bg-[var(--color-accent)] shadow-[0_0_10px_rgba(99,102,241,0.32)]'
                                        : 'block h-[0.42rem] w-[0.42rem] rounded-[2px] bg-slate-200/80 dark:bg-slate-800/90'
                                    }
                                  />
                                )),
                              )
                            ) : (
                              option.preview.flatMap((row, rowIndex) =>
                                row.split('').map((cell, colIndex) => (
                                  <span
                                    key={`${option.id}:${rowIndex}:${colIndex}`}
                                    className={
                                      cell === '1'
                                        ? 'block h-[0.42rem] w-[0.42rem] rounded-[2px] bg-[var(--color-accent)] shadow-[0_0_10px_rgba(99,102,241,0.32)]'
                                        : 'block h-[0.42rem] w-[0.42rem] rounded-[2px] bg-slate-200/80 dark:bg-slate-800/90'
                                    }
                                  />
                                )),
                              )
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            {isRandomOption && <Shuffle size={14} className="text-[var(--color-accent)]" />}
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{option.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="home-life-grid-shell relative mt-3 rounded-[1.6rem] p-3">
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
                      ...current,
                      grid: toggleLifeCell(current.grid, cell.row, cell.col),
                    }))
                  }
                  className={cell.alive ? 'home-life-cell is-alive' : 'home-life-cell'}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </ScrollReveal>
  );
}
