import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookCopy,
  FolderUp,
  Layers3,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  addTag,
  createEmptyArticle,
  createEmptyCategory,
  createEmptyCollection,
  removeTag,
  renameTag,
  upsertArticle,
} from '../lib/blogAdminState';
import { primeBlogIndex, type BlogArticleMeta, type BlogIndex } from '../lib/blog';
import {
  deleteLocalArticle,
  fetchLocalBlogAdminState,
  importLocalArticleFolder,
  saveLocalBlogIndex,
} from '../lib/localBlogAdmin';
import { LOCAL_BLOG_ADMIN_HASH_PATH, isLocalAdminHostname } from '../lib/localBlogAdminConfig';

function uniqueTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
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

function SectionShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-gray-200/80 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="flex items-start gap-4 mb-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--color-text-primary)]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function LocalBlogAdmin() {
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const isLocalHost = typeof window !== 'undefined' && isLocalAdminHostname(window.location.hostname);

  const [index, setIndex] = useState<BlogIndex | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [articleDraft, setArticleDraft] = useState<BlogArticleMeta>(createEmptyArticle());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [newTagText, setNewTagText] = useState('');
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
        setIndex(normalizedIndex);

        const firstArticle = normalizedIndex.articles[0];
        if (firstArticle) {
          setSelectedArticleSlug(firstArticle.slug);
          setArticleDraft({
            ...firstArticle,
            collection: firstArticle.collection ?? '',
          });
        } else {
          setArticleDraft(createEmptyArticle(normalizedIndex));
        }

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

  const applyIndexUpdate = (nextIndex: BlogIndex) => {
    const normalizedIndex = primeBlogIndex(nextIndex);
    setIndex(normalizedIndex);
    return normalizedIndex;
  };

  const openArticleDraft = (slug: string | null, nextIndex: BlogIndex) => {
    if (!slug) {
      setSelectedArticleSlug(null);
      setArticleDraft(createEmptyArticle(nextIndex));
      setPendingFiles([]);
      return;
    }

    const targetArticle = nextIndex.articles.find((article) => article.slug === slug);
    if (!targetArticle) {
      setSelectedArticleSlug(null);
      setArticleDraft(createEmptyArticle(nextIndex));
      setPendingFiles([]);
      return;
    }

    setSelectedArticleSlug(targetArticle.slug);
    setArticleDraft({
      ...targetArticle,
      collection: targetArticle.collection ?? '',
    });
    setPendingFiles([]);
  };

  const handleReload = async () => {
    if (!isLocalHost) {
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const { index: latestIndex } = await fetchLocalBlogAdminState();
      const normalizedIndex = applyIndexUpdate(latestIndex);
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

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const { index: savedIndex } = await saveLocalBlogIndex(index);
      const normalizedIndex = applyIndexUpdate(savedIndex);
      openArticleDraft(selectedArticleSlug, normalizedIndex);
      setStatusText('标签、分类、合集等站点元信息已保存。');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '保存元信息失败');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCurrentArticle = async () => {
    if (!index) {
      return;
    }

    const sanitizedDraft = sanitizeArticleDraft(articleDraft);
    if (!sanitizedDraft.slug || !sanitizedDraft.category || !sanitizedDraft.title.zh || !sanitizedDraft.title.en) {
      setErrorText('请至少填写 slug、分类以及中英文标题。');
      return;
    }

    if (!hasArticleFolder(index, sanitizedDraft.slug) && pendingFiles.length === 0) {
      setErrorText('新文章需要先选择本地文件夹，再保存。');
      return;
    }

    setBusy(true);
    setErrorText('');
    setStatusText('');

    try {
      const nextIndex = upsertArticle(index, sanitizedDraft);
      const { index: savedIndex } = await saveLocalBlogIndex(nextIndex);
      const normalizedIndex = applyIndexUpdate(savedIndex);
      openArticleDraft(sanitizedDraft.slug, normalizedIndex);
      setStatusText('当前文章元信息已保存。');
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '保存文章元信息失败');
    } finally {
      setBusy(false);
    }
  };

  const handleImportCurrentArticle = async () => {
    if (!index) {
      return;
    }

    const sanitizedDraft = sanitizeArticleDraft(articleDraft);
    if (!sanitizedDraft.slug || !sanitizedDraft.category || !sanitizedDraft.title.zh || !sanitizedDraft.title.en) {
      setErrorText('请先完整填写当前文章的基本元信息。');
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
      const nextIndex = upsertArticle(index, sanitizedDraft);
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
        overwriteFolder: hasArticleFolder(index, sanitizedDraft.slug),
      });

      const normalizedIndex = applyIndexUpdate(savedIndex);
      openArticleDraft(sanitizedDraft.slug, normalizedIndex);
      setStatusText(`已导入文件夹 ${currentFolderName || sanitizedDraft.slug}，并同步更新总元信息。`);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : '导入文章文件夹失败');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCurrentArticle = async () => {
    if (!selectedArticleSlug || !index) {
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
      const normalizedIndex = applyIndexUpdate(savedIndex);
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
      <div className="min-h-screen px-6 py-16 bg-[var(--color-bg)]">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-300/60 bg-amber-50/90 p-8 text-amber-950 shadow-[0_20px_70px_rgba(120,53,15,0.12)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">本地博客管理台仅允许 localhost 访问</h1>
              <p className="mt-3 text-sm leading-relaxed">
                该页面不会出现在主站导航里，只在本地开发环境通过特定地址打开。
              </p>
              <p className="mt-3 text-sm leading-relaxed font-medium">建议地址：{LOCAL_BLOG_ADMIN_HASH_PATH}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-gray-200/80 bg-white/88 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_50%)]" />
          <div className="relative">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  <ShieldCheck size={14} />
                  仅本地可用 / 隐藏入口
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                  本地博客管理台
                </h1>
                <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]">
                  这里负责本地维护 `public/blog` 的文章目录、`index.json` 元信息，以及标签、分类、合集的增删改查。
                </p>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                  访问路径：{LOCAL_BLOG_ADMIN_HASH_PATH}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReload}
                  disabled={busy || loading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <RefreshCw size={16} />
                  重新加载
                </button>
                <button
                  type="button"
                  onClick={handleSaveSiteMetadata}
                  disabled={busy || loading || !index}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                >
                  <Save size={16} />
                  保存站点元信息
                </button>
              </div>
            </div>
          </div>
        </section>

        {(statusText || errorText) && (
          <div
            className={`rounded-[1.5rem] border px-5 py-4 text-sm ${
              errorText
                ? 'border-rose-300/70 bg-rose-50 text-rose-800'
                : 'border-emerald-300/70 bg-emerald-50 text-emerald-800'
            }`}
          >
            {errorText || statusText}
          </div>
        )}

        {loading || !index ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="w-10 h-10 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: '文章', value: index.articles.length, icon: <BookCopy size={18} /> },
                  { label: '标签', value: index.tags.length, icon: <Tag size={18} /> },
                  { label: '分类', value: index.categories.length, icon: <Layers3 size={18} /> },
                  { label: '合集', value: index.collections.length, icon: <FolderUp size={18} /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-gray-200/80 bg-white/85 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.04)] dark:border-slate-800/80 dark:bg-slate-950/60"
                  >
                    <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.icon}
                    </div>
                    <p className="mt-4 text-3xl font-black tracking-tight text-[var(--color-text-primary)]">{item.value}</p>
                  </div>
                ))}
              </div>

              <SectionShell title="标签管理" subtitle="支持全局重命名和删除，文章里的标签会同步更新。" icon={<Tag size={22} />}>
                <div className="flex flex-wrap gap-3 mb-4">
                  <input
                    value={newTagText}
                    onChange={(event) => setNewTagText(event.target.value)}
                    placeholder="新增标签，例如 Security"
                    className="min-w-[220px] flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmedTag = newTagText.trim();
                      if (!trimmedTag) {
                        return;
                      }
                      setIndex(addTag(index, trimmedTag));
                      setNewTagText('');
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    新增标签
                  </button>
                </div>

                <div className="space-y-3">
                  {index.tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex flex-col gap-3 rounded-[1.25rem] border border-gray-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/60 md:flex-row md:items-center"
                    >
                      <input
                        value={tag}
                        onChange={(event) => setIndex(renameTag(index, tag, event.target.value))}
                        className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => setIndex(removeTag(index, tag))}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300/60 px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </SectionShell>

              <SectionShell title="分类管理" subtitle="分类决定博客页顶部频道筛选和文章归属。" icon={<Layers3 size={22} />}>
                <div className="space-y-4">
                  {index.categories.map((category, categoryIndex) => {
                    const isInUse = index.articles.some((article) => article.category === category.id);

                    return (
                      <div
                        key={`${category.id}-${categoryIndex}`}
                        className="rounded-[1.25rem] border border-gray-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            value={category.id}
                            onChange={(event) => {
                              const previousCategoryId = category.id;
                              const nextCategoryId = event.target.value.toLowerCase();
                              setIndex({
                                ...index,
                                categories: index.categories.map((item, itemIndex) =>
                                  itemIndex === categoryIndex ? { ...item, id: nextCategoryId } : item
                                ),
                                articles: previousCategoryId
                                  ? index.articles.map((article) =>
                                      article.category === previousCategoryId
                                        ? { ...article, category: nextCategoryId }
                                        : article
                                    )
                                  : index.articles,
                              });
                              if (articleDraft.category === category.id) {
                                setArticleDraft((current) => ({ ...current, category: nextCategoryId }));
                              }
                            }}
                            placeholder="分类 id，例如 security-engineering"
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                          />
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              disabled={isInUse}
                              onClick={() => {
                                if (isInUse) {
                                  setErrorText('该分类已被文章使用，不能直接删除。');
                                  return;
                                }

                                setIndex({
                                  ...index,
                                  categories: index.categories.filter((_, itemIndex) => itemIndex !== categoryIndex),
                                });
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/60 px-4 py-3 text-sm font-medium text-rose-700 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              删除分类
                            </button>
                          </div>
                          <input
                            value={category.label.zh}
                            onChange={(event) =>
                              setIndex({
                                ...index,
                                categories: index.categories.map((item, itemIndex) =>
                                  itemIndex === categoryIndex
                                    ? { ...item, label: { ...item.label, zh: event.target.value } }
                                    : item
                                ),
                              })
                            }
                            placeholder="中文分类名"
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                          />
                          <input
                            value={category.label.en}
                            onChange={(event) =>
                              setIndex({
                                ...index,
                                categories: index.categories.map((item, itemIndex) =>
                                  itemIndex === categoryIndex
                                    ? { ...item, label: { ...item.label, en: event.target.value } }
                                    : item
                                ),
                              })
                            }
                            placeholder="English category name"
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                          />
                          <textarea
                            value={category.description.zh}
                            onChange={(event) =>
                              setIndex({
                                ...index,
                                categories: index.categories.map((item, itemIndex) =>
                                  itemIndex === categoryIndex
                                    ? { ...item, description: { ...item.description, zh: event.target.value } }
                                    : item
                                ),
                              })
                            }
                            placeholder="中文描述"
                            rows={3}
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                          />
                          <textarea
                            value={category.description.en}
                            onChange={(event) =>
                              setIndex({
                                ...index,
                                categories: index.categories.map((item, itemIndex) =>
                                  itemIndex === categoryIndex
                                    ? { ...item, description: { ...item.description, en: event.target.value } }
                                    : item
                                ),
                              })
                            }
                            placeholder="English description"
                            rows={3}
                            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setIndex({ ...index, categories: [...index.categories, createEmptyCategory()] })}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-dashed border-[var(--color-accent)]/40 px-4 py-3 text-sm font-medium text-[var(--color-accent)]"
                >
                  <Plus size={16} />
                  新建分类
                </button>
              </SectionShell>

              <SectionShell title="合集管理" subtitle="合集用于博客列表页分组和阅读页右侧系列导航。" icon={<FolderUp size={22} />}>
                <div className="space-y-4">
                  {index.collections.map((collection, collectionIndex) => (
                    <div
                      key={`${collection.slug}-${collectionIndex}`}
                      className="rounded-[1.25rem] border border-gray-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/60"
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={collection.slug}
                          onChange={(event) => {
                            const previousCollectionSlug = collection.slug;
                            const nextCollectionSlug = event.target.value.toLowerCase();
                            setIndex({
                              ...index,
                              collections: index.collections.map((item, itemIndex) =>
                                itemIndex === collectionIndex ? { ...item, slug: nextCollectionSlug } : item
                              ),
                              articles: previousCollectionSlug
                                ? index.articles.map((article) =>
                                    article.collection === previousCollectionSlug
                                      ? { ...article, collection: nextCollectionSlug }
                                      : article
                                  )
                                : index.articles,
                            });
                            if (articleDraft.collection === collection.slug) {
                              setArticleDraft((current) => ({ ...current, collection: nextCollectionSlug }));
                            }
                          }}
                          placeholder="合集 slug"
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                        />
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const targetSlug = collection.slug;
                              setIndex({
                                ...index,
                                collections: index.collections.filter((_, itemIndex) => itemIndex !== collectionIndex),
                                articles: index.articles.map((article) =>
                                  article.collection === targetSlug ? { ...article, collection: undefined, seriesOrder: undefined } : article
                                ),
                              });

                              if (articleDraft.collection === targetSlug) {
                                setArticleDraft((current) => ({ ...current, collection: '', seriesOrder: undefined }));
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/60 px-4 py-3 text-sm font-medium text-rose-700"
                          >
                            <Trash2 size={16} />
                            删除合集
                          </button>
                        </div>
                        <input
                          value={collection.name.zh}
                          onChange={(event) =>
                            setIndex({
                              ...index,
                              collections: index.collections.map((item, itemIndex) =>
                                itemIndex === collectionIndex
                                  ? { ...item, name: { ...item.name, zh: event.target.value } }
                                  : item
                              ),
                            })
                          }
                          placeholder="中文合集名"
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                        />
                        <input
                          value={collection.name.en}
                          onChange={(event) =>
                            setIndex({
                              ...index,
                              collections: index.collections.map((item, itemIndex) =>
                                itemIndex === collectionIndex
                                  ? { ...item, name: { ...item.name, en: event.target.value } }
                                  : item
                              ),
                            })
                          }
                          placeholder="English collection name"
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                        />
                        <textarea
                          value={collection.description.zh}
                          onChange={(event) =>
                            setIndex({
                              ...index,
                              collections: index.collections.map((item, itemIndex) =>
                                itemIndex === collectionIndex
                                  ? { ...item, description: { ...item.description, zh: event.target.value } }
                                  : item
                              ),
                            })
                          }
                          placeholder="中文合集描述"
                          rows={3}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                        />
                        <textarea
                          value={collection.description.en}
                          onChange={(event) =>
                            setIndex({
                              ...index,
                              collections: index.collections.map((item, itemIndex) =>
                                itemIndex === collectionIndex
                                  ? { ...item, description: { ...item.description, en: event.target.value } }
                                  : item
                              ),
                            })
                          }
                          placeholder="English collection description"
                          rows={3}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIndex({ ...index, collections: [...index.collections, createEmptyCollection()] })}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-dashed border-[var(--color-accent)]/40 px-4 py-3 text-sm font-medium text-[var(--color-accent)]"
                >
                  <Plus size={16} />
                  新建合集
                </button>
              </SectionShell>
            </div>

            <div className="space-y-6">
              <SectionShell title="文章列表" subtitle="选择一篇文章编辑，或新建一篇再上传本地文件夹。" icon={<BookCopy size={22} />}>
                <div className="mb-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openArticleDraft(null, index)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    新建文章
                  </button>
                </div>

                <div className="space-y-3">
                  {index.articles.map((article) => {
                    const selected = selectedArticleSlug === article.slug;

                    return (
                      <button
                        key={article.slug}
                        type="button"
                        onClick={() => openArticleDraft(article.slug, index)}
                        className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition-colors ${
                          selected
                            ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10'
                            : 'border-gray-200/80 bg-white/75 hover:border-[var(--color-accent)]/25 dark:border-slate-800/80 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold leading-snug ${selected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                              {article.title.zh || article.title.en || article.slug}
                            </p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{article.slug}</p>
                          </div>
                          <div className="shrink-0 text-xs text-[var(--color-text-secondary)]">{article.date}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionShell>

              <SectionShell title="当前文章" subtitle="上传文件夹时，支持同时新建标签并立即写回总元信息。" icon={<FolderUp size={22} />}>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={articleDraft.slug}
                      onChange={(event) => setArticleDraft((current) => ({ ...current, slug: event.target.value }))}
                      placeholder="slug，例如 zero-copy-rust-tips"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <input
                      type="date"
                      value={articleDraft.date}
                      onChange={(event) => setArticleDraft((current) => ({ ...current, date: event.target.value }))}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <select
                      value={articleDraft.category}
                      onChange={(event) => setArticleDraft((current) => ({ ...current, category: event.target.value }))}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="">选择分类</option>
                      {index.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label.zh || category.id}
                        </option>
                      ))}
                    </select>
                    <select
                      value={articleDraft.collection || ''}
                      onChange={(event) => setArticleDraft((current) => ({ ...current, collection: event.target.value }))}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="">无合集</option>
                      {index.collections.map((collection) => (
                        <option key={collection.slug} value={collection.slug}>
                          {collection.name.zh || collection.slug}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={articleDraft.seriesOrder ?? ''}
                      onChange={(event) =>
                        setArticleDraft((current) => ({
                          ...current,
                          seriesOrder: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                      placeholder="合集内顺序"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <input
                      type="number"
                      value={articleDraft.featuredRank ?? ''}
                      onChange={(event) =>
                        setArticleDraft((current) => ({
                          ...current,
                          featuredRank: event.target.value ? Number(event.target.value) : undefined,
                        }))
                      }
                      placeholder="推荐位顺序（可选）"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={articleDraft.title.zh}
                      onChange={(event) =>
                        setArticleDraft((current) => ({ ...current, title: { ...current.title, zh: event.target.value } }))
                      }
                      placeholder="中文标题"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <input
                      value={articleDraft.title.en}
                      onChange={(event) =>
                        setArticleDraft((current) => ({ ...current, title: { ...current.title, en: event.target.value } }))
                      }
                      placeholder="English title"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <textarea
                      value={articleDraft.summary.zh}
                      onChange={(event) =>
                        setArticleDraft((current) => ({ ...current, summary: { ...current.summary, zh: event.target.value } }))
                      }
                      placeholder="中文摘要"
                      rows={4}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <textarea
                      value={articleDraft.summary.en}
                      onChange={(event) =>
                        setArticleDraft((current) => ({ ...current, summary: { ...current.summary, en: event.target.value } }))
                      }
                      placeholder="English summary"
                      rows={4}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <input
                      value={articleDraft.readingTime.zh}
                      onChange={(event) =>
                        setArticleDraft((current) => ({
                          ...current,
                          readingTime: { ...current.readingTime, zh: event.target.value },
                        }))
                      }
                      placeholder="中文阅读时长，例如 8 分钟"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                    <input
                      value={articleDraft.readingTime.en}
                      onChange={(event) =>
                        setArticleDraft((current) => ({
                          ...current,
                          readingTime: { ...current.readingTime, en: event.target.value },
                        }))
                      }
                      placeholder="English reading time，例如 8 min"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <div className="rounded-[1.25rem] border border-gray-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/60">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">标签选择 / 新建</h3>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          点击切换当前文章的标签，也可以直接新增一个标签并附加到文章。
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <input
                          value={newTagText}
                          onChange={(event) => setNewTagText(event.target.value)}
                          placeholder="新增标签"
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] dark:border-slate-800 dark:bg-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedTag = newTagText.trim();
                            if (!trimmedTag) {
                              return;
                            }

                            setIndex(addTag(index, trimmedTag));
                            setArticleDraft((current) => ({
                              ...current,
                              tags: uniqueTags([...current.tags, trimmedTag]),
                            }));
                            setNewTagText('');
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-accent)]/30 px-4 py-3 text-sm font-medium text-[var(--color-accent)]"
                        >
                          <Plus size={16} />
                          新建并附加
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
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
                            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-[var(--color-accent)] text-white'
                                : 'bg-gray-100 text-[var(--color-text-secondary)] dark:bg-slate-800'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-dashed border-[var(--color-accent)]/35 bg-[var(--color-accent)]/5 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">文章文件夹导入</h3>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          选择一个本地文章文件夹后，会复制其内容到 `public/blog/{articleDraft.slug || 'your-slug'}`。
                        </p>
                        {pendingFiles.length > 0 && (
                          <p className="mt-3 text-xs font-medium text-[var(--color-accent)]">
                            已选择：{currentFolderName}（{pendingFiles.length} 个文件）
                          </p>
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
                        <button
                          type="button"
                          onClick={() => directoryInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] dark:border-slate-800 dark:bg-slate-900"
                        >
                          <FolderUp size={16} />
                          选择本地文件夹
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingFiles([]);
                            if (directoryInputRef.current) {
                              directoryInputRef.current.value = '';
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] dark:border-slate-800"
                        >
                          清空选择
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveCurrentArticle}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <Save size={16} />
                      保存当前文章元信息
                    </button>
                    <button
                      type="button"
                      onClick={handleImportCurrentArticle}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <FolderUp size={16} />
                      上传文件夹并保存
                    </button>
                    {selectedArticleSlug && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentArticle}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/60 px-4 py-3 text-sm font-medium text-rose-700 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        删除当前文章
                      </button>
                    )}
                  </div>
                </div>
              </SectionShell>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
