import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  advanceSnakeGame,
  createSnakeGame,
  setSnakeDirection,
  type SnakeCell,
  type SnakeDirection,
  type SnakeGameState,
  type SnakeStatus,
} from '../../lib/snake';

const SNAKE_BEST_SCORE_STORAGE_KEY = 'chiicake-about-snake-best-score';

function readBestScore() {
  if (typeof window === 'undefined') {
    return 0;
  }

  const rawValue = window.localStorage.getItem(SNAKE_BEST_SCORE_STORAGE_KEY);
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function toCellKey(cell: SnakeCell) {
  return `${cell.row}:${cell.col}`;
}

function getStatusLabel(status: SnakeStatus, t: (key: string) => string) {
  switch (status) {
    case 'running':
      return t('about.snakeStatusRunning');
    case 'paused':
      return t('about.snakeStatusPaused');
    case 'lost':
      return t('about.snakeStatusLost');
    case 'won':
      return t('about.snakeStatusWon');
    case 'idle':
      return t('about.snakeStatusIdle');
  }
}

function getOverlayCopy(status: SnakeStatus, t: (key: string) => string) {
  switch (status) {
    case 'paused':
      return {
        title: t('about.snakeOverlayPausedTitle'),
        description: t('about.snakeOverlayPausedDescription'),
      };
    case 'lost':
      return {
        title: t('about.snakeOverlayLostTitle'),
        description: t('about.snakeOverlayLostDescription'),
      };
    case 'won':
      return {
        title: t('about.snakeOverlayWonTitle'),
        description: t('about.snakeOverlayWonDescription'),
      };
    case 'idle':
      return {
        title: t('about.snakeOverlayIdleTitle'),
        description: t('about.snakeOverlayIdleDescription'),
      };
    case 'running':
      return null;
  }
}

export function AboutSnakePanel() {
  const { t } = useTranslation();
  const [game, setGame] = useState<SnakeGameState>(() => createSnakeGame({ bestScore: readBestScore() }));
  const boardRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.localStorage.setItem(SNAKE_BEST_SCORE_STORAGE_KEY, String(game.bestScore));
  }, [game.bestScore]);

  useEffect(() => {
    if (game.status !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setGame((current) => advanceSnakeGame(current));
    }, game.tickMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [game.status, game.tickMs]);

  const handleDirectionInput = (direction: SnakeDirection) => {
    setGame((current) => {
      const next = setSnakeDirection(current, direction);

      if (current.status === 'idle') {
        return { ...next, status: 'running' };
      }

      if (current.status === 'lost' || current.status === 'won') {
        return {
          ...setSnakeDirection(
            createSnakeGame({ boardSize: current.boardSize, bestScore: current.bestScore }),
            direction,
          ),
          status: 'running',
        };
      }

      return next;
    });
  };

  const handleToggle = () => {
    setGame((current) => {
      if (current.status === 'running') {
        return { ...current, status: 'paused' };
      }

      if (current.status === 'paused' || current.status === 'idle') {
        return { ...current, status: 'running' };
      }

      return { ...createSnakeGame({ boardSize: current.boardSize, bestScore: current.bestScore }), status: 'running' };
    });
  };

  const handleReset = () => {
    setGame((current) => createSnakeGame({ boardSize: current.boardSize, bestScore: current.bestScore }));
  };

  const handleBoardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();

    if (key === 'arrowup' || key === 'w') {
      event.preventDefault();
      handleDirectionInput('up');
      return;
    }

    if (key === 'arrowdown' || key === 's') {
      event.preventDefault();
      handleDirectionInput('down');
      return;
    }

    if (key === 'arrowleft' || key === 'a') {
      event.preventDefault();
      handleDirectionInput('left');
      return;
    }

    if (key === 'arrowright' || key === 'd') {
      event.preventDefault();
      handleDirectionInput('right');
      return;
    }

    if (key === ' ' || key === 'spacebar') {
      event.preventDefault();
      handleToggle();
      return;
    }

    if (key === 'r' || key === 'enter') {
      event.preventDefault();
      handleReset();
    }
  };

  const snakeCells = new Set(game.snake.map((segment) => toCellKey(segment)));
  const headCellKey = toCellKey(game.snake[0]);
  const foodCellKey = game.food ? toCellKey(game.food) : null;
  const overlayCopy = getOverlayCopy(game.status, t);
  const boardCells = Array.from({ length: game.boardSize * game.boardSize }, (_, index) => {
    const row = Math.floor(index / game.boardSize);
    const col = index % game.boardSize;
    const key = `${row}:${col}`;
    const isHead = key === headCellKey;
    const isFood = key === foodCellKey;
    const isSnake = snakeCells.has(key);

    return {
      key,
      isHead,
      isFood,
      isSnake,
    };
  });

  const controlButtons: Array<{ label: string; icon: typeof ArrowUp; direction: SnakeDirection; className: string }> = [
    { label: t('about.snakeDirectionUp'), icon: ArrowUp, direction: 'up', className: 'col-start-2 row-start-1' },
    { label: t('about.snakeDirectionLeft'), icon: ArrowLeft, direction: 'left', className: 'col-start-1 row-start-2' },
    { label: t('about.snakeDirectionRight'), icon: ArrowRight, direction: 'right', className: 'col-start-3 row-start-2' },
    { label: t('about.snakeDirectionDown'), icon: ArrowDown, direction: 'down', className: 'col-start-2 row-start-3' },
  ];

  return (
    <div className="engineering-panel flex h-full min-h-[420px] flex-col rounded-[2rem] p-4 md:min-h-[520px] md:p-6">
      <div className="max-w-3xl text-base leading-7 text-[var(--color-text-secondary)] md:text-[1rem]">
        <p>{t('about.snakeTitle')}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:mt-auto xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
        <div className="engineering-subpanel rounded-[1.75rem] p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="mono-data text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                {t('about.snakeBoardLabel')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleToggle}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-3.5 py-2 text-sm font-semibold text-[var(--color-accent)] transition-transform hover:-translate-y-0.5"
              >
                {game.status === 'running' ? <Pause size={15} /> : <Play size={15} />}
                {game.status === 'running' ? t('about.snakePauseAction') : t('about.snakeStartAction')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/80 px-3.5 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-transform hover:-translate-y-0.5 dark:border-slate-800/70 dark:bg-slate-900/60"
              >
                <RotateCcw size={15} />
                {t('about.snakeResetAction')}
              </button>
            </div>
          </div>

          <div className="about-snake-screen relative mt-4 rounded-[1.5rem] border border-gray-200/80 p-2.5 md:mt-5 md:p-3 dark:border-slate-800/70">
            <div
              ref={boardRegionRef}
              role="application"
              tabIndex={0}
              aria-label={t('about.snakeTitle')}
              aria-describedby="about-snake-controls-hint"
              aria-live="polite"
              onKeyDown={handleBoardKeyDown}
              className="grid aspect-square w-full gap-[3px] rounded-[1.25rem] bg-slate-200/65 p-[3px] dark:bg-slate-950/80"
              style={{ gridTemplateColumns: `repeat(${game.boardSize}, minmax(0, 1fr))` }}
            >
              {boardCells.map((cell) => (
                <div
                  key={cell.key}
                  className={[
                    'about-snake-cell rounded-[7px]',
                    cell.isHead
                      ? 'bg-[var(--color-accent)] shadow-[0_0_24px_rgba(37,99,235,0.28)]'
                      : cell.isSnake
                        ? 'bg-[var(--color-accent)]/72'
                        : cell.isFood
                          ? 'animate-pulse bg-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.3)]'
                          : 'bg-white/80 dark:bg-slate-800/80',
                  ].join(' ')}
                />
              ))}
            </div>

            {overlayCopy ? (
              <div className="absolute inset-3 flex items-center justify-center rounded-[1.25rem] bg-slate-950/20 p-5 backdrop-blur-[2px] dark:bg-slate-950/40">
                <div className="max-w-xs rounded-[1.5rem] border border-white/40 bg-white/82 px-5 py-4 text-center shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:border-slate-700/70 dark:bg-slate-900/82">
                  <p className="mono-data text-[11px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    {getStatusLabel(game.status, t)}
                  </p>
                  <h4 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">{overlayCopy.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{overlayCopy.description}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="engineering-subpanel rounded-[1.75rem] p-4">
          <p className="mono-data text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
            {t('about.snakeStatusPanelTitle')}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-[1.25rem] border border-gray-200/80 bg-white/80 p-3 dark:border-slate-800/70 dark:bg-slate-900/55">
              <p className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                {t('about.snakeStatusLabel')}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
                {getStatusLabel(game.status, t)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-gray-200/80 bg-white/80 p-3 dark:border-slate-800/70 dark:bg-slate-900/55">
              <p className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                {t('about.snakeTickLabel')}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">{game.tickMs} ms</p>
            </div>
            <div className="rounded-[1.25rem] border border-gray-200/80 bg-white/80 p-3 dark:border-slate-800/70 dark:bg-slate-900/55">
              <p className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                {t('about.snakeScoreLabel')}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">{game.score}</p>
            </div>
            <div className="rounded-[1.25rem] border border-gray-200/80 bg-white/80 p-3 dark:border-slate-800/70 dark:bg-slate-900/55">
              <p className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                {t('about.snakeBestLabel')}
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">{game.bestScore}</p>
            </div>
          </div>

          <p className="mono-data mt-5 text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
            {t('about.snakeControlsTitle')}
          </p>

          <p id="about-snake-controls-hint" className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            {t('about.snakeOverlayIdleDescription')} {t('about.snakeResetAction')}: R / Enter.
          </p>

          <div className="mx-auto mt-4 grid w-[160px] grid-cols-3 grid-rows-3 gap-2 md:w-[172px]">
            {controlButtons.map(({ className, direction, icon: Icon, label }) => (
              <button
                key={direction}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => handleDirectionInput(direction)}
                className={`${className} inline-flex h-12 w-12 items-center justify-center rounded-[1rem] border border-gray-200/80 bg-white/80 text-[var(--color-text-primary)] transition-transform hover:-translate-y-0.5 md:h-14 md:w-14 md:rounded-[1.1rem] dark:border-slate-800/70 dark:bg-slate-900/55`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
