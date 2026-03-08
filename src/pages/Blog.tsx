import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ArrowRight, Layers3, PenLine } from 'lucide-react';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Card } from '../components/ui/Card';
import { StaggeredList } from '../components/animations/StaggeredList';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { useBlogIndex } from '../hooks/useBlogIndex';
import {
  findBlogCategory,
  getArticlesByCategory,
  getBlogLanguage,
  getCollectionArticles,
  getLocalizedText,
} from '../lib/blog';

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { index, loading, error } = useBlogIndex();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const lang = getBlogLanguage(i18n.language);

  if (loading) {
    return (
      <div className="py-12">
        <SectionTitle title={t('blog.title')} subtitle={t('blog.subtitle')} />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !index || index.articles.length === 0) {
    return (
      <div className="py-12">
        <SectionTitle title={t('blog.title')} subtitle={t('blog.subtitle')} />
        <ScrollReveal>
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
        </ScrollReveal>
      </div>
    );
  }

  const filteredArticles = getArticlesByCategory(index, selectedCategory);
  const activeCategory = selectedCategory === 'all' ? null : findBlogCategory(index, selectedCategory);
  const collectionGroups = index.collections
    .map((collection) => ({
      collection,
      articles: getCollectionArticles(index, collection.slug).filter(
        (article) => selectedCategory === 'all' || article.category === selectedCategory
      ),
    }))
    .filter((group) => group.articles.length > 0);
  const standaloneArticles = filteredArticles.filter((article) => !article.collection);

  return (
    <div className="py-12">
      <SectionTitle title={t('blog.title')} subtitle={t('blog.subtitle')} />

      <ScrollReveal className="mb-10">
        <div className="rounded-[2rem] border border-gray-200/80 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)] mb-3">
                {t('blog.categoryLabel')}
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--color-text-primary)] mb-2">
                {activeCategory ? getLocalizedText(activeCategory.label, lang) : t('blog.allCategories')}
              </h2>
              <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
                {activeCategory ? getLocalizedText(activeCategory.description, lang) : t('blog.filterHint')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
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
      </ScrollReveal>

      {collectionGroups.length > 0 && (
        <ScrollReveal className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
              <Layers3 size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{t('blog.collectionLabel')}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{t('blog.collectionSubtitle')}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {collectionGroups.map(({ collection, articles }) => (
              <button
                key={collection.slug}
                type="button"
                onClick={() =>
                  document.getElementById(`collection-${collection.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="group rounded-[1.75rem] border border-gray-200/80 bg-white/85 p-5 text-left shadow-[0_18px_60px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)]/35 dark:border-slate-800/80 dark:bg-slate-950/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3">
                      {t('blog.collectionLabel')}
                    </p>
                    <h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                      {getLocalizedText(collection.name, lang)}
                    </h4>
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                      {getLocalizedText(collection.description, lang)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-accent)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-accent)]">
                    {t('blog.articlesCount', { count: articles.length })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-12">
        {collectionGroups.map(({ collection, articles }) => (
          <section
            id={`collection-${collection.slug}`}
            key={collection.slug}
            className="scroll-mt-28"
          >
            <ScrollReveal className="mb-6">
              <div className="flex flex-col gap-4 rounded-[1.75rem] border border-gray-200/70 bg-white/75 p-5 dark:border-slate-800/70 dark:bg-slate-950/60 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3">
                    {t('blog.collectionLabel')}
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)] mb-2">
                    {getLocalizedText(collection.name, lang)}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]">
                    {getLocalizedText(collection.description, lang)}
                  </p>
                </div>

                <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {t('blog.articlesCount', { count: articles.length })}
                </div>
              </div>
            </ScrollReveal>

            <StaggeredList className="grid gap-6">
              {articles.map((article) => {
                const category = findBlogCategory(index, article.category);

                return (
                  <Link key={article.slug} to={`/blog/${article.slug}`} className="block group">
                    <Card hoverable className="transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {category && (
                              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                                {getLocalizedText(category.label, lang)}
                              </span>
                            )}
                            {article.seriesOrder && (
                              <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                                {t('blog.partLabel', { order: article.seriesOrder })}
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

                          <h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                            {getLocalizedText(article.title, lang)}
                          </h4>

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
            </StaggeredList>
          </section>
        ))}

        {standaloneArticles.length > 0 && (
          <section className="scroll-mt-28">
            <ScrollReveal className="mb-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3">
                    {t('blog.collectionLabel')}
                  </p>
                  <h3 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                    {t('blog.independentPosts')}
                  </h3>
                </div>
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {t('blog.articlesCount', { count: standaloneArticles.length })}
                </div>
              </div>
            </ScrollReveal>

            <StaggeredList className="grid gap-6">
              {standaloneArticles.map((article) => {
                const category = findBlogCategory(index, article.category);

                return (
                  <Link key={article.slug} to={`/blog/${article.slug}`} className="block group">
                    <Card hoverable className="transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
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

                          <h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                            {getLocalizedText(article.title, lang)}
                          </h4>

                          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                            {getLocalizedText(article.summary, lang)}
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors shrink-0 mt-8">
                          <ArrowRight size={18} />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </StaggeredList>
          </section>
        )}
      </div>
    </div>
  );
}
