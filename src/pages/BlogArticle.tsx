import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

interface BlogArticleMeta {
  slug: string;
  date: string;
  tags: string[];
  title: Record<string, string>;
  summary: Record<string, string>;
  readingTime: Record<string, string>;
}

interface BlogIndex {
  articles: BlogArticleMeta[];
}

/** Strip YAML frontmatter from markdown content */
function stripFrontmatter(md: string): string {
  const trimmed = md.trimStart();
  if (trimmed.startsWith('---')) {
    const end = trimmed.indexOf('---', 3);
    if (end !== -1) {
      return trimmed.slice(end + 3).trimStart();
    }
  }
  return md;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'zh' ? 'zh' : 'en';

  const [meta, setMeta] = useState<BlogArticleMeta | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const base = import.meta.env.BASE_URL;

    Promise.all([
      fetch(`${base}blog/index.json`).then((r) => {
        if (!r.ok) throw new Error('index');
        return r.json() as Promise<BlogIndex>;
      }),
      fetch(`${base}blog/${slug}/index.${lang}.md`).then((r) => {
        if (!r.ok) {
          return fetch(`${base}blog/${slug}/index.en.md`).then((r2) => {
            if (!r2.ok) throw new Error('md');
            return r2.text();
          });
        }
        return r.text();
      }),
    ])
      .then(([indexData, mdContent]) => {
        const found = indexData.articles.find((a) => a.slug === slug);
        if (!found) {
          setNotFound(true);
        } else {
          setMeta(found);
          setContent(stripFrontmatter(mdContent));
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug, lang]);

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

  return (
    <div className="py-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        {t('blog.backToList')}
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] leading-tight mb-4">
          {meta.title[lang] ?? meta.title['en']}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {meta.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {meta.readingTime[lang] ?? meta.readingTime['en']}
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
  );
}
