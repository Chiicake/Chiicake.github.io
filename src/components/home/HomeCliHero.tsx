import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { useBlogIndex } from '../../hooks/useBlogIndex';
import { getBlogLanguage, getLocalizedText } from '../../lib/blog';
import type { HomeRollingShortcut } from './HomeRollingUpdatesPanel';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

type TerminalTone = 'sync' | 'package' | 'ok' | 'warn' | 'dim';
type TerminalCommandGroup = 'builtin' | 'blog' | 'site';

type StreamEntry =
  | { type: 'command'; key: string; value: string }
  | { type: 'ascii-line'; key: string; full?: string; compact?: string }
  | { type: 'comment'; key: string; value: string; muted?: boolean }
  | { type: 'terminal-line'; key: string; text: string; tone: TerminalTone }
  | { type: 'shortcut'; key: string; shortcut: HomeRollingShortcut; index: number }
  | { type: 'gap'; key: string };

interface TerminalLine {
  text: string;
  tone: TerminalTone;
  variant?: 'command';
}

interface TerminalHistoryEntry extends TerminalLine {
  id: string;
}

interface TerminalCommandSpec {
  command: string;
  normalized: string;
  group: TerminalCommandGroup;
  description: string;
  execute?: () => void;
  successMessage?: string;
}

const STREAM_STEP_DELAY_MS = 130;
const PROMPT_DELAY_MS = 300;
const PROMPT_HOST = 'chiicake@archlinux';
const PROMPT_PATH = '~';
const PROMPT_SYMBOL = '%';

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

function formatIndentedHelpRow(command: string, description: string) {
  return `    ${command.padEnd(30, ' ')} ${description}`;
}

