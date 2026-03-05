import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Card } from '../components/ui/Card';
import { StaggeredList } from '../components/animations/StaggeredList';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { Calendar, Clock, ArrowRight, PenLine } from 'lucide-react';

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

export default function Blog() {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState<BlogArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}blog/index.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch blog index');
        return res.json() as Promise<BlogIndex>;
      })
      .then((data) => {
        setArticles(data.articles);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const lang = i18n.language === 'zh' ? 'zh' : 'en';

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

  if (error || articles.length === 0) {
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

  return (
    <div className="py-12">
      <SectionTitle title={t('blog.title')} subtitle={t('blog.subtitle')} />

      <StaggeredList className="grid gap-6">
        {articles.map((article) => (
          <Link key={article.slug} to={`/blog/${article.slug}`} className="block group">
            <Card hoverable className="transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)] mb-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} />
                      {article.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} />
                      {article.readingTime[lang] ?? article.readingTime['en']}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                    {article.title[lang] ?? article.title['en']}
                  </h3>

                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    {article.summary[lang] ?? article.summary['en']}
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
        ))}
      </StaggeredList>
    </div>
  );
}
