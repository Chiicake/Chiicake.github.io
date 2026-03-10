import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router';
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
type TerminalCommandGroup = 'builtin' | 'navigation' | 'recent';

interface TerminalLine {
  text: string;
  tone: TerminalTone;
}

interface TerminalHistoryEntry extends TerminalLine {
  id: string;
}

interface HomeRollingShortcut {
  command: string;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}

interface TerminalCommandSpec {
  command: string;
  normalized: string;
  group: TerminalCommandGroup;
  description: string;
  execute?: () => void;
  successMessage?: string;
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
const TERMINAL_SCROLL_DELAY_MS = 190;
const TERMINAL_SCROLL_DELAY_RECENT_MS = 170;
const TERMINAL_PROMPT_DELAY_MS = 300;
const PROMPT_HOST = 'chiicake@archlinux';
const PROMPT_PATH = '~';
const PROMPT_SYMBOL = '%';

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

function getPromptPrefix(status: 0 | 1) {
  return `${status} ${PROMPT_HOST} ${PROMPT_PATH} ${PROMPT_SYMBOL}`;
}

function getCommonPrefix(values: string[]) {
  if (values.length === 0) {
    return '';
  }

  let prefix = values[0];

  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix) && prefix.length > 0) {
      prefix = prefix.slice(0, -1);
    }
  }

  return prefix;
}

function formatHelpRow(command: string, description: string) {
  return `  ${command.padEnd(30, ' ')} ${description}`;
}

export type { HomeRollingShortcut };