function normalizeCommand(value: string) {
  return value.replace(/^\$\s*/, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function stripPromptSigil(value: string) {
  return value.replace(/^\$\s*/, '').trimStart();
}

export function HomeCliHero({ shortcuts }: { shortcuts: HomeRollingShortcut[] }) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { index: blogIndex } = useBlogIndex();
  const shellBodyRef = useRef<HTMLDivElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement | null>(null);
  const previousShellHeightRef = useRef(0);
  const historyIdRef = useRef(0);
  const historyDraftRef = useRef('');
  const lastCompletionQueryRef = useRef('');

  const [visibleStreamCount, setVisibleStreamCount] = useState(0);
  const [promptVisible, setPromptVisible] = useState(false);
  const [lastCommandStatus, setLastCommandStatus] = useState<0 | 1>(0);
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<TerminalHistoryEntry[]>([]);
  const [submittedCommands, setSubmittedCommands] = useState<string[]>([]);
  const [caretIndex, setCaretIndex] = useState(0);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const heroBundle = isRecord(bundle?.hero) ? bundle.hero : {};
  const cliBundle = isRecord(heroBundle.cli) ? heroBundle.cli : {};
  const blogLanguage = getBlogLanguage(i18n.language);

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
  const commandsCommand = isString(cliBundle.commandsCommand)
    ? cliBundle.commandsCommand
    : 'chiicake@archlinux ~ % show commands';
  const subtitle = isString(cliBundle.subtitle) ? cliBundle.subtitle : '# Rust / Go backend engineer';
  const secondary = isString(cliBundle.secondary)
    ? cliBundle.secondary
    : '# systems / tooling / distributed practice';
  const promptPlaceholder = t('hero.rollingPromptPlaceholder');

  const recentArticleCommands = useMemo(
    () =>
      (blogIndex?.articles.slice(0, 2).reverse() ?? []).map((article) => ({
        command: `open /blog/${article.slug}`,
        label: getLocalizedText(article.title, blogLanguage),
        date: article.date,
      })),
    [blogIndex?.articles, blogLanguage],
  );

  const recentArticleShortcuts = useMemo<HomeRollingShortcut[]>(
    () =>
      recentArticleCommands.map((article) => ({
        command: article.command,
        label: `${article.date} · ${article.label}`,
        href: article.command.replace(/^open\s+/, ''),
      })),
    [recentArticleCommands],
  );

  const blogShortcut = useMemo(
    () => shortcuts.find((shortcut) => normalizeCommand(shortcut.command) === 'open /blog') ?? null,
    [shortcuts],
  );

  const siteShortcuts = useMemo(
    () => shortcuts.filter((shortcut) => normalizeCommand(shortcut.command) !== 'open /blog'),
    [shortcuts],
  );

  const catalogStreamEntries = useMemo<StreamEntry[]>(() => {
    const entries: StreamEntry[] = [];
    let shortcutIndex = 0;

    const pushShortcut = (shortcut: HomeRollingShortcut) => {
      entries.push({
        type: 'shortcut',
        key: `catalog-shortcut-${shortcutIndex}-${shortcut.command}`,
        shortcut,
        index: shortcutIndex,
      });
      shortcutIndex += 1;
    };

    if (blogShortcut || recentArticleShortcuts.length > 0) {
      if (blogShortcut) {
        pushShortcut(blogShortcut);
      }

      recentArticleShortcuts.forEach(pushShortcut);
    }

    if (siteShortcuts.length > 0) {
      siteShortcuts.forEach(pushShortcut);
    }

    if (helperLines.length > 0) {
      helperLines.forEach((line, index) => {
        entries.push({
          type: 'comment',
          key: `hint-${index}`,
          value: line,
          muted: true,
        });
      });
    }

    return entries;
  }, [
    blogShortcut,
    helperLines,
    recentArticleShortcuts,
    siteShortcuts,
  ]);

  const streamEntries = useMemo<StreamEntry[]>(
    () => [
      { type: 'command', key: 'hero-command', value: heroCommand },
      ...Array.from({ length: Math.max(asciiLines.length, compactAsciiLines.length) }, (_, index) => ({
        type: 'ascii-line' as const,
        key: `ascii-line-${index}`,
        full: asciiLines[index],
        compact: compactAsciiLines[index],
      })),
      { type: 'comment', key: 'subtitle', value: subtitle, muted: true },
      { type: 'comment', key: 'secondary', value: secondary, muted: true },
      { type: 'gap', key: 'gap-readme' },
      { type: 'command', key: 'commands-command', value: commandsCommand },
      ...catalogStreamEntries,
    ],
    [
      asciiLines,
      catalogStreamEntries,
      commandsCommand,
      compactAsciiLines,
      heroCommand,
      secondary,
      subtitle,
    ],
  );

  const streamComplete = visibleStreamCount >= streamEntries.length;
  const promptActive = streamComplete && promptVisible;

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
      {
        command: 'show commands',
        normalized: 'show commands',
        group: 'builtin',
        description: 'print primary command catalog',
      },
      {
        command: 'cat /home/chiicake/README',
        normalized: normalizeCommand('cat /home/chiicake/README'),
        group: 'builtin',
        description: 'show identity README summary',
      },
    ];

    const blogCommands = shortcuts
      .filter((shortcut) => normalizeCommand(shortcut.command) === 'open /blog')
      .map((shortcut) => ({
        command: shortcut.command.replace(/^\$\s*/, ''),
        normalized: normalizeCommand(shortcut.command),
        group: 'blog' as const,
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
      group: 'blog' as const,
      description: `${article.date} · ${article.label}`,
      execute: () => navigate(article.command.replace(/^open\s+/, '')),
      successMessage: `opened ${article.command.replace(/^open\s+/, '')}`,
    }));

    const siteCommands = shortcuts
      .filter((shortcut) => normalizeCommand(shortcut.command) !== 'open /blog')
      .map((shortcut) => ({
      command: shortcut.command.replace(/^\$\s*/, ''),
      normalized: normalizeCommand(shortcut.command),
      group: 'site' as const,
      description: shortcut.label,
      execute: () => executeShortcut(shortcut),
      successMessage: shortcut.href
        ? shortcut.external
          ? `launched ${shortcut.href.replace(/^https?:\/\//, '')}`
          : `opened ${shortcut.href}`
        : `moved viewport to ${shortcut.command.replace(/^\$\s*jump\s+/, '')}`,
    }));

    return [...builtinCommands, ...blogCommands, ...recentCommands, ...siteCommands];
  }, [executeShortcut, navigate, recentArticleCommands, shortcuts]);

  const renderCommandCatalog = useCallback(
    () => {
      const rows: TerminalLine[] = [];
      let rowIndex = 1;

      const pushRow = (command: string, description: string) => {
        rows.push({
          text: `  [${String(rowIndex).padStart(2, '0')}] ${command.padEnd(40, ' ')} ${description}`,
          tone: 'package' as const,
        });
        rowIndex += 1;
      };

      if (blogShortcut || recentArticleCommands.length > 0) {
        if (blogShortcut) {
          pushRow(blogShortcut.command.replace(/^\$\s*/, ''), blogShortcut.label);
        }

        recentArticleCommands.forEach((article) => {
          pushRow(article.command, `${article.date} · ${article.label}`);
        });
      }

      if (siteShortcuts.length > 0) {
        siteShortcuts.forEach((shortcut) => {
          pushRow(shortcut.command.replace(/^\$\s*/, ''), shortcut.label);
        });
      }

      if (helperLines.length > 0) {
        helperLines.forEach((line) => rows.push({ text: line, tone: 'dim' as const }));
      }

      return rows;
    },
    [
      blogShortcut,
      helperLines,
      recentArticleCommands,
      siteShortcuts,
    ],
  );

  const renderReadmeSummary = useCallback(
    () => [
      { text: subtitle.replace(/^#\s*/, ''), tone: 'dim' as const },
      { text: secondary.replace(/^#\s*/, ''), tone: 'dim' as const },
    ],
    [secondary, subtitle],
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
          { text: formatIndentedHelpRow(target.command, target.description), tone: 'package' as const },
          { text: 'USAGE', tone: 'dim' as const },
          { text: `    ${target.command}`, tone: 'package' as const },
          { text: 'GROUP', tone: 'dim' as const },
          { text: `    ${target.group}`, tone: 'package' as const },
        ];
      }

      const builtins = commandSpecs.filter((spec) => spec.group === 'builtin');
      const blog = commandSpecs.filter((spec) => spec.group === 'blog');
      const site = commandSpecs.filter((spec) => spec.group === 'site');

      return [
        { text: 'NAME', tone: 'dim' as const },
        { text: '    cli-home - single stream terminal homepage', tone: 'package' as const },
        { text: 'SYNOPSIS', tone: 'dim' as const },
        { text: '    help [command]', tone: 'package' as const },
        { text: 'BUILTINS', tone: 'dim' as const },
        ...builtins.map((spec) => ({ text: formatIndentedHelpRow(spec.command, spec.description), tone: 'package' as const })),
        ...(blog.length > 0
          ? [
              { text: 'BLOG', tone: 'dim' as const },
              ...blog.map((spec) => ({ text: formatIndentedHelpRow(spec.command, spec.description), tone: 'package' as const })),
            ]
          : []),
        ...(site.length > 0
          ? [
              { text: 'SITE', tone: 'dim' as const },
              ...site.map((spec) => ({ text: formatIndentedHelpRow(spec.command, spec.description), tone: 'package' as const })),
            ]
          : []),
        { text: 'KEYS', tone: 'dim' as const },
        { text: formatIndentedHelpRow('Tab', 'autocomplete commands and recent article paths'), tone: 'package' as const },
        { text: formatIndentedHelpRow('Up / Down', 'browse command history'), tone: 'package' as const },
      ];
    },
    [commandSpecs],
  );

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

  useEffect(() => {
    let timeoutId: number | undefined;
    const body = shellBodyRef.current;

    if (body) {
      body.scrollTop = 0;
    }
    previousShellHeightRef.current = 0;

    if (shouldReduceMotion) {
      timeoutId = window.setTimeout(() => {
        setLastCommandStatus(0);
        setCommandInput('');
        setCommandHistory([]);
        setSubmittedCommands([]);
        setPromptVisible(true);
        setCaretIndex(0);
        setHistoryCursor(null);
        historyDraftRef.current = '';
        lastCompletionQueryRef.current = '';
        setVisibleStreamCount(streamEntries.length);
      }, 0);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    let cancelled = false;

    const revealStep = (index: number) => {
      if (cancelled) {
        return;
      }

      setVisibleStreamCount(index);

      if (index >= streamEntries.length) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        revealStep(index + 1);
      }, STREAM_STEP_DELAY_MS);
    };

    timeoutId = window.setTimeout(() => {
      setLastCommandStatus(0);
      setCommandInput('');
      setCommandHistory([]);
      setSubmittedCommands([]);
      setPromptVisible(false);
      setCaretIndex(0);
      setHistoryCursor(null);
      historyDraftRef.current = '';
      lastCompletionQueryRef.current = '';
      revealStep(0);
    }, 0);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [i18n.language, shouldReduceMotion, streamEntries.length]);

  useEffect(() => {
    if (!streamComplete) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPromptVisible(true);
    }, shouldReduceMotion ? 0 : PROMPT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shouldReduceMotion, streamComplete]);

  useEffect(() => {
    if (!promptActive) {
      return;
    }

    focusPromptInput();
  }, [focusPromptInput, promptActive]);

  useEffect(() => {
    const body = shellBodyRef.current;
    if (!body) {
      return;
    }

    window.requestAnimationFrame(() => {
      const currentHeight = body.scrollHeight;
      const clientHeight = body.clientHeight;
      const previousHeight = previousShellHeightRef.current;
      const currentOverflow = Math.max(0, currentHeight - clientHeight);
      const previousOverflow = Math.max(0, previousHeight - clientHeight);
      const overflowDelta = Math.max(0, currentOverflow - previousOverflow);

      if (currentOverflow <= 0) {
        body.scrollTop = 0;
        previousShellHeightRef.current = currentHeight;
        return;
      }

      if (overflowDelta <= 0) {
        previousShellHeightRef.current = currentHeight;
        return;
      }

      body.scrollTo({
        top: Math.min(currentOverflow, body.scrollTop + overflowDelta),
        behavior: 'auto',
      });

      previousShellHeightRef.current = currentHeight;
    });
  }, [commandHistory.length, promptVisible, shouldReduceMotion, visibleStreamCount]);

  const visibleCaretIndex = Math.min(caretIndex, commandInput.length);
  const promptBeforeCaret = commandInput.slice(0, visibleCaretIndex);
  const promptCursorChar = commandInput.charAt(visibleCaretIndex) || '\u00A0';
  const promptAfterCaret = commandInput.slice(visibleCaretIndex + (commandInput.charAt(visibleCaretIndex) ? 1 : 0));

  const handleCommandSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const rawInput = commandInput.trim();
    if (!rawInput || !promptActive) {
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
        variant: 'command',
      },
    ];

    setSubmittedCommands((previous) => [...previous, sanitizedInput]);
    setHistoryCursor(null);
    historyDraftRef.current = '';
    lastCompletionQueryRef.current = '';

    if (helpCommand) {
      setLastCommandStatus(0);
      appendHistoryEntries([...inputHistoryEntries, ...printHelp(helpTopic)]);
    } else if (normalizedInput === 'show commands') {
      setLastCommandStatus(0);
      appendHistoryEntries([...inputHistoryEntries, ...renderCommandCatalog()]);
    } else if (normalizedInput === normalizeCommand('cat /home/chiicake/README')) {
      setLastCommandStatus(0);
      appendHistoryEntries([...inputHistoryEntries, ...renderReadmeSummary()]);
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
            </div>
          </div>

          <div
            ref={shellBodyRef}
            className="home-cli-shell__body home-cli-shell__body--stream scrollbar-hidden"
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest('a,button,input,.home-rolling-terminal__line--prompt')) {
                return;
              }

              focusPromptInput(true);
            }}
          >
            {streamEntries.slice(0, visibleStreamCount).map((entry) => {
              if (entry.type === 'command') {
                return (
                  <div key={entry.key} className="home-rolling-terminal__line is-package home-cli-shell__command-line">
                    <span className="home-rolling-terminal__line-marker" />
                    <span className="home-cli-shell__command-line-text min-w-0 break-words whitespace-pre-wrap mono-data">{entry.value}</span>
                  </div>
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
                  <p key={entry.key} className={`home-cli-shell__comment${entry.muted ? ' is-muted' : ''}`}>
                    {entry.value}
                  </p>
                );
              }

              if (entry.type === 'terminal-line') {
                const isActive = !shouldReduceMotion && !promptActive && entry.key === streamEntries[Math.min(visibleStreamCount - 1, streamEntries.length - 1)]?.key;

                return (
                  <div key={entry.key} className={`home-rolling-terminal__line is-${entry.tone}${isActive ? ' is-active' : ''}`}>
                    <span className="home-rolling-terminal__line-marker" />
                    <span className="min-w-0 break-words whitespace-pre-wrap">{entry.text}</span>
                    {isActive ? <span className="home-rolling-terminal__cursor" aria-hidden="true" /> : null}
                  </div>
                );
              }

              if (entry.type === 'shortcut') {
                return renderShortcutAction(entry.shortcut, entry.index);
              }

              return <div key={entry.key} className="home-cli-shell__gap" aria-hidden="true" />;
            })}

            {commandHistory.map((line) => {
              if (line.variant === 'command') {
                return (
                  <div
                    key={line.id}
                    className="home-rolling-terminal__line is-package home-cli-shell__command-line"
                  >
                    <span className="home-rolling-terminal__line-marker" />
                    <span className="home-cli-shell__command-line-text min-w-0 break-words whitespace-pre-wrap mono-data">
                      {line.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={line.id} className={`home-rolling-terminal__line is-${line.tone}`}>
                  <span className="home-rolling-terminal__line-marker" />
                  <span className="min-w-0 break-words whitespace-pre-wrap">{line.text}</span>
                </div>
              );
            })}

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
        </section>
      </div>
    </div>
  );
}
