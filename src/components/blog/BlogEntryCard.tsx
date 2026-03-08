import { Link } from 'react-router';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { getLocalizedText, type BlogArticleMeta, type BlogLanguage } from '../../lib/blog';

interface BlogEntryCardProps {
  article: BlogArticleMeta;
  lang: BlogLanguage;
  categoryLabel?: string;
  collectionLabel?: string;
}

export function BlogEntryCard({ article, lang, categoryLabel, collectionLabel }: BlogEntryCardProps) {
  return (
    <Link to={`/blog/${article.slug}`} className="block group">
      <Card hoverable className="blog-log-card min-h-full transition-colors">
        <div className="flex h-full flex-col gap-4">
          <div className="blog-log-card__terminal">
            <div className="min-w-0 flex items-center gap-2">
              <span className="blog-log-card__signal" />
              <span className="mono-data truncate text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                entry://{article.slug}
              </span>
            </div>
            <span className="mono-data rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
              {collectionLabel ? 'series' : 'entry'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel && (
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                {categoryLabel}
              </span>
            )}
            {collectionLabel && (
              <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                {collectionLabel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              {article.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {getLocalizedText(article.readingTime, lang)}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
            {getLocalizedText(article.title, lang)}
          </h3>

          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {getLocalizedText(article.summary, lang)}
          </p>

          <div className="mt-auto flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="blog-log-card__tag px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)] rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="blog-log-card__arrow flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-colors shrink-0">
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
