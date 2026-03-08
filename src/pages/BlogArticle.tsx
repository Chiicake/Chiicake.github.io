import {
  Children,
  createElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ArrowLeft, Calendar, Clock, Layers3, ListTree } from 'lucide-react';
import { useBlogIndex } from '../hooks/useBlogIndex';
import {
  findBlogCategory,
  findBlogCollection,
  getBlogLanguage,
  getCollectionArticles,
  getHeadingAnchorId,
  getLocalizedText,
  parseMarkdownToc,
  stripFrontmatter,
} from '../lib/blog';

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function flattenHeadingChildren(children: ReactNode): string {
  let text = '';

  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += String(child);
      return;
    }

    if (isValidElement<{ children?: ReactNode }>(child)) {
      text += flattenHeadingChildren(child.props.children);
    }
  });

  return text.trim();
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const lang = getBlogLanguage(i18n.language);
  const { index, loading: indexLoading, error: indexError } = useBlogIndex();
  const requestKey = slug ? `${slug}:${lang}` : '';

  const [content, setContent] = useState('');
  const [toc, setToc] = useState<ReturnType<typeof parseMarkdownToc>>([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState('');
  const [contentError, setContentError] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('');

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
  const sidebarToc = useMemo(() => toc.filter((item) => item.depth >= 2 && item.depth <= 3), [toc]);
  const contentLoading = Boolean(requestKey) && loadedRequestKey !== requestKey;

  useEffect(() => {
    if (contentLoading || sidebarToc.length === 0) {
      return;
    }

    const headings = sidebarToc
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (headings.length === 0) {
      return;
    }

    const syncActiveSection = () => {
      let currentId = headings[0].id;

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 180) {
          currentId = heading.id;
        } else {
          break;
        }
      }

      setActiveSectionId(currentId);
    };

    const observer = new IntersectionObserver(syncActiveSection, {
      rootMargin: '-120px 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 1],
    });

    headings.forEach((heading) => observer.observe(heading));
    window.addEventListener('scroll', syncActiveSection, { passive: true });
    syncActiveSection();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', syncActiveSection);
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

  const renderHeading = (
    tagName: 'h1' | 'h2' | 'h3' | 'h4',
    props: ComponentPropsWithoutRef<'h2'> & { node?: unknown }
  ) => {
    const { children, node, ...restProps } = props;
    void node;
    const headingId = getHeadingAnchorId(flattenHeadingChildren(children));

    return createElement(
      tagName,
      {
        ...restProps,
        id: headingId,
      },
      children
    );
  };

  const markdownComponents: Components = {
    h1: (props) => renderHeading('h1', props),
    h2: (props) => renderHeading('h2', props),
    h3: (props) => renderHeading('h3', props),
    h4: (props) => renderHeading('h4', props),
  };

  return (
    <div className="py-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        {t('blog.backToList')}
      </Link>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10">
        <div className="min-w-0">
          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {category && (
                <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {getLocalizedText(category.label, lang)}
                </span>
              )}
              {collection && (
                <Link
                  to={`/blog/collections/${collection.slug}`}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {getLocalizedText(collection.name, lang)}
                </Link>
              )}
              {meta.seriesOrder && (
                <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                  {t('blog.partLabel', { order: meta.seriesOrder })}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--color-text-primary)] leading-tight mb-4">
              {getLocalizedText(meta.title, lang)}
            </h1>

            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] max-w-3xl mb-6">
              {getLocalizedText(meta.summary, lang)}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-4">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {meta.date}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {getLocalizedText(meta.readingTime, lang)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
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

          <article className="blog-article">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
              urlTransform={(url: string) => {
                if (url.startsWith('./') || (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#'))) {
                  return `${import.meta.env.BASE_URL}blog/${slug}/${url.replace(/^\.\//, '')}`;
                }
                return url;
              }}
            >
              {content}
            </ReactMarkdown>
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

        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-[1.75rem] border border-gray-200/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75">
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
                <nav className="space-y-1">
                  {sidebarToc.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`flex w-full items-start rounded-2xl px-3 py-2 text-left text-sm transition-colors ${
                        activeSectionId === item.id
                          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text-primary)] dark:hover:bg-slate-800'
                      } ${item.depth === 3 ? 'pl-6' : ''}`}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              )}
            </div>

            {collection && (
              <div className="rounded-[1.75rem] border border-gray-200/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75">
                <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <Layers3 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t('blog.currentCollection')}</h2>
                </div>
              </div>

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
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
