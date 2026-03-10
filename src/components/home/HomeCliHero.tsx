import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { HomeRollingUpdatesPanel, type HomeRollingShortcut } from './HomeRollingUpdatesPanel';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

type IntroEntry =
  | { type: 'command'; value: string }
  | { type: 'ascii-line'; full?: string; compact?: string; key: string }
  | { type: 'comment'; value: string; muted?: boolean; key?: string }
  | { type: 'section'; label: string; meta: string }
  | { type: 'shortcut'; shortcut: HomeRollingShortcut; index: number }
  | { type: 'gap'; key: string };

const INTRO_STEP_DELAY_MS = 130;

export function HomeCliHero({ shortcuts }: { shortcuts: HomeRollingShortcut[] }) {
  const { i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const shellBodyRef = useRef<HTMLDivElement | null>(null);
  const previousShellHeightRef = useRef(0);
  const [visibleIntroCount, setVisibleIntroCount] = useState(0);

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const heroBundle = isRecord(bundle?.hero) ? bundle.hero : {};
  const cliBundle = isRecord(heroBundle.cli) ? heroBundle.cli : {};

  const asciiLines = useMemo(
    () => (Array.isArray(cliBundle.ascii) ? cliBundle.ascii.filter(isString) : []),
    [cliBundle.ascii],
  );
  const compactAsciiLines = useMemo(
    () => (Array.isArray(cliBundle.asciiCompact) ? cliBundle.asciiCompact.filter(isString) : []),
    [cliBundle.asciiCompact],
  );
  const helperLines = useMemo(
    () => (Array.isArray(cliBundle.hints) ? cliBundle.hints.filter(isString) : []),
    [cliBundle.hints],
  );
  const heroCommand = isString(cliBundle.command) ? cliBundle.command : '0 chiicake@archlinux ~ % cat /home/chiicake/README';
  const subtitle = isString(cliBundle.subtitle) ? cliBundle.subtitle : '# Rust / Go backend engineer';
  const secondary = isString(cliBundle.secondary)
    ? cliBundle.secondary
    : '# systems / tooling / distributed practice';
  const actionsLabel = isString(cliBundle.actionsLabel) ? cliBundle.actionsLabel : 'primary commands';
  const actionsHint = isString(cliBundle.actionsHint) ? cliBundle.actionsHint : 'click / enter';
  const runtimeLabel = isString(cliBundle.runtimeLabel) ? cliBundle.runtimeLabel : 'interactive shell';
  const runtimeHint = isString(cliBundle.runtimeHint) ? cliBundle.runtimeHint : 'help · Tab · history';
  const headerEdition = isString(cliBundle.headerEdition) ? cliBundle.headerEdition : 'ASCII Hero Edition';

  const introEntries = useMemo<IntroEntry[]>(
    () => [
      { type: 'command', value: heroCommand },
      ...Array.from({ length: Math.max(asciiLines.length, compactAsciiLines.length) }, (_, index) => ({
        type: 'ascii-line' as const,
        key: `ascii-line-${index}`,
        full: asciiLines[index],
        compact: compactAsciiLines[index],
      })),
      { type: 'comment', value: subtitle },
      { type: 'comment', value: secondary, muted: true },
      { type: 'gap', key: 'gap-hero' },
      { type: 'section', label: actionsLabel, meta: actionsHint },
      ...shortcuts.map((shortcut, index) => ({ type: 'shortcut' as const, shortcut, index })),
      ...helperLines.map((line, index) => ({ type: 'comment' as const, value: line, muted: true, key: `hint-${index}` })),
      { type: 'gap', key: 'gap-runtime' },
      { type: 'section', label: runtimeLabel, meta: runtimeHint },
    ],
    [actionsHint, actionsLabel, asciiLines, compactAsciiLines, helperLines, heroCommand, runtimeHint, runtimeLabel, secondary, shortcuts, subtitle],
  );

  useEffect(() => {
    let timeoutId: number | undefined;

    if (shouldReduceMotion) {
      timeoutId = window.setTimeout(() => {
        setVisibleIntroCount(introEntries.length);
      }, 0);

      return undefined;
    }

    let cancelled = false;

    const revealStep = (index: number) => {
      if (cancelled) {
        return;
      }

      setVisibleIntroCount(index);

      if (index >= introEntries.length) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        revealStep(index + 1);
      }, INTRO_STEP_DELAY_MS);
    };

    timeoutId = window.setTimeout(() => {
      revealStep(0);
    }, 0);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [i18n.language, introEntries.length, shouldReduceMotion]);

  useEffect(() => {
    const body = shellBodyRef.current;
    if (!body) {
      return;
    }

    window.requestAnimationFrame(() => {
      const currentHeight = body.scrollHeight;
      const clientHeight = body.clientHeight;
      const maxScrollTop = currentHeight - clientHeight;
      const previousHeight = previousShellHeightRef.current;
      const previousOverflow = previousHeight > clientHeight;
      const deltaHeight = Math.max(0, currentHeight - previousHeight);

      if (maxScrollTop <= 0) {
        body.scrollTop = 0;
        previousShellHeightRef.current = currentHeight;
        return;
      }

      const nextScrollTop = previousOverflow
        ? Math.min(maxScrollTop, body.scrollTop + deltaHeight)
        : maxScrollTop;

      body.scrollTo({
        top: nextScrollTop,
        behavior: 'auto',
      });

      previousShellHeightRef.current = currentHeight;
    });
  }, [shouldReduceMotion, visibleIntroCount]);

  const renderShortcutAction = (shortcut: HomeRollingShortcut, index: number) => {
    const content = (
      <>
        <span className="home-cli-shell__action-index mono-data">{`[${String(index + 1).padStart(2, '0')}]`}</span>
        <span className="home-cli-shell__action-command mono-data">{shortcut.command}</span>
        <span className="home-cli-shell__action-label">{shortcut.label}</span>
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
            className="home-cli-shell__action"
          >
            {content}
          </a>
        );
      }

      return (
        <Link key={`${shortcut.command}-${shortcut.label}`} to={shortcut.href} className="home-cli-shell__action">
          {content}
        </Link>
      );
    }

    return (
      <button
        key={`${shortcut.command}-${shortcut.label}`}
        type="button"
        onClick={shortcut.onClick}
        className="home-cli-shell__action"
      >
        {content}
      </button>
    );
  };

  const introComplete = visibleIntroCount >= introEntries.length;

  return (
    <div className="relative h-[100svh] overflow-hidden px-4 pb-4 pt-24 sm:px-6 lg:px-8 lg:pb-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(23,147,209,0.12),transparent_48%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,147,209,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,147,209,0.05)_1px,transparent_1px)] bg-[size:18px_18px] opacity-65" />
      </div>

      <div className="mx-auto h-full w-full max-w-7xl">
        <section className="home-cli-shell home-cli-shell--fullscreen">
          <div className="home-cli-shell__header">
            <span className="home-cli-shell__tty mono-data">/dev/pts/0</span>
            <div className="home-cli-shell__signals">
              <span className="home-cli-shell__signal mono-data">archlinux</span>
              <span className="home-cli-shell__signal mono-data is-muted">zsh</span>
              <span className="home-cli-shell__signal mono-data is-muted">{headerEdition}</span>
            </div>
          </div>

          <div ref={shellBodyRef} className="home-cli-shell__body home-cli-shell__body--stream scrollbar-hidden">
            {introEntries.slice(0, visibleIntroCount).map((entry, index) => {
              if (entry.type === 'command') {
                return (
                  <p key={`command-${index}`} className="home-cli-shell__command mono-data">
                    {entry.value}
                  </p>
                );
              }

              if (entry.type === 'ascii-line') {
                return (
                  <div key={entry.key} className="home-cli-shell__ascii-line-block">
                    <pre className="home-cli-shell__ascii-line home-cli-shell__ascii-line--full mono-data">
                      {entry.full ?? ' '}
                    </pre>
                    <pre className="home-cli-shell__ascii-line home-cli-shell__ascii-line--compact mono-data">
                      {entry.compact ?? ' '}
                    </pre>
                  </div>
                );
              }

              if (entry.type === 'comment') {
                return (
                  <p
                    key={`${entry.value}-${index}`}
                    className={`home-cli-shell__comment${entry.muted ? ' is-muted' : ''}`}
                  >
                    {entry.value}
                  </p>
                );
              }

              if (entry.type === 'section') {
                return (
                  <div key={`${entry.label}-${index}`} className="home-cli-shell__panel-header home-cli-shell__panel-header--stream">
                    <span className="engineering-kicker">{entry.label}</span>
                    <span className="home-cli-shell__panel-meta mono-data">{entry.meta}</span>
                  </div>
                );
              }

              if (entry.type === 'shortcut') {
                return renderShortcutAction(entry.shortcut, entry.index);
              }

              return <div key={entry.key} className="home-cli-shell__gap" aria-hidden="true" />;
            })}

            {introComplete ? (
              <div className="home-cli-shell__runtime-stream">
                <HomeRollingUpdatesPanel
                  shortcuts={shortcuts}
                  variant="embedded"
                  showShortcuts={false}
                  showUpdates={false}
                  viewportMode="content"
                  scrollTargetRef={shellBodyRef}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
