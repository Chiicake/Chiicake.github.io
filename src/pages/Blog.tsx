import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FolderTree, Layers3, PenLine, ShieldCheck } from 'lucide-react';
import { BlogEntryCard } from '../components/blog/BlogEntryCard';
import { HomeLifePanel } from '../components/home/HomeLifePanel';
import { useBlogIndex } from '../hooks/useBlogIndex';
import {
  findBlogCategory,
  findBlogCollection,
  getArticlesByCategory,
  getBlogLanguage,
  getCollectionArticles,
  getLocalizedText,
} from '../lib/blog';

const BLOG_PAGE_SIZE = 20;

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { index, loading, error } = useBlogIndex();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const lang = getBlogLanguage(i18n.language);

  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !index || index.articles.length === 0) {
    return (
      <div className="py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-6">
            <PenLine size={36} className="text-[var(--color-accent)]" />
          </div>
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
            {t('common.comingSoon')}
          </h3>
          <p className="text-[var(--color-text-secondary)] max-w-md">
            {t('blog.stayTuned')}
          </p>
        </div>
      </div>
    );
  }

  const filteredArticles = getArticlesByCategory(index, selectedCategory);
  const collectionEntries = index.collections
    .map((collection) => ({
      collection,
      articles: getCollectionArticles(index, collection.slug).filter(
        (article) => selectedCategory === 'all' || article.category === selectedCategory
      ),
    }))
    .filter((entry) => entry.articles.length > 0);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / BLOG_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * BLOG_PAGE_SIZE;
  const paginatedArticles = filteredArticles.slice(pageStart, pageStart + BLOG_PAGE_SIZE);

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
    return page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1;
  });

  return (
    <div className="py-12">
      <section className="mb-7 rounded-[1.6rem] border border-gray-200/80 bg-white/82 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/68 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <ShieldCheck size={18} />
            </div>

            <div className="min-w-0">
              <p className="engineering-kicker">{t('blog.provenanceEyebrow')}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-primary)] md:text-[0.95rem]">
                {t('blog.provenanceTitle')}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)] md:text-sm">
                {t('blog.provenanceDescription')}
              </p>
            </div>
          </div>

          <span className="mono-data inline-flex shrink-0 items-center rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
            human-authored
          </span>
        </div>
      </section>

      <section className="mb-10 grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="flex h-[12.25rem] flex-col rounded-[1.6rem] border border-gray-200/80 bg-white/84 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/68 md:h-[13.5rem] md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                <FolderTree size={16} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{t('blog.categoryLabel')}</h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{t('blog.filterHint')}</p>
              </div>
            </div>
            <span className="mono-data shrink-0 rounded-full border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
              {index.categories.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'bg-gray-100 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:bg-slate-800'
                }`}
              >
                {t('blog.allCategories')}
                <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-current dark:bg-white/10">
                  {index.articles.length}
                </span>
              </button>

              {index.categories.map((category) => {
                const count = index.articles.filter((article) => article.category === category.id).length;
                const active = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)] text-white shadow-sm'
                        : 'bg-gray-100 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] dark:bg-slate-800'
                    }`}
                  >
                    {getLocalizedText(category.label, lang)}
                    <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[11px] text-current dark:bg-white/10">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex h-[12.25rem] flex-col rounded-[1.6rem] border border-gray-200/80 bg-white/84 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/68 md:h-[13.5rem] md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                <Layers3 size={16} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{t('blog.collectionLabel')}</h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{t('blog.collectionSubtitle')}</p>
              </div>
            </div>
            <span className="mono-data shrink-0 rounded-full border border-[var(--color-accent)]/15 bg-[var(--color-accent)]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
              {collectionEntries.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2.5">
            {collectionEntries.length > 0 ? (
              collectionEntries.map(({ collection, articles }) => (
                <Link
                  key={collection.slug}
                  to={`/blog/collections/${collection.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-[1.1rem] border border-gray-200/80 bg-white/75 px-3.5 py-2.5 transition-colors hover:border-[var(--color-accent)]/35 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                >
                  <h4 className="min-w-0 text-sm font-bold leading-snug text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                    {getLocalizedText(collection.name, lang)}
                  </h4>

                  <div className="shrink-0 rounded-2xl bg-[var(--color-accent)]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-accent)]">
                    {t('blog.articlesCount', { count: articles.length })}
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-gray-200/80 px-4 py-5 text-sm text-[var(--color-text-secondary)] dark:border-slate-800/80">
                {t('blog.collectionEmpty')}
              </div>
            )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-gray-200/80 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/65 md:p-7">
        {paginatedArticles.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-gray-200/80 px-5 py-10 text-center text-[var(--color-text-secondary)] dark:border-slate-800/80">
            {t('blog.emptyCategory')}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {paginatedArticles.map((article) => {
              const category = findBlogCategory(index, article.category);
              const collection = article.collection ? findBlogCollection(index, article.collection) : undefined;

              return (
                <BlogEntryCard
                  key={article.slug}
                  article={article}
                  lang={lang}
                  categoryLabel={category ? getLocalizedText(category.label, lang) : undefined}
                  collectionLabel={collection ? getLocalizedText(collection.name, lang) : undefined}
                />
              );
            })}
          </div>
        )}

        {filteredArticles.length > BLOG_PAGE_SIZE && (
          <div className="mt-10 flex flex-col gap-4 rounded-[1.5rem] border border-gray-200/80 bg-white/70 px-5 py-4 dark:border-slate-800/80 dark:bg-slate-900/45 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('blog.pageLabel', { page: safeCurrentPage, pages: totalPages })}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] disabled:opacity-40 dark:border-slate-800"
              >
                {t('blog.prevPage')}
              </button>

              {visiblePages.map((page, index) => {
                const previousPage = visiblePages[index - 1];
                const showEllipsis = previousPage && page - previousPage > 1;

                return (
                  <div key={page} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="px-1 text-sm text-[var(--color-text-secondary)]">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 rounded-xl px-3 py-2 text-sm font-medium ${
                        page === safeCurrentPage
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'border border-gray-200 text-[var(--color-text-secondary)] dark:border-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] disabled:opacity-40 dark:border-slate-800"
              >
                {t('blog.nextPage')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-col items-center gap-4 px-2 text-center">
        <div className="max-w-2xl">
          <p className="engineering-kicker">{t('blog.lifeEasterEggEyebrow')}</p>
        </div>

        <div className="w-full max-w-[31rem]">
          <HomeLifePanel compact delay={0.12} />
        </div>
      </section>
    </div>
  );
}
