import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import { useBlogIndex } from '../../hooks/useBlogIndex';
import { getBlogLanguage, getLocalizedText } from '../../lib/blog';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

type TerminalTone = 'sync' | 'package' | 'ok' | 'warn' | 'dim';

interface TerminalLine {
  text: string;
  tone: TerminalTone;
}

interface HomeRollingShortcut {
  command: string;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

const DEFAULT_LINES = [
  '[core] synchronizing package databases...',
  '[extra] synchronizing package databases...',
  ':: starting full system upgrade...',
  'resolving dependencies...',
  'looking for conflicting packages...',
  'Packages (5) homepage-runtime blog-feed opensource-projects life-runtime markdown-index',
  'Total Download Size: 11.24 MiB',
  ':: Proceed with installation? [Y/n] Y',
  '(1/5) upgrading homepage-runtime',
  '[ALPM] upgraded homepage-runtime (2026.03.08-1 -> 2026.03.09-1)',
  '(2/5) upgrading blog-feed',
  '[ALPM] upgraded blog-feed (1.4.1-1 -> 1.4.2-1)',
  '(3/5) upgrading opensource-projects',
  '[ALPM] upgraded opensource-projects (0.7.2-1 -> 0.7.3-1)',
  '(4/5) upgrading life-runtime',
  '[ALPM] upgraded life-runtime (2.0.9-1 -> 2.1.0-1)',
  '(5/5) upgrading markdown-index',
  '[ALPM-SCRIPTLET] rebuilding /blog cache...',
  '[ALPM] transaction completed',
  ':: system is up to date',
];

function getLineTone(text: string): TerminalTone {
  if (text.startsWith('[core]') || text.startsWith('[extra]') || text.includes('synchronizing')) {
    return 'sync';
  }

  if (text.startsWith('Packages') || text.startsWith('Total')) {
    return 'package';
  }

  if (text.includes('Proceed')) {
    return 'warn';
  }

  if (text.startsWith('[ALPM') || text.includes('completed') || text.includes('up to date')) {
    return 'ok';
  }

  return 'dim';
}

export function HomeRollingUpdatesPanel({ shortcuts }: { shortcuts: HomeRollingShortcut[] }) {
  const { i18n, t } = useTranslation();
  const { index: blogIndex, loading: blogLoading, error: blogError } = useBlogIndex();
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const heroBundle = isRecord(bundle?.hero) ? bundle.hero : {};
  const blogLanguage = getBlogLanguage(i18n.language);

  const title = isString(heroBundle.rollingWindowTitle) ? heroBundle.rollingWindowTitle : 'rolling://updates';
  const status = isString(heroBundle.rollingWindowStatus) ? heroBundle.rollingWindowStatus : 'arch sync';
  const command = isString(heroBundle.rollingCommand)
    ? heroBundle.rollingCommand
    : 'sudo pacman -Syu --needed homepage-runtime blog-feed opensource-projects';
  const recentTitle = isString(heroBundle.rollingRecentTitle) ? heroBundle.rollingRecentTitle : 'recent://blog';
  const recentLoading = t('hero.rollingRecentLoading');
  const localizedLines = Array.isArray(heroBundle.rollingLines) ? heroBundle.rollingLines.filter(isString) : [];
  const staticLines = (localizedLines.length > 0 ? localizedLines : DEFAULT_LINES).map<TerminalLine>((text) => ({
    text,
    tone: getLineTone(text),
  }));
  const latestArticles = blogIndex?.articles.slice(0, 2).reverse() ?? [];
  const recentBlogLines: TerminalLine[] = blogLoading
    ? []
    : blogError
      ? [{ text: '[blog] failed to fetch latest article index', tone: 'warn' }]
      : latestArticles.length > 0
        ? [
            { text: '[blog] fetched latest article index', tone: 'ok' },
            ...latestArticles.map((article) => ({
              text: `[blog] ${article.date} -> ${getLocalizedText(article.title, blogLanguage)}`,
              tone: 'package' as const,
            })),
          ]
        : [{ text: '[blog] no recent article updates', tone: 'dim' }];
  const terminalLines = [...staticLines, ...recentBlogLines];
  const displayedCount = shouldReduceMotion ? terminalLines.length : visibleCount;
  const linesReady = !blogLoading;
  const lineSignature = terminalLines.map((line) => line.text).join('\n');

  useEffect(() => {
    if (!linesReady) {
      return undefined;
    }

    let timeoutId: number | undefined;

    if (shouldReduceMotion) {
      timeoutId = window.setTimeout(() => {
        setVisibleCount(terminalLines.length);
      }, 0);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    const scheduleNext = (index: number) => {
      setVisibleCount(index);

      if (index >= terminalLines.length) {
        return;
      }

      const delay = index >= staticLines.length ? 680 : 760;
      timeoutId = window.setTimeout(() => {
        scheduleNext(index + 1);
      }, delay);
    };

    const frameId = window.requestAnimationFrame(() => {
      scheduleNext(1);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [lineSignature, linesReady, shouldReduceMotion, staticLines.length, terminalLines.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !linesReady) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  }, [displayedCount, linesReady, shouldReduceMotion]);

  const renderedLines = linesReady ? terminalLines.slice(0, displayedCount) : [];

  return (
    <div className="home-rolling-terminal rounded-[1.7rem] p-4 md:p-5">
      <div className="home-rolling-terminal__header">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <span className="mono-data text-[11px] uppercase tracking-[0.22em] text-slate-300/90">
            {title}
          </span>
        </div>

        <span className="mono-data rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-sky-300">
          {status}
        </span>
      </div>

      <div className="home-rolling-terminal__command">
        <span className="text-sky-300">chiicake@archlinux</span>
        <span className="text-slate-500">:</span>
        <span className="text-cyan-200/90">~</span>
        <span className="text-sky-200">$</span>
        <span className="min-w-0 truncate text-slate-300">{command}</span>
      </div>

      <div ref={viewportRef} className="home-rolling-terminal__viewport scrollbar-hidden">
        <div className="space-y-2">
          {renderedLines.map((line, index) => {
            const isActive = !shouldReduceMotion && index === displayedCount - 1;

            return (
              <div
                key={`${index}-${line.text}`}
                className={`home-rolling-terminal__line is-${line.tone}${isActive ? ' is-active' : ''}`}
              >
                <span className="home-rolling-terminal__line-marker" />
                <span className="min-w-0 break-words">{line.text}</span>
                {isActive ? <span className="home-rolling-terminal__cursor" aria-hidden="true" /> : null}
              </div>
            );
          })}

          {!linesReady ? (
            <div className="home-rolling-terminal__line is-dim">
              <span className="home-rolling-terminal__line-marker" />
              <span className="min-w-0 break-words">{`[blog] ${recentLoading}`}</span>
            </div>
          ) : null}
        </div>
      </div>

      {shortcuts.length > 0 ? (
        <div className="home-rolling-terminal__shortcuts">
          {shortcuts.map((shortcut) => {
            const content = (
              <>
                <span className="home-rolling-terminal__shortcut-command">{shortcut.command}</span>
                <span className="home-rolling-terminal__shortcut-label">{shortcut.label}</span>
              </>
            );

            if (shortcut.href) {
              if (shortcut.external) {
                return (
                  <a
                    key={`${shortcut.command}-${shortcut.label}`}
                    href={shortcut.href}
                    target="_blank"
                    rel="noreferrer"
                    className="home-rolling-terminal__shortcut"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link key={`${shortcut.command}-${shortcut.label}`} to={shortcut.href} className="home-rolling-terminal__shortcut">
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={`${shortcut.command}-${shortcut.label}`}
                type="button"
                onClick={shortcut.onClick}
                className="home-rolling-terminal__shortcut"
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}

      {latestArticles.length > 0 ? (
        <div className="home-rolling-terminal__updates">
          <div className="home-rolling-terminal__updates-header">
            <span className="engineering-kicker">{recentTitle}</span>
          </div>

          <div className="space-y-2">
            {latestArticles.map((article) => (
              <Link key={article.slug} to={`/blog/${article.slug}`} className="home-rolling-terminal__update-link">
                <span className="home-rolling-terminal__update-command">
                  {`$ open /blog/${article.slug}`}
                </span>
                <span className="home-rolling-terminal__update-title">
                  {getLocalizedText(article.title, blogLanguage)}
                </span>
                <span className="home-rolling-terminal__update-date mono-data">{article.date}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
