import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  countAliveCells,
  createLifeGrid,
  stepLifeGrid,
  toggleLifeCell,
  type LifeGrid,
} from '../../lib/gameOfLife';
import { ScrollReveal } from '../animations/ScrollReveal';

const LIFE_ROWS = 21;
const LIFE_COLS = 19;
const LIFE_DENSITY = 0.26;
const LIFE_TICK_MS = 500;

interface LifeRuntime {
  generation: number;
  grid: LifeGrid;
}

function createRuntime(): LifeRuntime {
  return {
    generation: 0,
    grid: createLifeGrid({ rows: LIFE_ROWS, cols: LIFE_COLS, density: LIFE_DENSITY }),
  };
}

export function HomeLifePanel() {
  const { t } = useTranslation();
  const [runtime, setRuntime] = useState<LifeRuntime>(() => createRuntime());

  useEffect(() => {
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
  }, []);

  const population = useMemo(() => countAliveCells(runtime.grid), [runtime.grid]);
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

            <button
              type="button"
              onClick={() => setRuntime(createRuntime())}
              className="engineering-subpanel flex items-center justify-between rounded-[1.1rem] px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div>
                <p className="mono-data text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                  {t('hero.lifeResetLabel')}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">{t('hero.lifeResetAction')}</p>
              </div>
              <RefreshCcw size={18} className="text-[var(--color-accent)]" />
            </button>
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
