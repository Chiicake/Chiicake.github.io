import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Cpu, Database, Gauge, Workflow } from 'lucide-react';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Card } from '../components/ui/Card';
import { StaggeredList } from '../components/animations/StaggeredList';
import { useBlogIndex } from '../hooks/useBlogIndex';
import { getBlogLanguage, getLocalizedText } from '../lib/blog';

interface SkillMatrixItem {
  code: string;
  title: string;
  summary: string;
  focus: string[];
  scenarios: string[];
  tooling: string[];
  relatedArticles: string[];
}

interface SkillsMatrixProps {
  className?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function SkillsMatrix({ className }: SkillsMatrixProps) {
  const { t, i18n } = useTranslation();
  const { index: blogIndex, loading: blogLoading } = useBlogIndex();
  const lang = getBlogLanguage(i18n.language);

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const skillsBundle = isRecord(bundle?.skills) ? bundle.skills : {};
  const matrixRaw = Array.isArray(skillsBundle.matrices) ? skillsBundle.matrices : [];

  const matrices: SkillMatrixItem[] = matrixRaw
    .filter(isRecord)
    .map((entry) => ({
      code: isString(entry.code) ? entry.code : '',
      title: isString(entry.title) ? entry.title : '',
      summary: isString(entry.summary) ? entry.summary : '',
      focus: Array.isArray(entry.focus) ? entry.focus.filter(isString) : [],
      scenarios: Array.isArray(entry.scenarios) ? entry.scenarios.filter(isString) : [],
      tooling: Array.isArray(entry.tooling) ? entry.tooling.filter(isString) : [],
      relatedArticles: Array.isArray(entry.relatedArticles) ? entry.relatedArticles.filter(isString) : [],
    }))
    .filter((entry) => entry.code && entry.title && entry.summary);

  const icons = [Cpu, Workflow, Gauge, Database];

  return (
    <StaggeredList className={className ?? 'grid grid-cols-1 gap-6 xl:grid-cols-2'}>
      {matrices.map((matrix, index) => {
        const Icon = icons[index % icons.length];
        const relatedArticles = matrix.relatedArticles
          .map((slug) => blogIndex?.articles.find((article) => article.slug === slug))
          .filter((article): article is NonNullable<typeof article> => Boolean(article));

        return (
          <Card
            key={matrix.code}
            hoverable
            className="engineering-panel border-gray-200/80 bg-transparent shadow-[0_22px_70px_rgba(15,23,42,0.05)] dark:border-slate-800/70"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="engineering-kicker mb-3">{matrix.code}</p>
                <h3 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {matrix.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                  {matrix.summary}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                <Icon size={20} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="engineering-subpanel rounded-[1.5rem] p-5">
                <p className="engineering-kicker mb-4">{t('skills.focusLabel')}</p>
                <div className="space-y-3">
                  {matrix.focus.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="engineering-subpanel rounded-[1.5rem] p-5">
                <p className="engineering-kicker mb-4">{t('skills.scenarioLabel')}</p>
                <div className="space-y-3">
                  {matrix.scenarios.map((scenario) => (
                    <div key={scenario} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{scenario}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="engineering-subpanel rounded-[1.5rem] p-5">
                <p className="engineering-kicker mb-4">{t('skills.toolingLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {matrix.tooling.map((tool) => (
                    <span
                      key={tool}
                      className="mono-data rounded-full border border-gray-200/80 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)] dark:border-slate-800/70 dark:bg-slate-900/50"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div className="engineering-subpanel rounded-[1.5rem] p-5">
                <p className="engineering-kicker mb-4">{t('skills.relatedBlogsLabel')}</p>
                {blogLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-6 w-6 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                  </div>
                ) : relatedArticles.length > 0 ? (
                  <div className="space-y-3">
                    {relatedArticles.map((article) => (
                      <Link
                        key={article.slug}
                        to={`/blog/${article.slug}`}
                        className="group flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white/75 px-4 py-3 transition-colors hover:border-[var(--color-accent)]/35 dark:border-slate-800/70 dark:bg-slate-900/50"
                      >
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-6 text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                            {getLocalizedText(article.title, lang)}
                          </p>
                          <p className="mono-data mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                            {article.date}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200/80 px-4 py-5 text-sm leading-6 text-[var(--color-text-secondary)] dark:border-slate-800/70">
                    {t('skills.relatedBlogsEmpty')}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </StaggeredList>
  );
}

export default function Skills({ id }: { id?: string }) {
  const { t } = useTranslation();

  return (
    <section id={id} className="scroll-mt-20">
      <div className="py-12">
        <SectionTitle title={t('skills.title')} />
        <SkillsMatrix className="mt-12 grid grid-cols-1 gap-6 xl:grid-cols-2" />
      </div>
    </section>
  );
}
