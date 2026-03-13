import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { getBlogContentType, getLocalizedText, type BlogArticleMeta, type BlogLanguage } from '../../lib/blog';

interface BlogEntryCardProps {
  article: BlogArticleMeta;
  lang: BlogLanguage;
  categoryLabel?: string;
  collectionLabel?: string;
}

export function BlogEntryCard({ article, lang, categoryLabel, collectionLabel }: BlogEntryCardProps) {
  const { t } = useTranslation();
  const isRepost = getBlogContentType(article) === 'repost';
  const sourceSite = article.source?.site || article.source?.url?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const sourceParts = [sourceSite, article.source?.author].filter(Boolean);

  return (
    <Link to={`/blog/${article.slug}`} className="block group">
      <Card hoverable className="blog-log-card min-h-full transition-colors">
        <div className="flex h-full flex-col gap-3">
          <div className="blog-log-card__terminal flex-wrap gap-y-2">
            <div className="min-w-0 flex items-center gap-2">
              <span className="blog-log-card__signal" />
              <span className="mono-data truncate text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                entry://{article.slug}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-[var(--color-text-secondary)]">
              <span className="mono-data inline-flex items-center gap-1.5 uppercase tracking-[0.08em]">
                <Calendar size={12} />
              {article.date}
              </span>
              <span className="mono-data inline-flex items-center gap-1.5 uppercase tracking-[0.08em]">
                <Clock size={12} />
                {getLocalizedText(article.readingTime, lang)}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
            {getLocalizedText(article.title, lang)}
          </h3>

          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {getLocalizedText(article.summary, lang)}
          </p>

          <div className="mt-auto flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {isRepost && (
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  {t('blog.repostBadge')}
                </span>
              )}
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
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="blog-log-card__tag px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)] rounded-md"
                >
                  {tag}
                </span>
              ))}
              {isRepost && sourceParts.length > 0 ? (
                <span className="mono-data px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                  {t('blog.sourcePrefix')}
                  {sourceParts.join(' · ')}
                </span>
              ) : null}
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