export function HomeRollingUpdatesPanel({
  shortcuts,
  variant = 'default',
  showShortcuts = true,
  showUpdates = true,
  viewportMode = 'internal',
  scrollTargetRef,
  mode = 'full',
  onBootComplete,
}: {
  shortcuts: HomeRollingShortcut[];
  variant?: 'default' | 'embedded';
  showShortcuts?: boolean;
  showUpdates?: boolean;
  viewportMode?: 'internal' | 'content';
  scrollTargetRef?: RefObject<HTMLElement | null>;
  mode?: 'full' | 'updates-only' | 'prompt-only';
  onBootComplete?: () => void;
}) {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { index: blogIndex, loading: blogLoading, error: blogError } = useBlogIndex();
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(1);
  const [lastCommandStatus, setLastCommandStatus] = useState<0 | 1>(0);
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<TerminalHistoryEntry[]>([]);
  const [submittedCommands, setSubmittedCommands] = useState<string[]>([]);
  const [promptVisible, setPromptVisible] = useState(false);
  const [caretIndex, setCaretIndex] = useState(0);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const historyIdRef = useRef(0);
  const historyDraftRef = useRef('');
  const lastCompletionQueryRef = useRef('');
  const previousScrollHeightRef = useRef(0);
  const bootCompleteRef = useRef(false);

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const heroBundle = isRecord(bundle?.hero) ? bundle.hero : {};
  const blogLanguage = getBlogLanguage(i18n.language);

  const command = isString(heroBundle.rollingCommand)
    ? heroBundle.rollingCommand
    : 'sudo pacman -Syu --needed homepage-runtime blog-feed opensource-projects';
  const recentTitle = isString(heroBundle.rollingRecentTitle) ? heroBundle.rollingRecentTitle : 'recent://blog';
  const recentLoading = t('hero.rollingRecentLoading');
  const promptPlaceholder = t('hero.rollingPromptPlaceholder');
  const localizedLines = Array.isArray(heroBundle.rollingLines) ? heroBundle.rollingLines.filter(isString) : [];
  const staticLines = (localizedLines.length > 0 ? localizedLines : DEFAULT_LINES).map<TerminalLine>((text) => ({
    text,
    tone: getLineTone(text),
  }));
  const latestArticles = blogIndex?.articles.slice(0, 2).reverse() ?? [];
  const recentArticleCommands = latestArticles.map((article) => ({
    command: `open /blog/${article.slug}`,
    label: getLocalizedText(article.title, blogLanguage),
    date: article.date,
  }));
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
  const terminalLines = mode === 'prompt-only' ? [] : [...staticLines, ...recentBlogLines];
  const displayedCount = mode === 'prompt-only' ? 0 : shouldReduceMotion ? terminalLines.length : visibleCount;
  const linesReady = mode === 'prompt-only' ? true : !blogLoading;
  const commandReady = linesReady && displayedCount >= terminalLines.length;
  const promptActive = mode !== 'updates-only' && commandReady && promptVisible;
  const lineSignature = terminalLines.map((line) => line.text).join('\n');

  const normalizeCommand = (value: string) => value.replace(/^\$\s*/, '').trim().replace(/\s+/g, ' ').toLowerCase();
  const stripPromptSigil = (value: string) => value.replace(/^\$\s*/, '').trimStart();
  const nextHistoryId = (prefix: string) => {
    historyIdRef.current += 1;
    return `${prefix}-${historyIdRef.current}`;
  };
  const appendHistoryEntries = useCallback((entries: TerminalLine[]) => {
    setCommandHistory((previous) => [
      ...previous,
      ...entries.map((entry, index) => ({
        ...entry,
        id: nextHistoryId(`entry-${index}`),
      })),
    ]);
  }, []);
  const setPromptValue = useCallback((nextValue: string, caret = nextValue.length) => {
    setCommandInput(nextValue);

    window.requestAnimationFrame(() => {
      const input = commandInputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(caret, caret);
      setCaretIndex(caret);
    });
  }, []);
  const focusPromptInput = useCallback(
    (moveToEnd = false) => {
      const input = commandInputRef.current;
      if (!input || !promptActive) {
        return;
      }

      window.requestAnimationFrame(() => {
        input.focus();

        if (moveToEnd) {
          const end = input.value.length;
          input.setSelectionRange(end, end);
          setCaretIndex(end);
        } else {
          const current = input.selectionStart ?? input.value.length;
          setCaretIndex(Math.min(current, input.value.length));
        }
      });
    },
    [promptActive],
  );

  const syncCaretIndex = useCallback((input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }

    const nextIndex = Math.min(input.selectionStart ?? input.value.length, input.value.length);
    setCaretIndex(nextIndex);
  }, []);

  useEffect(() => {
    bootCompleteRef.current = false;
  }, [lineSignature, mode]);

  useEffect(() => {
    if (viewportMode !== 'content') {
      return;
    }

    const scrollTarget = scrollTargetRef?.current;
    if (!scrollTarget) {
      return;
    }

    previousScrollHeightRef.current = scrollTarget.scrollHeight;
  }, [linesReady, scrollTargetRef, viewportMode]);

  const scrollViewportToBottom = useCallback((behavior: ScrollBehavior) => {
    const scrollTarget = viewportMode === 'content' ? scrollTargetRef?.current : viewportRef.current;
    if (!scrollTarget || !linesReady) {
      return;
    }

    window.requestAnimationFrame(() => {
      const currentHeight = scrollTarget.scrollHeight;
      const clientHeight = scrollTarget.clientHeight;

      if (viewportMode === 'content') {
        const previousHeight = previousScrollHeightRef.current;
        const currentOverflow = Math.max(0, currentHeight - clientHeight);
        const previousOverflow = Math.max(0, previousHeight - clientHeight);
        const overflowDelta = Math.max(0, currentOverflow - previousOverflow);

        if (currentOverflow <= 0) {
          scrollTarget.scrollTop = 0;
          previousScrollHeightRef.current = currentHeight;
          return;
        }

        if (overflowDelta <= 0) {
          previousScrollHeightRef.current = currentHeight;
          return;
        }

        const nextScrollTop = Math.min(currentOverflow, scrollTarget.scrollTop + overflowDelta);

        scrollTarget.scrollTo({
          top: nextScrollTop,
          behavior: 'auto',
        });
        previousScrollHeightRef.current = currentHeight;
        return;
      }

      const maxScrollTop = currentHeight - clientHeight;

      if (maxScrollTop <= 0) {
        return;
      }

      scrollTarget.scrollTo({
        top: maxScrollTop,
        behavior,
      });
    });
  }, [linesReady, scrollTargetRef, viewportMode]);

  const executeShortcut = useCallback(
    (shortcut: HomeRollingShortcut) => {
      if (shortcut.href) {
        if (shortcut.external) {
          window.open(shortcut.href, '_blank', 'noreferrer');
          return;
        }

        navigate(shortcut.href);
        return;
      }

      shortcut.onClick?.();
    },
    [navigate],
  );

  const commandSpecs = useMemo<TerminalCommandSpec[]>(() => {
    const builtinCommands: TerminalCommandSpec[] = [
      {
        command: 'help',
        normalized: 'help',
        group: 'builtin',
        description: 'show terminal reference',
      },
    ];

    const navigationCommands = shortcuts.map((shortcut) => ({
      command: shortcut.command.replace(/^\$\s*/, ''),
      normalized: normalizeCommand(shortcut.command),
      group: 'navigation' as const,
      description: shortcut.label,
      execute: () => executeShortcut(shortcut),
      successMessage: shortcut.href
        ? shortcut.external
          ? `launched ${shortcut.href.replace(/^https?:\/\//, '')}`
          : `opened ${shortcut.href}`
        : `moved viewport to ${shortcut.command.replace(/^\$\s*jump\s+/, '')}`,
    }));

    const recentCommands = recentArticleCommands.map((article) => ({
      command: article.command,
      normalized: normalizeCommand(article.command),
      group: 'recent' as const,
      description: `${article.date} · ${article.label}`,
      execute: () => navigate(article.command.replace(/^open\s+/, '')),
      successMessage: `opened ${article.command.replace(/^open\s+/, '')}`,
    }));

    return [...builtinCommands, ...navigationCommands, ...recentCommands];
  }, [executeShortcut, navigate, recentArticleCommands, shortcuts]);

  const getCompletionMatches = useCallback(
    (input: string) => {
      const normalizedInput = normalizeCommand(input);

      if (!normalizedInput) {
        return commandSpecs;
      }

      return commandSpecs.filter((spec) => spec.normalized.startsWith(normalizedInput));
    },
    [commandSpecs],
  );

  const printHelp = useCallback(
    (topic?: string) => {
      const normalizedTopic = topic ? normalizeCommand(topic) : '';
      const target = normalizedTopic ? commandSpecs.find((spec) => spec.normalized === normalizedTopic) : undefined;

      if (normalizedTopic && !target) {
        return [
          { text: `no manual entry for ${normalizedTopic}`, tone: 'warn' as const },
          { text: 'try: help', tone: 'dim' as const },
        ];
      }

      if (target) {
        return [
          { text: 'NAME', tone: 'dim' as const },
          { text: formatHelpRow(target.command, target.description), tone: 'package' as const },
          { text: 'USAGE', tone: 'dim' as const },
          { text: `  ${target.command}`, tone: 'package' as const },
          { text: 'GROUP', tone: 'dim' as const },
          { text: `  ${target.group}`, tone: 'package' as const },
        ];
      }

      const builtins = commandSpecs.filter((spec) => spec.group === 'builtin');
      const navigation = commandSpecs.filter((spec) => spec.group === 'navigation');
      const recent = commandSpecs.filter((spec) => spec.group === 'recent');

      return [
        { text: 'NAME', tone: 'dim' as const },
        { text: '  home-terminal - interactive navigation shell', tone: 'package' as const },
        { text: 'SYNOPSIS', tone: 'dim' as const },
        { text: '  help [command]', tone: 'package' as const },
        { text: 'BUILTINS', tone: 'dim' as const },
        ...builtins.map((spec) => ({ text: formatHelpRow(spec.command, spec.description), tone: 'package' as const })),
        { text: 'NAVIGATION', tone: 'dim' as const },
        ...navigation.map((spec) => ({ text: formatHelpRow(spec.command, spec.description), tone: 'package' as const })),
        ...(recent.length > 0
          ? [
              { text: 'RECENT ENTRIES', tone: 'dim' as const },
              ...recent.map((spec) => ({ text: formatHelpRow(spec.command, spec.description), tone: 'package' as const })),
            ]
          : []),
        { text: 'KEYS', tone: 'dim' as const },
        { text: formatHelpRow('Tab', 'autocomplete commands and recent article paths'), tone: 'package' as const },
        { text: formatHelpRow('Up / Down', 'browse command history'), tone: 'package' as const },
      ];
    },
    [commandSpecs],
  );

  useEffect(() => {
    if (mode === 'prompt-only') {
      setVisibleCount(0);
      return undefined;
    }

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

      const delay = index >= staticLines.length ? TERMINAL_SCROLL_DELAY_RECENT_MS : TERMINAL_SCROLL_DELAY_MS;
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
  }, [lineSignature, linesReady, mode, shouldReduceMotion, staticLines.length, terminalLines.length]);

  useEffect(() => {
    scrollViewportToBottom(shouldReduceMotion ? 'auto' : 'smooth');
  }, [commandHistory.length, displayedCount, linesReady, promptActive, scrollViewportToBottom, shouldReduceMotion]);

  useEffect(() => {
    if (mode === 'updates-only') {
      return;
    }

    if (!commandReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPromptVisible(true);
    }, shouldReduceMotion ? 0 : TERMINAL_PROMPT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [commandReady, mode, shouldReduceMotion]);

  useEffect(() => {
    if (!commandReady || !onBootComplete || bootCompleteRef.current) {
      return;
    }

    bootCompleteRef.current = true;
    onBootComplete();
  }, [commandReady, onBootComplete]);

  useEffect(() => {
    if (!promptActive) {
      return;
    }

    focusPromptInput();
  }, [focusPromptInput, promptActive]);

  const renderedLines = linesReady ? terminalLines.slice(0, displayedCount) : [];
  const visibleCaretIndex = Math.min(caretIndex, commandInput.length);
  const promptBeforeCaret = commandInput.slice(0, visibleCaretIndex);
  const promptCursorChar = commandInput.charAt(visibleCaretIndex) || '\u00A0';
  const promptAfterCaret = commandInput.slice(visibleCaretIndex + (commandInput.charAt(visibleCaretIndex) ? 1 : 0));
  const handleCommandSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const rawInput = commandInput.trim();
    if (!rawInput || !commandReady) {
      return;
    }

    const sanitizedInput = rawInput.replace(/^\$\s*/, '');
    const normalizedInput = normalizeCommand(sanitizedInput);
    const promptStatusAtSubmit = lastCommandStatus;
    const matchedCommand = commandSpecs.find((spec) => spec.normalized === normalizedInput);
    const helpTopic = normalizedInput.startsWith('help ') ? normalizedInput.slice(5) : '';
    const helpCommand = normalizedInput === 'help' || normalizedInput.startsWith('help ');
    const inputHistoryEntries: TerminalLine[] = [
      {
        text: `${getPromptPrefix(promptStatusAtSubmit)} ${sanitizedInput}`,
        tone: 'package',
      },
    ];

    setSubmittedCommands((previous) => [...previous, sanitizedInput]);
    setHistoryCursor(null);
    historyDraftRef.current = '';
    lastCompletionQueryRef.current = '';

    if (helpCommand) {
      setLastCommandStatus(0);
      appendHistoryEntries([
        ...inputHistoryEntries,
        ...printHelp(helpTopic),
      ]);
    } else if (matchedCommand?.execute) {
      matchedCommand.execute();
      setLastCommandStatus(0);
      appendHistoryEntries([
        ...inputHistoryEntries,
        ...(matchedCommand.successMessage ? [{ text: matchedCommand.successMessage, tone: 'ok' as const }] : []),
      ]);
    } else {
      setLastCommandStatus(1);
      appendHistoryEntries([
        ...inputHistoryEntries,
        { text: `zsh: command not found: ${sanitizedInput}`, tone: 'warn' },
      ]);
    }

    setCommandInput('');
    setCaretIndex(0);
  };

  const handlePromptKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (event.key === 'Tab') {
      event.preventDefault();

      const query = stripPromptSigil(commandInput);
      const matches = getCompletionMatches(query);

      if (matches.length === 0) {
        return;
      }

      const matchCommands = matches.map((match) => match.command);
      const commonPrefix = getCommonPrefix(matchCommands);

      if (matches.length === 1) {
        const nextValue = matches[0].command;
        lastCompletionQueryRef.current = '';
        setPromptValue(nextValue, nextValue.length);
        return;
      }

      if (commonPrefix.length > query.length) {
        lastCompletionQueryRef.current = '';
        setPromptValue(commonPrefix, commonPrefix.length);
        return;
      }

      const completionKey = `${query}:${matchCommands.join('|')}`;
      if (lastCompletionQueryRef.current !== completionKey) {
        appendHistoryEntries([
          { text: 'COMPLETIONS', tone: 'dim' },
          ...matches.map((match) => ({
            text: formatHelpRow(match.command, match.description),
            tone: 'package' as const,
          })),
        ]);
        lastCompletionQueryRef.current = completionKey;
        scrollViewportToBottom(shouldReduceMotion ? 'auto' : 'smooth');
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (submittedCommands.length === 0) {
        return;
      }

      const nextCursor = historyCursor === null ? submittedCommands.length - 1 : Math.max(0, historyCursor - 1);
      if (historyCursor === null) {
        historyDraftRef.current = commandInput;
      }

      setHistoryCursor(nextCursor);
      setPromptValue(submittedCommands[nextCursor]);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (historyCursor === null) {
        return;
      }

      if (historyCursor >= submittedCommands.length - 1) {
        setHistoryCursor(null);
        setPromptValue(historyDraftRef.current);
        return;
      }

      const nextCursor = historyCursor + 1;
      setHistoryCursor(nextCursor);
      setPromptValue(submittedCommands[nextCursor]);
    }
  };

  return (
    <div
      className={`home-rolling-terminal rounded-[1.7rem]${variant === 'embedded' ? ' p-0 home-rolling-terminal--embedded' : ' p-4 md:p-5'}${viewportMode === 'content' ? ' home-rolling-terminal--content' : ''}`}
    >
      {variant === 'default' ? (
        <>
          <div className="home-rolling-terminal__header">
            <div className="home-rolling-terminal__header-meta">
              <span className="home-rolling-terminal__tty-badge">/dev/pts/0</span>
            </div>

            <div className="home-rolling-terminal__header-signals">
              <span className="home-rolling-terminal__header-pill">archlinux</span>
              <span className="home-rolling-terminal__header-pill is-muted">zsh</span>
            </div>
          </div>

          <div className="home-rolling-terminal__command">
            <span className="home-rolling-terminal__prompt-status is-ok">0</span>
            <span className="home-rolling-terminal__prompt-host">{PROMPT_HOST}</span>
            <span className="home-rolling-terminal__prompt-path">{PROMPT_PATH}</span>
            <span className="home-rolling-terminal__prompt-symbol">{PROMPT_SYMBOL}</span>
            <span className="min-w-0 truncate text-slate-300">{command}</span>
          </div>
        </>
      ) : null}

      <div ref={viewportRef} className="home-rolling-terminal__viewport scrollbar-hidden">
        <div
          className="space-y-0.5"
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest('.home-rolling-terminal__line--prompt')) {
              return;
            }

            focusPromptInput(true);
          }}
        >
          {renderedLines.map((line, index) => {
            const isActive = !shouldReduceMotion && !promptActive && index === displayedCount - 1;

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

          {commandHistory.map((line) => (
            <div key={line.id} className={`home-rolling-terminal__line is-${line.tone}`}>
              <span className="home-rolling-terminal__line-marker" />
              <span className="min-w-0 break-words">{line.text}</span>
            </div>
          ))}

          {promptActive ? (
            <form
              className="home-rolling-terminal__line home-rolling-terminal__line--prompt is-active"
              onSubmit={handleCommandSubmit}
              onClick={() => focusPromptInput()}
            >
              <label className="home-rolling-terminal__inline-prompt">
                <span
                  className={`home-rolling-terminal__prompt-status${lastCommandStatus === 0 ? ' is-ok' : ' is-warn'}`}
                >
                  {lastCommandStatus}
                </span>
                <span className="home-rolling-terminal__prompt-host">{PROMPT_HOST}</span>
                <span className="home-rolling-terminal__prompt-path">{PROMPT_PATH}</span>
                <span className="home-rolling-terminal__prompt-symbol">{PROMPT_SYMBOL}</span>
                <span className="home-rolling-terminal__prompt-editor">
                  <span className="home-rolling-terminal__prompt-value" aria-hidden="true">
                    {promptBeforeCaret}
                  </span>
                  <span className="home-rolling-terminal__prompt-value" aria-hidden="true">
                    <span className="home-rolling-terminal__cursor home-rolling-terminal__cursor--prompt">
                      <span className="home-rolling-terminal__cursor-char">{promptCursorChar}</span>
                    </span>
                  </span>
                  <span className="home-rolling-terminal__prompt-value" aria-hidden="true">
                    {promptAfterCaret}
                  </span>
                  {!commandInput ? (
                    <span className="home-rolling-terminal__prompt-placeholder" aria-hidden="true">
                      {promptPlaceholder}
                    </span>
                  ) : null}
                  <input
                    ref={commandInputRef}
                    type="text"
                    value={commandInput}
                    onChange={(event) => {
                      setCommandInput(event.target.value);
                      if (historyCursor !== null) {
                        setHistoryCursor(null);
                      }
                      lastCompletionQueryRef.current = '';
                      syncCaretIndex(event.target);
                    }}
                    onClick={(event) => syncCaretIndex(event.currentTarget)}
                    onKeyDown={handlePromptKeyDown}
                    onKeyUp={(event) => syncCaretIndex(event.currentTarget)}
                    onSelect={(event) => syncCaretIndex(event.currentTarget)}
                    onFocus={(event) => syncCaretIndex(event.currentTarget)}
                    className="home-rolling-terminal__prompt-input"
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    aria-label={promptPlaceholder}
                  />
                </span>
              </label>
            </form>
          ) : null}
        </div>
      </div>

      {showShortcuts && shortcuts.length > 0 ? (
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

      {showUpdates && latestArticles.length > 0 ? (
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
