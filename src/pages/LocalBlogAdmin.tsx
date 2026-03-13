import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookCopy,
  FolderUp,
  Layers3,
  LayoutDashboard,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  Unlink2,
} from 'lucide-react';
import {
  addTag,
  createEmptyArticle,
  createEmptyCategory,
  createEmptyCollection,
  removeTag,
  renameCategoryId,
  renameCollectionSlug,
  renameTag,
  upsertArticle,
} from '../lib/blogAdminState';
import {
  getBlogContentType,
  normalizeBlogIndex,
  primeBlogIndex,
  type BlogArticleMeta,
  type BlogArticleSourceMeta,
  type BlogContentType,
  type BlogIndex,
  type LocalizedContent,
} from '../lib/blog';
import {
  deleteLocalArticle,
  fetchLocalBlogAdminState,
  importLocalArticleFolder,
  saveLocalBlogIndex,
} from '../lib/localBlogAdmin';
import { LOCAL_BLOG_ADMIN_HASH_PATH, isLocalAdminHostname } from '../lib/localBlogAdminConfig';

type AdminView = 'overview' | 'articles' | 'taxonomy';
type TaxonomyTab = 'tags' | 'categories' | 'collections';

type ArticleFieldLinks = {
  title: boolean;
  summary: boolean;
  readingTime: boolean;
};

type TaxonomyFieldLinks = {
  primary: boolean;
  secondary: boolean;
};

function uniqueTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

function createEmptySourceDraft(): BlogArticleSourceMeta {
  return {
    site: '',
    author: '',
    title: {
      zh: '',
      en: '',
    },
    url: '',
    publishedAt: '',
    translator: '',
  };
}

function sanitizeArticleDraft(draft: BlogArticleMeta): BlogArticleMeta {
  const featuredRank = draft.featuredRank === undefined || Number.isNaN(draft.featuredRank)
    ? undefined
    : draft.featuredRank;
  const seriesOrder = draft.collection
    ? draft.seriesOrder === undefined || Number.isNaN(draft.seriesOrder)
      ? undefined
      : draft.seriesOrder
    : undefined;

  return {
    ...draft,
    slug: draft.slug.trim().toLowerCase(),
    date: draft.date.trim(),
    category: draft.category.trim(),
    collection: draft.collection?.trim() || undefined,
    tags: uniqueTags(draft.tags),
    seriesOrder,
    featuredRank,
    title: {
      zh: draft.title.zh.trim(),
      en: draft.title.en.trim(),
    },
    summary: {
      zh: draft.summary.zh.trim(),
      en: draft.summary.en.trim(),
    },
    readingTime: {
      zh: draft.readingTime.zh.trim(),
      en: draft.readingTime.en.trim(),
    },
    contentType: draft.contentType === 'repost' ? 'repost' : 'original',
    source:
      draft.contentType === 'repost'
        ? {
            site: draft.source?.site.trim() ?? '',
            author: draft.source?.author.trim() ?? '',
            title: {
              zh: draft.source?.title.zh.trim() ?? '',
              en: draft.source?.title.en.trim() ?? '',
            },
            url: draft.source?.url.trim() ?? '',
            publishedAt: draft.source?.publishedAt?.trim() || undefined,
            translator: draft.source?.translator?.trim() || undefined,
          }
        : undefined,
  };
}

function hasArticleFolder(index: BlogIndex, slug: string) {
  return index.articles.some((article) => article.slug === slug);
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return window.btoa(binary);
}

function createSeparatedArticleFieldLinks(): ArticleFieldLinks {
  return {
    title: false,
    summary: false,
    readingTime: false,
  };
}

function createSeparatedTaxonomyFieldLinks(): TaxonomyFieldLinks {
  return {
    primary: false,
    secondary: false,
  };
}

function serializeIndex(index: BlogIndex | null) {
  return index ? JSON.stringify(normalizeBlogIndex(index)) : '';
}

function serializeArticleDraft(draft: BlogArticleMeta) {
  const normalized = sanitizeArticleDraft(draft);
  return JSON.stringify({
    ...normalized,
    collection: normalized.collection ?? '',
  });
}

function getArticleDraftFromIndex(index: BlogIndex, slug: string | null) {
  if (!slug) {
    return createEmptyArticle(index);
  }

  const targetArticle = index.articles.find((article) => article.slug === slug);
  if (!targetArticle) {
    return createEmptyArticle(index);
  }

  return {
    ...targetArticle,
    source: targetArticle.source ?? createEmptySourceDraft(),
    collection: targetArticle.collection ?? '',
  };
}

function countTagUsage(index: BlogIndex, tag: string) {
  return index.articles.filter((article) => article.tags.includes(tag)).length;
}

function countCategoryUsage(index: BlogIndex, categoryId: string) {
  return index.articles.filter((article) => article.category === categoryId).length;
}

function countCollectionUsage(index: BlogIndex, collectionSlug: string) {
  return index.articles.filter((article) => article.collection === collectionSlug).length;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Panel({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[1.8rem] border border-white/10 bg-slate-950/70 shadow-[0_20px_80px_rgba(2,8,23,0.45)] backdrop-blur-xl',
        className
      )}
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight text-[var(--color-text-primary)]">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p> : null}
            </div>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

function ToolbarButton({
  icon,
  children,
  onClick,
  disabled,
  variant = 'secondary',
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variantClassName =
    variant === 'primary'
      ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
      : variant === 'danger'
        ? 'border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15'
        : 'border border-white/10 bg-white/5 text-[var(--color-text-primary)] hover:bg-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variantClassName
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function RailButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-[1.4rem] border px-4 py-4 text-left transition-colors',
        active
          ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/14 text-[var(--color-text-primary)]'
          : 'border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:border-white/15 hover:bg-white/7'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
            active
              ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
              : 'border-white/10 bg-slate-900/80 text-[var(--color-text-secondary)]'
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
        </div>
      </div>
    </button>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
        <span className="text-sm font-medium">{label}</span>
        <div className="text-[var(--color-accent)]">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{hint}</p>
    </div>
  );
}

function StatusChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'warning' | 'success';
}) {
  const toneClassName =
    tone === 'accent'
      ? 'border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
      : tone === 'warning'
        ? 'border-amber-400/25 bg-amber-500/10 text-amber-200'
        : tone === 'success'
          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
          : 'border-white/10 bg-white/5 text-[var(--color-text-secondary)]';

  return <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', toneClassName)}>{label}</span>;
}

