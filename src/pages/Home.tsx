import { useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, BookMarked, BookOpen, Calendar, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TypewriterText } from '../components/ui/TypewriterText';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { useBlogIndex } from '../hooks/useBlogIndex';
import {
  findBlogCategory,
  findBlogCollection,
  getBlogLanguage,
  getFeaturedArticles,
  getLocalizedText,
} from '../lib/blog';
import { preloadBlogPageAssets } from '../lib/blogPrefetch';

function RecommendedArticlesPanel({ maxArticles = 2 }: { maxArticles?: number }) {
  const { t, i18n } = useTranslation();
  const { index, loading } = useBlogIndex();
  const lang = getBlogLanguage(i18n.language);
  const featuredArticles = index ? getFeaturedArticles(index, maxArticles) : [];

  return (
    <ScrollReveal delay={0.45} className="h-full">
      <aside className="relative max-w-[22rem] overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70 md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_55%)]"></div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/60 to-transparent"></div>

        <div className="relative">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)] mb-3">
                {t('blog.recommendedEyebrow')}
              </p>
              <h2 className="text-[1.4rem] font-black tracking-tight text-[var(--color-text-primary)] mb-2">
                {t('blog.recommendedTitle')}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {t('blog.recommendedSubtitle')}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
              <BookMarked size={22} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : featuredArticles.length === 0 || !index ? (
            <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-[var(--color-text-secondary)] dark:border-slate-800">
              {t('blog.recommendedEmpty')}
            </p>
          ) : (
            <div className="space-y-3">
              {featuredArticles.map((article) => {
                const category = findBlogCategory(index, article.category);
                const collection = article.collection ? findBlogCollection(index, article.collection) : undefined;

                return (
                  <Link
                    key={article.slug}
                    to={`/blog/${article.slug}`}
                    className="group block rounded-[1.5rem] border border-gray-200/80 bg-white/80 p-3.5 transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--color-accent)]/40 dark:border-slate-800/80 dark:bg-slate-900/70"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {category && (
                        <span className="rounded-full bg-[var(--color-accent)]/12 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
                          {getLocalizedText(category.label, lang)}
                        </span>
                      )}
                      {collection && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] dark:bg-slate-800">
                          {getLocalizedText(collection.name, lang)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-bold leading-snug text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                          {getLocalizedText(article.title, lang)}
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                          {getLocalizedText(article.summary, lang)}
                        </p>
                      </div>

                      <ArrowRight
                        size={18}
                        className="mt-1 shrink-0 text-[var(--color-accent)] transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} />
                        {article.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} />
                        {getLocalizedText(article.readingTime, lang)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-200/80 dark:border-slate-800/80">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              {t('blog.viewAll')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </aside>
    </ScrollReveal>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const triggerPrefetch = () => {
      preloadBlogPageAssets();
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(triggerPrefetch, { timeout: 1200 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(triggerPrefetch, 300);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const rolesRaw = i18n.getResourceBundle(i18n.language, 'translation')?.hero?.roles || [
    'Software Engineer',
    'Frontend Developer',
    'Creative Thinker',
  ];

  const roles = Array.isArray(rolesRaw) ? rolesRaw : Object.values(rolesRaw);

  return (
    <div className="min-h-screen flex flex-col justify-center relative px-6 pt-28 pb-20 xl:justify-start xl:pt-36 xl:pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-accent)]/12 via-transparent to-transparent opacity-70"></div>

        <div className="hidden md:block absolute -top-24 right-[-10%] h-[52vh] w-[48vw] min-w-[320px] max-w-[680px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.14)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70 [mask-image:radial-gradient(circle_at_top_right,black_30%,transparent_82%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_68%)] blur-2xl"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-14 xl:items-start">
        <div className="max-w-4xl">
          <ScrollReveal delay={0.1}>
            <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] mb-4 font-medium">
              {t('hero.greeting')}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-[var(--color-text-primary)] mb-6">
              {t('hero.name')}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="text-2xl md:text-4xl font-bold text-[var(--color-accent)] mb-8 h-[1.5em]">
              <TypewriterText texts={roles as string[]} />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mb-12 max-w-2xl leading-relaxed">
              {t('hero.description')}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.5}>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                size="lg"
                icon={<BookOpen size={20} />}
              >
                {t('hero.ctaBlog')}
              </Button>
              <Button
                onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                icon={<ArrowRight size={20} />}
              >
                {t('hero.ctaPrimary')}
              </Button>
              <Button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                variant="secondary"
                size="lg"
              >
                {t('hero.ctaSecondary')}
              </Button>
            </div>
          </ScrollReveal>

          <div className="mt-12 xl:hidden">
            <RecommendedArticlesPanel maxArticles={3} />
          </div>
        </div>

        <div className="hidden xl:block pt-2">
          <RecommendedArticlesPanel maxArticles={2} />
        </div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--color-text-secondary)]"
        animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
        transition={shouldReduceMotion ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowDown size={24} className="opacity-50" />
      </motion.div>
    </div>
  );
}
