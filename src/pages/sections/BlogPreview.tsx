import { useTranslation } from 'react-i18next';
import { ArrowRight, PenLine } from 'lucide-react';
import { SectionTitle } from '../../components/ui/SectionTitle';
import { Button } from '../../components/ui/Button';
import { StaggeredList } from '../../components/animations/StaggeredList';
import { ScrollReveal } from '../../components/animations/ScrollReveal';
import { BlogEntryCard } from '../../components/blog/BlogEntryCard';
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
            <BlogEntryCard
              key={article.slug}
              article={article}
              lang={lang}
              categoryLabel={category ? getLocalizedText(category.label, lang) : undefined}
              collectionLabel={collection ? getLocalizedText(collection.name, lang) : undefined}
            />
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
