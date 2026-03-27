import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Clock, ExternalLink, Layers3, ListTree } from 'lucide-react';
import { useBlogIndex } from '../hooks/useBlogIndex';
import {
  computeArticleReadingProgress,
  findBlogCategory,
  findBlogCollection,
  getBlogContentType,
  getBlogLanguage,
  getCollectionArticles,
  getLocalizedText,
  parseMarkdownToc,
  stripFrontmatter,
} from '../lib/blog';

const BlogMarkdownRenderer = lazy(() => import('../components/blog/BlogMarkdownRenderer'));

function getViewportFocusY() {
  const stickyOffset = 112;
  const visibleTop = window.scrollY + stickyOffset;
  const visibleHeight = Math.max(window.innerHeight - stickyOffset, 1);

  return visibleTop + visibleHeight * 0.42;
}

function scrollToSection(sectionId: string) {
  const sectionElement = document.getElementById(sectionId);
  if (!sectionElement || typeof window === 'undefined') {
    return;
  }

  const sectionTop = window.scrollY + sectionElement.getBoundingClientRect().top;
  const alignOffset = getViewportFocusY() - window.scrollY;

  window.scrollTo({
    top: Math.max(0, sectionTop - alignOffset),
    behavior: 'smooth',
  });
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const lang = getBlogLanguage(i18n.language);
  const { index, loading: indexLoading, error: indexError } = useBlogIndex();
  const requestKey = slug ? `${slug}:${lang}` : '';
  const articleRef = useRef<HTMLElement | null>(null);

  const [content, setContent] = useState('');
  const [toc, setToc] = useState<ReturnType<typeof parseMarkdownToc>>([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState('');
  const [contentError, setContentError] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  useEffect(() => {
    if (!slug) {
      return;
    }

    let active = true;
    const base = import.meta.env.BASE_URL;

    fetch(`${base}blog/${slug}/index.${lang}.md`)
      .then(async (response) => {
        if (response.ok) {
          return response.text();
        }

        const fallback = await fetch(`${base}blog/${slug}/index.en.md`);
        if (!fallback.ok) {
          throw new Error('markdown');
        }

        return fallback.text();
      })
      .then((markdown) => {
        if (!active) {
          return;
        }

        setContent(stripFrontmatter(markdown));
        setToc(parseMarkdownToc(markdown));
        setLoadedRequestKey(requestKey);
        setContentError(false);
        setReadingProgress(0);
        setActiveSectionId('');
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setLoadedRequestKey(requestKey);
        setContentError(true);
      });

    return () => {
      active = false;
    };
  }, [lang, requestKey, slug]);

  const meta = slug && index ? index.articles.find((article) => article.slug === slug) ?? null : null;
  const category = meta && index ? findBlogCategory(index, meta.category) : undefined;
  const collection = meta?.collection && index ? findBlogCollection(index, meta.collection) : undefined;
  const collectionArticles = meta?.collection && index ? getCollectionArticles(index, meta.collection) : [];
  const isRepost = meta ? getBlogContentType(meta) === 'repost' : false;
  const sidebarToc = useMemo(() => toc.filter((item) => item.depth >= 2 && item.depth <= 3), [toc]);
  const contentLoading = Boolean(requestKey) && loadedRequestKey !== requestKey;

  useEffect(() => {
    if (contentLoading || toc.length === 0) {
      return;
    }

    const articleElement = articleRef.current;
    if (!articleElement) {
      return;
    }

    const headings = Array.from(articleElement.querySelectorAll<HTMLElement>('h1, h2, h3, h4'));
    headings.forEach((heading, index) => {
      const tocItem = toc[index];
      if (tocItem) {
        heading.id = tocItem.id;
      }
    });
  }, [contentLoading, content, toc]);

  useEffect(() => {
    if (contentLoading || typeof window === 'undefined') {
      return;
    }

    const articleElement = articleRef.current;
    if (!articleElement) {
      return;
    }

    const updateReadingState = () => {
      const rect = articleElement.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleBottom = articleTop + articleElement.offsetHeight;
      const focusY = Math.min(Math.max(getViewportFocusY(), articleTop + 1), articleBottom - 1);
      const nextProgress = computeArticleReadingProgress({
        scrollY: window.scrollY,
        articleTop,
        articleBottom,
        viewportHeight: window.innerHeight,
      });
      const headingElements = Array.from(articleElement.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
      let nextActiveSectionId = headingElements[0]?.id ?? '';

      for (const heading of headingElements) {
        const headingTop = window.scrollY + heading.getBoundingClientRect().top;
        if (headingTop <= focusY) {
          nextActiveSectionId = heading.id;
        } else {
          break;
        }
      }

      setReadingProgress((current) => (Math.abs(current - nextProgress) < 0.005 ? current : nextProgress));
      setActiveSectionId((current) => (current === nextActiveSectionId ? current : nextActiveSectionId));
    };

    let frameId = 0;
    const scheduleUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateReadingState();
      });
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [contentLoading, content, sidebarToc]);

  const loading = slug ? indexLoading || contentLoading : false;
  const notFound = !slug || contentError || indexError || (!indexLoading && !meta);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !meta) {
    return (
      <div className="py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            {t('blog.notFound')}
          </h2>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline font-medium"
          >
            <ArrowLeft size={16} />
            {t('blog.backToList')}
          </Link>
        </div>
      </div>
    );
  }

  const getTocItemClassName = (item: (typeof sidebarToc)[number]) =>
    [
      'blog-toc-item',
      item.depth === 3 ? 'blog-toc-item--child' : '',
      activeSectionId === item.id ? 'is-active' : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="pb-12 pt-1 md:pt-2">
      <Link
        to="/blog"
        className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)] md:mb-6"
      >
        <ArrowLeft size={16} />
        {t('blog.backToList')}
      </Link>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10">
        <div className="min-w-0">
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {isRepost && (
                <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {t('blog.repostBadge')}
                </span>
              )}
              {category && (
                <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {getLocalizedText(category.label, lang)}
                </span>
              )}
              {collection && (
                <Link
                  to={`/blog/collections/${collection.slug}`}
                  className="chip-muted px-3 py-1.5 text-xs font-medium rounded-full hover:text-[var(--color-accent)] transition-colors"
                >
                  {getLocalizedText(collection.name, lang)}
                </Link>
              )}
              {meta.seriesOrder && (
                <span className="chip-muted px-3 py-1.5 text-xs font-medium rounded-full">
                  {t('blog.partLabel', { order: meta.seriesOrder })}
                </span>
              )}
              {isRepost && meta.source?.url ? (
                <a
                  href={meta.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="chip-muted inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors hover:text-[var(--color-accent)]"
                >
                  {t('blog.sourceLink')}
                  <ExternalLink size={12} />
                </a>
              ) : null}
            </div>

            <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-[var(--color-text-primary)] md:text-4xl">
              {getLocalizedText(meta.title, lang)}
            </h1>

            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] max-w-3xl mb-6">
              {getLocalizedText(meta.summary, lang)}
            </p>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {meta.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {getLocalizedText(meta.readingTime, lang)}
              </span>
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="mb-8 grid gap-3 lg:hidden">
            <details className="surface-card-strong rounded-[1.5rem] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t('blog.readingProgress')}</span>
                <span className="mono-data rounded-full border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/10 px-2.5 py-1 text-[11px] text-[var(--color-accent)]">
                  {Math.round(readingProgress * 100)}%
                </span>
              </summary>
              <div className="mt-4">
                <div className="blog-progress-panel__bar">
                  <div
                    className="blog-progress-panel__bar-fill"
                    style={{ transform: `scaleX(${readingProgress})` }}
                  />
                </div>
              </div>
            </details>

            {sidebarToc.length > 0 && (
              <details className="surface-card-strong rounded-[1.5rem] p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t('blog.tableOfContents')}</span>
                  <ListTree size={16} className="text-[var(--color-accent)]" />
                </summary>
                <nav className="blog-toc-list mt-4" aria-label={t('blog.tableOfContents')}>
                  {sidebarToc.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        scrollToSection(item.id);
                      }}
                      className={getTocItemClassName(item)}
                    >
                      <span className="blog-toc-item__label">{item.text}</span>
                    </button>
                  ))}
                </nav>
              </details>
            )}

            {collection && (
              <details className="surface-card-strong rounded-[1.5rem] p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t('blog.currentCollection')}</span>
                  <Layers3 size={16} className="text-[var(--color-accent)]" />
                </summary>

                <div className="mt-4">
                  <Link
                    to={`/blog/collections/${collection.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {getLocalizedText(collection.name, lang)}
                    <ArrowLeft size={13} className="rotate-180" />
                  </Link>

                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {getLocalizedText(collection.description, lang)}
                  </p>

                  <div className="mt-4 space-y-2">
                    {collectionArticles.map((article) => {
                      const isCurrent = article.slug === meta.slug;

                      return (
                        <Link
                          key={article.slug}
                          to={`/blog/${article.slug}`}
                          className={`block rounded-2xl border px-3 py-3 transition-colors ${
                            isCurrent
                              ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10'
                              : 'border-gray-200/80 hover:border-[var(--color-accent)]/30 hover:bg-gray-50 dark:border-slate-800/80 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-[var(--color-text-secondary)] dark:bg-white/10">
                              {article.seriesOrder ?? '-'}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold leading-snug ${isCurrent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                                {getLocalizedText(article.title, lang)}
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                {getLocalizedText(article.readingTime, lang)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </details>
            )}
          </div>

          <article ref={articleRef} className="blog-article">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-10" aria-live="polite">
                  <div className="h-8 w-8 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
                </div>
              }
            >
              <BlogMarkdownRenderer content={content} slug={slug} />
            </Suspense>
          </article>

          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-slate-800">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              <ArrowLeft size={16} />
              {t('blog.backToList')}
            </Link>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <div className="blog-progress-panel rounded-[1.75rem] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="engineering-kicker mb-2">{t('blog.readingProgress')}</p>
                </div>
                <span className="blog-progress-panel__value mono-data">
                  {Math.round(readingProgress * 100)}%
                </span>
              </div>

              <div className="blog-progress-panel__bar">
                <div
                  className="blog-progress-panel__bar-fill"
                  style={{ transform: `scaleX(${readingProgress})` }}
                />
              </div>
            </div>

            <div className="surface-card-strong flex h-[clamp(14rem,calc((100vh-15rem)/2),24rem)] min-h-[14rem] flex-col rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <ListTree size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t('blog.tableOfContents')}</h2>
                </div>
              </div>

              {sidebarToc.length === 0 ? (
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {t('blog.noToc')}
                </p>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <nav className="blog-toc-list" aria-label={t('blog.tableOfContents')}>
                    {sidebarToc.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          scrollToSection(item.id);
                        }}
                        className={getTocItemClassName(item)}
                      >
                        <span className="blog-toc-item__label">{item.text}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              )}
            </div>

            {collection && (
              <div className="surface-card-strong flex h-[clamp(14rem,calc((100vh-15rem)/2),24rem)] min-h-[14rem] flex-col rounded-[1.75rem] p-5">
                <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <Layers3 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t('blog.currentCollection')}</h2>
                </div>
              </div>

                <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="mb-5">
                    <Link
                      to={`/blog/collections/${collection.slug}`}
                      className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)] mb-2 hover:text-[var(--color-accent)] transition-colors"
                    >
                      {getLocalizedText(collection.name, lang)}
                      <ArrowLeft size={14} className="rotate-180" />
                    </Link>
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {getLocalizedText(collection.description, lang)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {collectionArticles.map((article) => {
                      const isCurrent = article.slug === meta.slug;

                      return (
                        <Link
                          key={article.slug}
                          to={`/blog/${article.slug}`}
                          className={`block rounded-2xl border px-3 py-3 transition-colors ${
                            isCurrent
                              ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10'
                              : 'surface-card-subtle hover:border-[var(--color-accent)]/30'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-[var(--color-text-secondary)] dark:bg-white/10">
                              {article.seriesOrder ?? '-'}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold leading-snug ${isCurrent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                                {getLocalizedText(article.title, lang)}
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                {getLocalizedText(article.readingTime, lang)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
