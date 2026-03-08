import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useBlogIndex } from '../hooks/useBlogIndex';
import {
  findBlogCategory,
  findBlogCollection,
  getBlogLanguage,
  getCollectionArticles,
  getLocalizedText,
} from '../lib/blog';

export default function BlogCollection() {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const { t, i18n } = useTranslation();
  const { index, loading, error } = useBlogIndex();
  const lang = getBlogLanguage(i18n.language);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !index || !collectionSlug) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">{t('blog.collectionNotFound')}</h2>
        <Link to="/blog" className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline">
          <ArrowLeft size={16} />
          {t('blog.backToList')}
        </Link>
      </div>
    );
  }

  const collection = findBlogCollection(index, collectionSlug);
  const articles = collection ? getCollectionArticles(index, collection.slug) : [];

  if (!collection || articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">{t('blog.collectionNotFound')}</h2>
        <Link to="/blog" className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline">
          <ArrowLeft size={16} />
          {t('blog.backToList')}
        </Link>
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

      <section className="rounded-[2rem] border border-gray-200/80 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70 md:p-7 mb-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)] mb-3">
              {t('blog.collectionLabel')}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text-primary)] mb-3">
              {getLocalizedText(collection.name, lang)}
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]">
              {getLocalizedText(collection.description, lang)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-5 py-4 text-sm text-[var(--color-accent)]">
            <div className="font-semibold">{t('blog.articlesCount', { count: articles.length })}</div>
            <div className="mt-1 opacity-80">{t('blog.collectionPageHint')}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        {articles.map((article) => {
          const category = findBlogCategory(index, article.category);

          return (
            <Link key={article.slug} to={`/blog/${article.slug}`} className="block group">
              <Card hoverable className="transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                        {t('blog.partLabel', { order: article.seriesOrder ?? 1 })}
                      </span>
                      {category && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                          {getLocalizedText(category.label, lang)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} />
                        {article.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} />
                        {getLocalizedText(article.readingTime, lang)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                      {getLocalizedText(article.title, lang)}
                    </h2>

                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                      {getLocalizedText(article.summary, lang)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)] rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors shrink-0 mt-8">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