function LinkedFieldGroup({
  title,
  description,
  linked,
  onLinkedChange,
  values,
  onChange,
  placeholders,
  multiline = false,
  rows = 4,
}: {
  title: string;
  description: string;
  linked: boolean;
  onLinkedChange: (value: boolean) => void;
  values: LocalizedContent;
  onChange: (language: 'zh' | 'en', value: string) => void;
  placeholders: {
    linked: string;
    zh: string;
    en: string;
  };
  multiline?: boolean;
  rows?: number;
}) {
  const sharedValue = values.zh || values.en;
  const InputTag = multiline ? 'textarea' : 'input';
  const commonClassName =
    'w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50';

  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onLinkedChange(!linked)}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            linked
              ? 'border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
              : 'border-white/10 bg-white/5 text-[var(--color-text-secondary)]'
          )}
        >
          {linked ? <Link2 size={14} /> : <Unlink2 size={14} />}
          {linked ? 'EN 跟随中文' : '分开编辑'}
        </button>
      </div>

      {linked ? (
        <InputTag
          {...(multiline ? { rows } : {})}
          value={sharedValue}
          onChange={(event) => {
            onChange('zh', event.target.value);
            onChange('en', event.target.value);
          }}
          placeholder={placeholders.linked}
          className={commonClassName}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">ZH</label>
            <InputTag
              {...(multiline ? { rows } : {})}
              value={values.zh}
              onChange={(event) => onChange('zh', event.target.value)}
              placeholder={placeholders.zh}
              className={commonClassName}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">EN</label>
            <InputTag
              {...(multiline ? { rows } : {})}
              value={values.en}
              onChange={(event) => onChange('en', event.target.value)}
              placeholder={placeholders.en}
              className={commonClassName}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function LocalBlogAdmin() {
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const isLocalHost = typeof window !== 'undefined' && isLocalAdminHostname(window.location.hostname);

  const [persistedIndex, setPersistedIndex] = useState<BlogIndex | null>(null);
  const [index, setIndex] = useState<BlogIndex | null>(null);
  const [view, setView] = useState<AdminView>('overview');
  const [taxonomyTab, setTaxonomyTab] = useState<TaxonomyTab>('tags');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0);
  const [articleDraft, setArticleDraft] = useState<BlogArticleMeta>(createEmptyArticle());
  const [articleFieldLinks, setArticleFieldLinks] = useState<ArticleFieldLinks>(() => createSeparatedArticleFieldLinks());
  const [categoryFieldLinks, setCategoryFieldLinks] = useState<TaxonomyFieldLinks>(() => createSeparatedTaxonomyFieldLinks());
  const [collectionFieldLinks, setCollectionFieldLinks] = useState<TaxonomyFieldLinks>(() => createSeparatedTaxonomyFieldLinks());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [newTagText, setNewTagText] = useState('');
  const [articleSearch, setArticleSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    directoryInputRef.current?.setAttribute('webkitdirectory', '');
    directoryInputRef.current?.setAttribute('directory', '');
  }, []);

  useEffect(() => {
    if (!isLocalHost) {
      setLoading(false);
      return;
    }

    let active = true;

    fetchLocalBlogAdminState()
      .then(({ index: initialIndex }) => {
        if (!active) {
          return;
        }

        const normalizedIndex = primeBlogIndex(initialIndex);
        const firstArticle = normalizedIndex.articles[0];
        setPersistedIndex(normalizedIndex);
        setIndex(normalizedIndex);
        setSelectedArticleSlug(firstArticle?.slug ?? null);

        const nextDraft = getArticleDraftFromIndex(normalizedIndex, firstArticle?.slug ?? null);
        setArticleDraft(nextDraft);
        setArticleFieldLinks(createSeparatedArticleFieldLinks());
        setLoading(false);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setErrorText(error instanceof Error ? error.message : '加载本地博客管理数据失败');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isLocalHost]);

  const currentFolderName = pendingFiles[0]?.webkitRelativePath?.split('/')[0] ?? '';

  const selectedCategory = index?.categories[selectedCategoryIndex] ?? null;
  const selectedCollection = index?.collections[selectedCollectionIndex] ?? null;

  useEffect(() => {
    if (!index) {
      return;
    }

    setSelectedCategoryIndex((current) => {
      if (index.categories.length === 0) {
        return 0;
      }
      return Math.min(current, index.categories.length - 1);
    });
    setSelectedCollectionIndex((current) => {
      if (index.collections.length === 0) {
        return 0;
      }
      return Math.min(current, index.collections.length - 1);
    });
  }, [index?.categories.length, index?.collections.length, index]);

  useEffect(() => {
    if (!index) {
      return;
    }

    const targetCategory = index.categories[selectedCategoryIndex];
    if (!targetCategory) {
      return;
    }

    setCategoryFieldLinks(createSeparatedTaxonomyFieldLinks());
  }, [index, selectedCategoryIndex]);

  useEffect(() => {
    if (!index) {
      return;
    }

    const targetCollection = index.collections[selectedCollectionIndex];
    if (!targetCollection) {
      return;
    }

    setCollectionFieldLinks(createSeparatedTaxonomyFieldLinks());
  }, [index, selectedCollectionIndex]);

  const commitPersistedIndex = (nextIndex: BlogIndex) => {
    const normalizedIndex = primeBlogIndex(nextIndex);
    setPersistedIndex(normalizedIndex);
    setIndex(normalizedIndex);
    return normalizedIndex;
  };

  const applyWorkingIndexUpdate = (updater: (currentIndex: BlogIndex) => BlogIndex) => {
    setIndex((currentIndex) => {
      if (!currentIndex) {
        return currentIndex;
      }

      return normalizeBlogIndex(updater(currentIndex));
    });
  };

  const openArticleDraft = (slug: string | null, nextIndex: BlogIndex) => {
    setSelectedArticleSlug(slug);
    const nextDraft = getArticleDraftFromIndex(nextIndex, slug);
    setArticleDraft(nextDraft);
    setArticleFieldLinks(createSeparatedArticleFieldLinks());
    setPendingFiles([]);
  };

  const filteredArticles = useMemo(() => {
    if (!index) {
      return [];
    }

    const keyword = articleSearch.trim().toLowerCase();
    if (!keyword) {
      return index.articles;
    }

    return index.articles.filter((article) => {
      const haystack = [
        article.slug,
        article.title.zh,
        article.title.en,
        article.summary.zh,
        article.summary.en,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [articleSearch, index]);

  const overviewArticles = useMemo(() => index?.articles.slice(0, 6) ?? [], [index]);

  const isIndexDirty = useMemo(() => serializeIndex(index) !== serializeIndex(persistedIndex), [index, persistedIndex]);

  const baseArticleDraft = useMemo(() => {
    if (!persistedIndex) {
      return createEmptyArticle();
    }

    return getArticleDraftFromIndex(persistedIndex, selectedArticleSlug);
  }, [persistedIndex, selectedArticleSlug]);

  const isArticleDirty = useMemo(
    () => serializeArticleDraft(articleDraft) !== serializeArticleDraft(baseArticleDraft) || pendingFiles.length > 0,
    [articleDraft, baseArticleDraft, pendingFiles.length]
  );

  const hasUnsavedChanges = isIndexDirty || isArticleDirty;
  const slugRenamePending = Boolean(selectedArticleSlug && articleDraft.slug.trim() && articleDraft.slug.trim() !== selectedArticleSlug);

  const confirmDiscardArticleDraft = () => {
    if (!isArticleDirty) {
      return true;
    }

    return window.confirm('当前文章有未保存修改，确认放弃这些变更吗？');
  };

  const switchView = (nextView: AdminView) => {
    if (nextView === view) {
      return;
    }

    if (view === 'articles' && !confirmDiscardArticleDraft()) {
      return;
    }

    setView(nextView);
    setErrorText('');
    setStatusText('');
  };

  const jumpToNewArticle = () => {
    if (!index) {
      return;
    }

    if (!confirmDiscardArticleDraft()) {
      return;
    }

    setView('articles');
    openArticleDraft(null, index);
    setStatusText('已切换到新建文章草稿。');
    setErrorText('');
  };

  const jumpToImportFlow = () => {
    jumpToNewArticle();
    setStatusText('先填写基础元信息，再选择本地文章文件夹导入。');
  };

  const jumpToTaxonomy = (nextTab: TaxonomyTab) => {
    if (view === 'articles' && !confirmDiscardArticleDraft()) {
      return;
    }

    setView('taxonomy');
    setTaxonomyTab(nextTab);
    setStatusText('');
    setErrorText('');
  };

  const selectArticle = (slug: string | null) => {
    if (!index) {
      return;
    }

    if (slug === selectedArticleSlug && slug !== null) {
      return;
    }

    if (!confirmDiscardArticleDraft()) {
      return;
    }

    setView('articles');
    openArticleDraft(slug, index);
    setStatusText('');
    setErrorText('');
  };

  const handleReload = async () => {
    if (!isLocalHost) {
      return;
    }

    if (hasUnsavedChanges && !window.confirm('重新加载会覆盖未保存的修改，确认继续吗？')) {
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const { index: latestIndex } = await fetchLocalBlogAdminState();
      const normalizedIndex = commitPersistedIndex(latestIndex);
      openArticleDraft(selectedArticleSlug, normalizedIndex);
      setStatusText('已重新加载本地博客数据。');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '重新加载失败');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSiteMetadata = async () => {
    if (!index) {
      return;
    }

    if (isArticleDirty && !window.confirm('当前文章草稿尚未保存，保存站点结构会重置右侧文章编辑器。确认继续吗？')) {
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const { index: savedIndex } = await saveLocalBlogIndex(index);
      const normalizedIndex = commitPersistedIndex(savedIndex);
      openArticleDraft(selectedArticleSlug, normalizedIndex);
      setStatusText('站点结构已保存，标签、分类、合集变更已写回。');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '保存站点结构失败');
    } finally {
      setBusy(false);
    }
  };

  const ensureArticleWriteReady = () => {
    if (!persistedIndex) {
      setErrorText('文章索引尚未加载完成。');
      return false;
    }

    if (isIndexDirty) {
      setErrorText('请先保存站点结构变更，再执行文章保存或导入。');
      return false;
    }

    return true;
  };

  const handleSaveCurrentArticle = async () => {
    if (!ensureArticleWriteReady() || !persistedIndex) {
      return;
    }

    const sanitizedDraft = sanitizeArticleDraft(articleDraft);
    if (!sanitizedDraft.slug || !sanitizedDraft.category || !sanitizedDraft.title.zh || !sanitizedDraft.title.en) {
      setErrorText('请至少填写 slug、分类以及中英文标题。');
      return;
    }
    if (sanitizedDraft.contentType === 'repost' && !sanitizedDraft.source?.url) {
      setErrorText('转载文章至少需要填写来源链接。');
      return;
    }

    if (!hasArticleFolder(persistedIndex, sanitizedDraft.slug) && pendingFiles.length === 0) {
      setErrorText('当前 slug 尚未对应本地目录；请先选择文章文件夹，或恢复原 slug。');
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const nextIndex = upsertArticle(persistedIndex, sanitizedDraft);
      const { index: savedIndex } = await saveLocalBlogIndex(nextIndex);
      const normalizedIndex = commitPersistedIndex(savedIndex);
      openArticleDraft(sanitizedDraft.slug, normalizedIndex);
      setStatusText('当前文章元信息已保存。');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '保存文章元信息失败');
    } finally {
      setBusy(false);
    }
  };

  const handleImportCurrentArticle = async () => {
    if (!ensureArticleWriteReady() || !persistedIndex) {
      return;
    }

    const sanitizedDraft = sanitizeArticleDraft(articleDraft);
    if (!sanitizedDraft.slug || !sanitizedDraft.category || !sanitizedDraft.title.zh || !sanitizedDraft.title.en) {
      setErrorText('请先完整填写当前文章的基础信息。');
      return;
    }
    if (sanitizedDraft.contentType === 'repost' && !sanitizedDraft.source?.url) {
      setErrorText('转载文章至少需要填写来源链接。');
      return;
    }

    if (pendingFiles.length === 0) {
      setErrorText('请先选择一个本地文章文件夹。');
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const nextIndex = upsertArticle(persistedIndex, sanitizedDraft);
      const files = await Promise.all(
        pendingFiles.map(async (file) => ({
          relativePath: file.webkitRelativePath || file.name,
          contentBase64: await fileToBase64(file),
        }))
      );

      const { index: savedIndex } = await importLocalArticleFolder({
        index: nextIndex,
        article: sanitizedDraft,
        files,
        overwriteFolder: hasArticleFolder(persistedIndex, sanitizedDraft.slug),
      });

      const normalizedIndex = commitPersistedIndex(savedIndex);
      openArticleDraft(sanitizedDraft.slug, normalizedIndex);
      setStatusText(`已导入文件夹 ${currentFolderName || sanitizedDraft.slug}，并同步保存文章。`);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '导入文章文件夹失败');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCurrentArticle = async () => {
    if (!ensureArticleWriteReady() || !persistedIndex || !selectedArticleSlug) {
      return;
    }

    const shouldDelete = window.confirm(`确认删除文章 ${selectedArticleSlug} 及其本地文件夹吗？`);
    if (!shouldDelete) {
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const { index: savedIndex } = await deleteLocalArticle(selectedArticleSlug);
      const normalizedIndex = commitPersistedIndex(savedIndex);
      const fallbackArticle = normalizedIndex.articles[0];
      openArticleDraft(fallbackArticle?.slug ?? null, normalizedIndex);
      setStatusText(`文章 ${selectedArticleSlug} 及其本地文件夹已删除。`);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '删除文章失败');
    } finally {
      setBusy(false);
    }
  };

  if (!isLocalHost) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-400/30 bg-amber-500/10 p-8 text-amber-100 shadow-[0_20px_70px_rgba(120,53,15,0.18)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">本地博客管理台仅允许 localhost 访问</h1>
              <p className="mt-3 text-sm leading-relaxed text-amber-50/80">
                该页面不会出现在主站导航里，只在本地开发环境通过特定地址打开。
              </p>
              <p className="mt-3 text-sm font-medium text-amber-100">建议地址：{LOCAL_BLOG_ADMIN_HASH_PATH}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    if (!index) {
      return null;
    }

    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard label="文章" value={index.articles.length} hint="按发布时间倒序索引" icon={<BookCopy size={18} />} />
          <MetricCard label="标签" value={index.tags.length} hint="支持全局重命名和删除" icon={<Tag size={18} />} />
          <MetricCard label="分类" value={index.categories.length} hint="博客页频道筛选来源" icon={<Layers3 size={18} />} />
          <MetricCard label="合集" value={index.collections.length} hint="阅读页右侧系列导航来源" icon={<FolderUp size={18} />} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel
            title="快速开始"
            subtitle="把最常用的任务收成三个入口，不再先面对整页表单。"
            icon={<ArrowRight size={20} />}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={jumpToNewArticle}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:border-[var(--color-accent)]/25 hover:bg-[var(--color-accent)]/8"
              >
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">新建文章</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  创建空白草稿，直接填写 slug、分类、标题和摘要。
                </p>
              </button>
              <button
                type="button"
                onClick={jumpToImportFlow}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:border-[var(--color-accent)]/25 hover:bg-[var(--color-accent)]/8"
              >
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">导入文章目录</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  先填基础元信息，再把本地文件夹复制进 `public/blog`。
                </p>
              </button>
              <button
                type="button"
                onClick={() => jumpToTaxonomy('categories')}
                className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:border-[var(--color-accent)]/25 hover:bg-[var(--color-accent)]/8"
              >
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">管理站点结构</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  标签、分类、合集全部集中到一个工作区里维护。
                </p>
              </button>
            </div>
          </Panel>

          <Panel title="当前状态" subtitle="先看清有哪些未保存内容，再决定下一步。" icon={<ShieldCheck size={20} />}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusChip label={isIndexDirty ? '站点结构待保存' : '站点结构已同步'} tone={isIndexDirty ? 'warning' : 'success'} />
                <StatusChip label={isArticleDirty ? '文章草稿待保存' : '文章草稿已同步'} tone={isArticleDirty ? 'warning' : 'success'} />
                <StatusChip
                  label={currentFolderName ? `已选择目录：${currentFolderName}` : '未选择导入目录'}
                  tone={currentFolderName ? 'accent' : 'neutral'}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">当前文章</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                    {articleDraft.title.zh || articleDraft.title.en || articleDraft.slug || '未选择文章'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {articleDraft.slug ? `slug: ${articleDraft.slug}` : '进入文章工作区后开始编辑'}
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">访问路径</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{LOCAL_BLOG_ADMIN_HASH_PATH}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">仅本地开发环境可用，不出现在主站导航。</p>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="最近文章" subtitle="从这里继续编辑最近维护的文章。" icon={<BookCopy size={20} />}>
            <div className="space-y-3">
              {overviewArticles.map((article) => (
                <button
                  key={article.slug}
                  type="button"
                  onClick={() => selectArticle(article.slug)}
                  className="flex w-full items-start justify-between gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-[var(--color-accent)]/25 hover:bg-[var(--color-accent)]/8"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {article.title.zh || article.title.en || article.slug}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">{article.slug}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[var(--color-text-secondary)]">{article.date}</p>
                    <p className="mt-1 text-xs text-[var(--color-accent)]">{article.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="结构概览" subtitle="这里给出最常维护的结构信息摘要。" icon={<Layers3 size={20} />}>
            <div className="space-y-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">分类</p>
                  <StatusChip label={`${index.categories.length} 个`} tone="accent" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {index.categories.slice(0, 6).map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[var(--color-text-secondary)]"
                    >
                      {category.label.zh || category.id}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">合集</p>
                  <StatusChip label={`${index.collections.length} 个`} tone="accent" />
                </div>
                <div className="mt-3 space-y-2">
                  {index.collections.slice(0, 4).map((collection) => (
                    <div key={collection.slug} className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-3 py-2">
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">
                        {collection.name.zh || collection.slug}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {countCollectionUsage(index, collection.slug)} 篇
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  };

  const renderArticleWorkspace = () => {
    if (!index) {
      return null;
    }

    return (
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Panel
          title="文章列表"
          subtitle="左侧先选文章，右侧再进入清晰分组的编辑器。"
          icon={<BookCopy size={20} />}
          className="xl:sticky xl:top-6"
          bodyClassName="space-y-4"
          actions={
            <ToolbarButton icon={<Plus size={16} />} onClick={jumpToNewArticle} disabled={busy}>
              新建文章
            </ToolbarButton>
          }
        >
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
            />
            <input
              value={articleSearch}
              onChange={(event) => setArticleSearch(event.target.value)}
              placeholder="按 slug / 标题搜索"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/90 py-3 pl-11 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
            />
          </div>

          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const selected = selectedArticleSlug === article.slug;
              const collectionName = article.collection
                ? index.collections.find((item) => item.slug === article.collection)?.name.zh || article.collection
                : '无合集';
              const contentType = getBlogContentType(article);

              return (
                <button
                  key={article.slug}
                  type="button"
                  onClick={() => selectArticle(article.slug)}
                  className={cn(
                    'w-full rounded-[1.2rem] border px-4 py-4 text-left transition-colors',
                    selected
                      ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/12'
                      : 'border-white/10 bg-white/[0.04] hover:border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/7'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {article.title.zh || article.title.en || article.slug}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">{article.slug}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--color-text-secondary)]">{article.date}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusChip label={contentType === 'repost' ? '转载' : '原创'} tone={contentType === 'repost' ? 'accent' : 'neutral'} />
                    <StatusChip label={article.category} />
                    <StatusChip label={collectionName} />
                  </div>
                </button>
              );
            })}

            {filteredArticles.length === 0 ? (
              <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                没找到匹配的文章，换个关键词试试。
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel
            title={selectedArticleSlug ? '文章编辑器' : '新建文章'}
            subtitle="按“基础信息 → 内容导入 → 展示信息”的顺序填写，避免遗漏关键步骤。"
            icon={<FolderUp size={20} />}
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusChip label={selectedArticleSlug ? '编辑现有文章' : '新建草稿'} tone="accent" />
                <StatusChip label={isArticleDirty ? '草稿未保存' : '草稿已同步'} tone={isArticleDirty ? 'warning' : 'success'} />
              </div>
            }
          >
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Slug</label>
                  <input
                    value={articleDraft.slug}
                    onChange={(event) => setArticleDraft((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="例如 flp-impossible"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">发布日期</label>
                  <input
                    type="date"
                    value={articleDraft.date}
                    onChange={(event) => setArticleDraft((current) => ({ ...current, date: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">内容类型</label>
                  <select
                    value={articleDraft.contentType}
                    onChange={(event) =>
                      setArticleDraft((current) => ({
                        ...current,
                        contentType: event.target.value as BlogContentType,
                        source: current.source ?? createEmptySourceDraft(),
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  >
                    <option value="original">原创</option>
                    <option value="repost">转载</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">分类</label>
                  <select
                    value={articleDraft.category}
                    onChange={(event) => setArticleDraft((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  >
                    <option value="">选择分类</option>
                    {index.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label.zh || category.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">合集</label>
                  <select
                    value={articleDraft.collection || ''}
                    onChange={(event) => setArticleDraft((current) => ({ ...current, collection: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  >
                    <option value="">无合集</option>
                    {index.collections.map((collection) => (
                      <option key={collection.slug} value={collection.slug}>
                        {collection.name.zh || collection.slug}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">合集内顺序</label>
                  <input
                    type="number"
                    value={articleDraft.seriesOrder ?? ''}
                    onChange={(event) =>
                      setArticleDraft((current) => ({
                        ...current,
                        seriesOrder: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                    placeholder="例如 3"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">推荐位顺序</label>
                  <input
                    type="number"
                    value={articleDraft.featuredRank ?? ''}
                    onChange={(event) =>
                      setArticleDraft((current) => ({
                        ...current,
                        featuredRank: event.target.value ? Number(event.target.value) : undefined,
                      }))
                    }
                    placeholder="可选"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  />
                </div>
              </div>

              {slugRenamePending ? (
                <div className="rounded-[1.2rem] border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  已修改现有文章的 slug。若当前 slug 对应的新目录尚不存在，保存前需要重新选择文章文件夹导入。
                </div>
              ) : null}

              <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">标签与附加属性</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      常用标签直接点选；如果缺少标签，可以在这里顺手新建。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={newTagText}
                      onChange={(event) => setNewTagText(event.target.value)}
                      placeholder="新增标签"
                      className="rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                    />
                    <ToolbarButton
                      icon={<Plus size={16} />}
                      onClick={() => {
                        const trimmedTag = newTagText.trim();
                        if (!trimmedTag) {
                          return;
                        }

                        applyWorkingIndexUpdate((currentIndex) => addTag(currentIndex, trimmedTag));
                        setArticleDraft((current) => ({
                          ...current,
                          tags: uniqueTags([...current.tags, trimmedTag]),
                        }));
                        setNewTagText('');
                      }}
                    >
                      新建并附加
                    </ToolbarButton>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {index.tags.map((tag) => {
                    const active = articleDraft.tags.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setArticleDraft((current) => ({
                            ...current,
                            tags: active
                              ? current.tags.filter((item) => item !== tag)
                              : uniqueTags([...current.tags, tag]),
                          }))
                        }
                        className={cn(
                          'rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
                          active
                            ? 'border-[var(--color-accent)]/25 bg-[var(--color-accent)] text-white'
                            : 'border-white/10 bg-white/[0.04] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/20'
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {articleDraft.contentType === 'repost' ? (
                <div className="rounded-[1.3rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent)]/[0.04] p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">转载来源</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      前台只显示一个来源链接，其他字段保留在元信息里便于整理与追溯。
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">来源链接</label>
                      <input
                        value={articleDraft.source?.url ?? ''}
                        onChange={(event) =>
                          setArticleDraft((current) => ({
                            ...current,
                            source: {
                              ...(current.source ?? createEmptySourceDraft()),
                              url: event.target.value,
                            },
                          }))
                        }
                        placeholder="https://go.dev/blog/..."
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">原站点</label>
                      <input
                        value={articleDraft.source?.site ?? ''}
                        onChange={(event) =>
                          setArticleDraft((current) => ({
                            ...current,
                            source: {
                              ...(current.source ?? createEmptySourceDraft()),
                              site: event.target.value,
                            },
                          }))
                        }
                        placeholder="例如 go.dev/blog"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">原作者</label>
                      <input
                        value={articleDraft.source?.author ?? ''}
                        onChange={(event) =>
                          setArticleDraft((current) => ({
                            ...current,
                            source: {
                              ...(current.source ?? createEmptySourceDraft()),
                              author: event.target.value,
                            },
                          }))
                        }
                        placeholder="例如 Russ Cox"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">原文发布日期</label>
                      <input
                        type="date"
                        value={articleDraft.source?.publishedAt ?? ''}
                        onChange={(event) =>
                          setArticleDraft((current) => ({
                            ...current,
                            source: {
                              ...(current.source ?? createEmptySourceDraft()),
                              publishedAt: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">原文标题（中文）</label>
                      <input
                        value={articleDraft.source?.title.zh ?? ''}
                        onChange={(event) =>
                          setArticleDraft((current) => ({
                            ...current,
                            source: {
                              ...(current.source ?? createEmptySourceDraft()),
                              title: {
                                ...(current.source?.title ?? createEmptySourceDraft().title),
                                zh: event.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="中文原文标题"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">原文标题（英文）</label>
                      <input
                        value={articleDraft.source?.title.en ?? ''}
                        onChange={(event) =>
                          setArticleDraft((current) => ({
                            ...current,
                            source: {
                              ...(current.source ?? createEmptySourceDraft()),
                              title: {
                                ...(current.source?.title ?? createEmptySourceDraft().title),
                                en: event.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Original title"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <LinkedFieldGroup
                title="标题"
                description="标题默认分开编辑；如果中英文一致，再切换成 EN 跟随中文。"
                linked={articleFieldLinks.title}
                onLinkedChange={(value) => setArticleFieldLinks((current) => ({ ...current, title: value }))}
                values={articleDraft.title}
                onChange={(language, value) =>
                  setArticleDraft((current) => ({
                    ...current,
                    title: {
                      ...current.title,
                      [language]: value,
                    },
                  }))
                }
                placeholders={{
                  linked: '输入标题，会同时写入 zh/en',
                  zh: '中文标题',
                  en: 'English title',
                }}
              />

              <LinkedFieldGroup
                title="摘要"
                description="摘要默认分开编辑；如果两边内容一致，再切换成 EN 跟随中文。"
                linked={articleFieldLinks.summary}
                onLinkedChange={(value) => setArticleFieldLinks((current) => ({ ...current, summary: value }))}
                values={articleDraft.summary}
                onChange={(language, value) =>
                  setArticleDraft((current) => ({
                    ...current,
                    summary: {
                      ...current.summary,
                      [language]: value,
                    },
                  }))
                }
                placeholders={{
                  linked: '输入摘要，会同时写入 zh/en',
                  zh: '中文摘要',
                  en: 'English summary',
                }}
                multiline
                rows={4}
              />

              <LinkedFieldGroup
                title="阅读时长"
                description="阅读时长默认分开编辑；如果中英文展示一致，可切换成 EN 跟随中文。"
                linked={articleFieldLinks.readingTime}
                onLinkedChange={(value) => setArticleFieldLinks((current) => ({ ...current, readingTime: value }))}
                values={articleDraft.readingTime}
                onChange={(language, value) =>
                  setArticleDraft((current) => ({
                    ...current,
                    readingTime: {
                      ...current.readingTime,
                      [language]: value,
                    },
                  }))
                }
                placeholders={{
                  linked: '例如 8 分钟 / 8 min',
                  zh: '例如 8 分钟',
                  en: '例如 8 min',
                }}
              />

              <div className="rounded-[1.3rem] border border-dashed border-[var(--color-accent)]/35 bg-[var(--color-accent)]/8 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-xl">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">内容导入</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      选择本地文章文件夹后，会复制其内容到 `public/blog/{articleDraft.slug || 'your-slug'}`。
                    </p>
                    {pendingFiles.length > 0 ? (
                      <p className="mt-3 text-xs font-semibold text-[var(--color-accent)]">
                        已选择：{currentFolderName}（{pendingFiles.length} 个文件）
                      </p>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--color-text-secondary)]">当前还没有选中文件夹。</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <input
                      ref={directoryInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))}
                    />
                    <ToolbarButton icon={<FolderUp size={16} />} onClick={() => directoryInputRef.current?.click()} disabled={busy}>
                      选择本地文件夹
                    </ToolbarButton>
                    <ToolbarButton
                      icon={<Trash2 size={16} />}
                      onClick={() => {
                        setPendingFiles([]);
                        if (directoryInputRef.current) {
                          directoryInputRef.current.value = '';
                        }
                      }}
                      disabled={busy || pendingFiles.length === 0}
                    >
                      清空选择
                    </ToolbarButton>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <ToolbarButton icon={<Save size={16} />} onClick={handleSaveCurrentArticle} disabled={busy}>
                  保存文章元信息
                </ToolbarButton>
                <ToolbarButton
                  icon={<FolderUp size={16} />}
                  onClick={handleImportCurrentArticle}
                  disabled={busy}
                  variant="primary"
                >
                  上传文件夹并保存
                </ToolbarButton>
                {selectedArticleSlug ? (
                  <ToolbarButton
                    icon={<Trash2 size={16} />}
                    onClick={handleDeleteCurrentArticle}
                    disabled={busy}
                    variant="danger"
                  >
                    删除当前文章
                  </ToolbarButton>
                ) : null}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  };

  const renderTagsWorkspace = () => {
    if (!index) {
      return null;
    }

    return (
      <Panel title="标签" subtitle="支持全局重命名和删除，文章上的标签会实时跟着变。" icon={<Tag size={20} />}>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={newTagText}
              onChange={(event) => setNewTagText(event.target.value)}
              placeholder="新增标签，例如 Distributed Systems"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
            />
            <ToolbarButton
              icon={<Plus size={16} />}
              onClick={() => {
                const trimmedTag = newTagText.trim();
                if (!trimmedTag) {
                  return;
                }
                applyWorkingIndexUpdate((currentIndex) => addTag(currentIndex, trimmedTag));
                setNewTagText('');
              }}
              disabled={busy}
              variant="primary"
            >
              新建标签
            </ToolbarButton>
          </div>

          <div className="space-y-3">
            {index.tags.map((tag) => (
              <div
                key={tag}
                className="flex flex-col gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4 lg:flex-row lg:items-center"
              >
                <input
                  value={tag}
                  onChange={(event) => applyWorkingIndexUpdate((currentIndex) => renameTag(currentIndex, tag, event.target.value))}
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                />
                <div className="flex items-center gap-3 lg:shrink-0">
                  <StatusChip label={`${countTagUsage(index, tag)} 篇文章`} />
                  <ToolbarButton
                    icon={<Trash2 size={16} />}
                    onClick={() => applyWorkingIndexUpdate((currentIndex) => removeTag(currentIndex, tag))}
                    disabled={busy}
                    variant="danger"
                  >
                    删除
                  </ToolbarButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    );
  };

  const renderCategoriesWorkspace = () => {
    if (!index) {
      return null;
    }

    const usageCount = selectedCategory ? countCategoryUsage(index, selectedCategory.id) : 0;

    return (
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel
          title="分类列表"
          subtitle="从左侧挑选分类，再在右侧编辑详情。"
          icon={<Layers3 size={20} />}
          className="xl:sticky xl:top-6"
          actions={
            <ToolbarButton
              icon={<Plus size={16} />}
              onClick={() => {
                if (!index) {
                  return;
                }
                const nextIndex = normalizeBlogIndex({
                  ...index,
                  categories: [...index.categories, createEmptyCategory()],
                });
                setIndex(nextIndex);
                setSelectedCategoryIndex(nextIndex.categories.length - 1);
              }}
              disabled={busy}
            >
              新建分类
            </ToolbarButton>
          }
        >
          <div className="space-y-3">
            {index.categories.map((category, categoryIndex) => (
              <button
                key={`${category.id}-${categoryIndex}`}
                type="button"
                onClick={() => setSelectedCategoryIndex(categoryIndex)}
                className={cn(
                  'w-full rounded-[1.2rem] border px-4 py-4 text-left transition-colors',
                  categoryIndex === selectedCategoryIndex
                    ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/12'
                    : 'border-white/10 bg-white/[0.04] hover:border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/7'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {category.label.zh || category.id || '未命名分类'}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">{category.id || '待填写 id'}</p>
                  </div>
                  <StatusChip label={`${countCategoryUsage(index, category.id)} 篇`} />
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="分类编辑器"
          subtitle="分类会直接影响博客页顶部频道筛选和文章归属。"
          icon={<Layers3 size={20} />}
        >
          {selectedCategory ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip label={`已关联 ${usageCount} 篇文章`} tone={usageCount > 0 ? 'warning' : 'neutral'} />
                <StatusChip label={selectedCategory.id || '未设置 id'} tone="accent" />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Category ID</label>
                  <input
                    value={selectedCategory.id}
                    onChange={(event) =>
                      applyWorkingIndexUpdate((currentIndex) => renameCategoryId(currentIndex, selectedCategory.id, event.target.value))
                    }
                    placeholder="例如 distributed-systems"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  />
                </div>
                <div className="flex items-end">
                  <ToolbarButton
                    icon={<Trash2 size={16} />}
                    onClick={() => {
                      if (usageCount > 0) {
                        setErrorText('该分类已被文章使用，不能直接删除。');
                        return;
                      }

                      applyWorkingIndexUpdate((currentIndex) => ({
                        ...currentIndex,
                        categories: currentIndex.categories.filter((_, itemIndex) => itemIndex !== selectedCategoryIndex),
                      }));
                      setSelectedCategoryIndex((current) => Math.max(0, current - 1));
                    }}
                    disabled={busy}
                    variant="danger"
                  >
                    删除分类
                  </ToolbarButton>
                </div>
              </div>

              <LinkedFieldGroup
                title="分类名称"
                description="分类名称默认分开编辑；如果中英文一致，再切换成 EN 跟随中文。"
                linked={categoryFieldLinks.primary}
                onLinkedChange={(value) => setCategoryFieldLinks((current) => ({ ...current, primary: value }))}
                values={selectedCategory.label}
                onChange={(language, value) =>
                  applyWorkingIndexUpdate((currentIndex) => ({
                    ...currentIndex,
                    categories: currentIndex.categories.map((category, itemIndex) =>
                      itemIndex === selectedCategoryIndex
                        ? {
                            ...category,
                            label: {
                              ...category.label,
                              [language]: value,
                            },
                          }
                        : category
                    ),
                  }))
                }
                placeholders={{
                  linked: '输入分类名称，会同时写入 zh/en',
                  zh: '中文分类名',
                  en: 'English category name',
                }}
              />

              <LinkedFieldGroup
                title="分类描述"
                description="描述会用于博客页筛选区和管理页辅助说明。"
                linked={categoryFieldLinks.secondary}
                onLinkedChange={(value) => setCategoryFieldLinks((current) => ({ ...current, secondary: value }))}
                values={selectedCategory.description}
                onChange={(language, value) =>
                  applyWorkingIndexUpdate((currentIndex) => ({
                    ...currentIndex,
                    categories: currentIndex.categories.map((category, itemIndex) =>
                      itemIndex === selectedCategoryIndex
                        ? {
                            ...category,
                            description: {
                              ...category.description,
                              [language]: value,
                            },
                          }
                        : category
                    ),
                  }))
                }
                placeholders={{
                  linked: '输入分类描述，会同时写入 zh/en',
                  zh: '中文描述',
                  en: 'English description',
                }}
                multiline
                rows={4}
              />
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
              还没有分类，先在左侧新建一个。
            </div>
          )}
        </Panel>
      </div>
    );
  };

  const renderCollectionsWorkspace = () => {
    if (!index) {
      return null;
    }

    const usageCount = selectedCollection ? countCollectionUsage(index, selectedCollection.slug) : 0;

    return (
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Panel
          title="合集列表"
          subtitle="合集用于博客列表页分组和阅读页右侧系列导航。"
          icon={<FolderUp size={20} />}
          className="xl:sticky xl:top-6"
          actions={
            <ToolbarButton
              icon={<Plus size={16} />}
              onClick={() => {
                if (!index) {
                  return;
                }
                const nextIndex = normalizeBlogIndex({
                  ...index,
                  collections: [...index.collections, createEmptyCollection()],
                });
                setIndex(nextIndex);
                setSelectedCollectionIndex(nextIndex.collections.length - 1);
              }}
              disabled={busy}
            >
              新建合集
            </ToolbarButton>
          }
        >
          <div className="space-y-3">
            {index.collections.map((collection, collectionIndex) => (
              <button
                key={`${collection.slug}-${collectionIndex}`}
                type="button"
                onClick={() => setSelectedCollectionIndex(collectionIndex)}
                className={cn(
                  'w-full rounded-[1.2rem] border px-4 py-4 text-left transition-colors',
                  collectionIndex === selectedCollectionIndex
                    ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/12'
                    : 'border-white/10 bg-white/[0.04] hover:border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/7'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {collection.name.zh || collection.slug || '未命名合集'}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">{collection.slug || '待填写 slug'}</p>
                  </div>
                  <StatusChip label={`${countCollectionUsage(index, collection.slug)} 篇`} />
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="合集编辑器"
          subtitle="删除合集时，会清空相关文章的合集归属与系列顺序。"
          icon={<FolderUp size={20} />}
        >
          {selectedCollection ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip label={`已关联 ${usageCount} 篇文章`} tone={usageCount > 0 ? 'warning' : 'neutral'} />
                <StatusChip label={selectedCollection.slug || '未设置 slug'} tone="accent" />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">Collection Slug</label>
                  <input
                    value={selectedCollection.slug}
                    onChange={(event) =>
                      applyWorkingIndexUpdate((currentIndex) =>
                        renameCollectionSlug(currentIndex, selectedCollection.slug, event.target.value)
                      )
                    }
                    placeholder="例如 backend-reliability-playbook"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]/50"
                  />
                </div>
                <div className="flex items-end">
                  <ToolbarButton
                    icon={<Trash2 size={16} />}
                    onClick={() => {
                      const targetSlug = selectedCollection.slug;
                      applyWorkingIndexUpdate((currentIndex) => ({
                        ...currentIndex,
                        collections: currentIndex.collections.filter((_, itemIndex) => itemIndex !== selectedCollectionIndex),
                        articles: currentIndex.articles.map((article) =>
                          article.collection === targetSlug
                            ? { ...article, collection: undefined, seriesOrder: undefined }
                            : article
                        ),
                      }));
                      setSelectedCollectionIndex((current) => Math.max(0, current - 1));
                    }}
                    disabled={busy}
                    variant="danger"
                  >
                    删除合集
                  </ToolbarButton>
                </div>
              </div>

              <LinkedFieldGroup
                title="合集名称"
                description="合集名称默认分开编辑；如果中英文一致，再切换成 EN 跟随中文。"
                linked={collectionFieldLinks.primary}
                onLinkedChange={(value) => setCollectionFieldLinks((current) => ({ ...current, primary: value }))}
                values={selectedCollection.name}
                onChange={(language, value) =>
                  applyWorkingIndexUpdate((currentIndex) => ({
                    ...currentIndex,
                    collections: currentIndex.collections.map((collection, itemIndex) =>
                      itemIndex === selectedCollectionIndex
                        ? {
                            ...collection,
                            name: {
                              ...collection.name,
                              [language]: value,
                            },
                          }
                        : collection
                    ),
                  }))
                }
                placeholders={{
                  linked: '输入合集名称，会同时写入 zh/en',
                  zh: '中文合集名',
                  en: 'English collection name',
                }}
              />

              <LinkedFieldGroup
                title="合集描述"
                description="这里的说明会在合集页和文章页系列卡片里使用。"
                linked={collectionFieldLinks.secondary}
                onLinkedChange={(value) => setCollectionFieldLinks((current) => ({ ...current, secondary: value }))}
                values={selectedCollection.description}
                onChange={(language, value) =>
                  applyWorkingIndexUpdate((currentIndex) => ({
                    ...currentIndex,
                    collections: currentIndex.collections.map((collection, itemIndex) =>
                      itemIndex === selectedCollectionIndex
                        ? {
                            ...collection,
                            description: {
                              ...collection.description,
                              [language]: value,
                            },
                          }
                        : collection
                    ),
                  }))
                }
                placeholders={{
                  linked: '输入合集描述，会同时写入 zh/en',
                  zh: '中文合集描述',
                  en: 'English collection description',
                }}
                multiline
                rows={4}
              />
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
              还没有合集，先在左侧新建一个。
            </div>
          )}
        </Panel>
      </div>
    );
  };

  const renderTaxonomyWorkspace = () => {
    if (!index) {
      return null;
    }

    return (
      <div className="space-y-5">
        <Panel
          title="站点结构"
          subtitle="把标签、分类、合集集中维护；文章工作区只负责当前文章。"
          icon={<Layers3 size={20} />}
        >
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'tags', label: '标签', count: index.tags.length },
              { key: 'categories', label: '分类', count: index.categories.length },
              { key: 'collections', label: '合集', count: index.collections.length },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTaxonomyTab(item.key as TaxonomyTab)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  taxonomyTab === item.key
                    ? 'border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'border-white/10 bg-white/[0.04] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/20 hover:text-[var(--color-text-primary)]'
                )}
              >
                {item.label}
                <span className="rounded-full bg-slate-950/90 px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </Panel>

        {taxonomyTab === 'tags' ? renderTagsWorkspace() : null}
        {taxonomyTab === 'categories' ? renderCategoriesWorkspace() : null}
        {taxonomyTab === 'collections' ? renderCollectionsWorkspace() : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <Panel
          title="本地博客管理台"
          subtitle="默认从总览进入，按“文章”和“站点结构”两类工作区拆开日常维护流程。"
          icon={<ShieldCheck size={20} />}
          actions={
            <>
              <ToolbarButton icon={<RefreshCw size={16} />} onClick={handleReload} disabled={busy || loading}>
                重新加载
              </ToolbarButton>
              <ToolbarButton
                icon={<Save size={16} />}
                onClick={handleSaveSiteMetadata}
                disabled={busy || loading || !index}
                variant="primary"
              >
                保存站点结构
              </ToolbarButton>
            </>
          }
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusChip label="仅本地可用" tone="accent" />
                <StatusChip label={hasUnsavedChanges ? '存在未保存修改' : '当前已同步'} tone={hasUnsavedChanges ? 'warning' : 'success'} />
                <StatusChip label={LOCAL_BLOG_ADMIN_HASH_PATH} />
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
                这里负责维护 `public/blog` 的文章目录和 `index.json` 元信息。现在把入口、发文、结构管理拆开处理，减少一次性面对的大表单。
              </p>
            </div>
          </div>
        </Panel>

        {(statusText || errorText) && (
          <div
            className={cn(
              'rounded-[1.3rem] border px-5 py-4 text-sm',
              errorText
                ? 'border-rose-400/25 bg-rose-500/10 text-rose-100'
                : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
            )}
          >
            {errorText || statusText}
          </div>
        )}

        {loading || !index ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <Panel title="工作区" subtitle="先选任务，再进入对应操作界面。" icon={<LayoutDashboard size={20} />}>
                <div className="space-y-3">
                  <RailButton
                    active={view === 'overview'}
                    icon={<LayoutDashboard size={18} />}
                    title="总览"
                    description="统计、快速入口和当前状态都在这里。"
                    onClick={() => switchView('overview')}
                  />
                  <RailButton
                    active={view === 'articles'}
                    icon={<BookCopy size={18} />}
                    title="文章"
                    description="文章列表 + 编辑器，导入流程和元信息都在这一块。"
                    onClick={() => switchView('articles')}
                  />
                  <RailButton
                    active={view === 'taxonomy'}
                    icon={<Layers3 size={18} />}
                    title="站点结构"
                    description="维护标签、分类、合集，不再与文章编辑混在一起。"
                    onClick={() => switchView('taxonomy')}
                  />
                </div>
              </Panel>

              <Panel title="保存提示" subtitle="这两类改动分别保存，避免误操作。" icon={<Save size={20} />}>
                <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-3">
                    <p className="font-semibold text-[var(--color-text-primary)]">文章改动</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      右侧文章编辑器的改动需要点击“保存文章元信息”或“上传文件夹并保存”。
                    </p>
                  </div>
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-3">
                    <p className="font-semibold text-[var(--color-text-primary)]">站点结构改动</p>
                    <p className="mt-1 text-xs leading-relaxed">
                      标签、分类、合集的修改统一点顶部“保存站点结构”，再回到文章工作区。
                    </p>
                  </div>
                </div>
              </Panel>
            </aside>

            <main className="min-w-0">
              {view === 'overview' ? renderOverview() : null}
              {view === 'articles' ? renderArticleWorkspace() : null}
              {view === 'taxonomy' ? renderTaxonomyWorkspace() : null}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
