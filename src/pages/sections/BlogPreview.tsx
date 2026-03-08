import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, ArrowRight, PenLine } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StaggeredList } from '../../components/animations/StaggeredList';
import { ScrollReveal } from '../../components/animations/ScrollReveal';
import { useBlogIndex } from '../../hooks/useBlogIndex';
import {
  findBlogCategory,
  findBlogCollection,
  getBlogLanguage,
  getLocalizedText,
} from '../../lib/blog';

export function BlogPreview({ id, maxArticles = 4 }: { id?: string; maxArticles?: number }) {
  const { t, i18n } = useTranslation();
  const { index, loading, error } = useBlogIndex();
  const lang = getBlogLanguage(i18n.language);
  const articles = index?.articles.slice(0, maxArticles) ?? [];

  if (loading) {
    return (
      <section id={id} className="scroll-mt-20 py-12">
        <SectionTitle title={t('blog.latestPosts')} />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (error || !index || articles.length === 0) {
    return (
      <section id={id} className="scroll-mt-20 py-12">
        <SectionTitle title={t('blog.latestPosts')} />
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
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-20 py-12">
      <SectionTitle title={t('blog.latestPosts')} subtitle={t('blog.filterHint')} />

      <StaggeredList className="grid gap-6 lg:grid-cols-2">
        {articles.map((article) => {
          const category = findBlogCategory(index, article.category);
          const collection = article.collection ? findBlogCollection(index, article.collection) : undefined;

          return (
            <Link key={article.slug} to={`/blog/${article.slug}`} className="block group">
              <Card hoverable className="min-h-full transition-colors">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {category && (
                      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {getLocalizedText(category.label, lang)}
                      </span>
                    )}
                    {collection && (
                      <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)]">
                        {getLocalizedText(collection.name, lang)}
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
                          className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)] rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors shrink-0">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </StaggeredList>

      <ScrollReveal>
        <div className="text-center mt-10">
          <Button to="/blog" variant="outline" size="lg" icon={<ArrowRight size={20} />}>
            {t('blog.viewAll')}
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
