import { useTranslation } from 'react-i18next';
import { BookOpen, Cpu, Github, HardDrive, Waypoints } from 'lucide-react';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/animations/ScrollReveal';

interface ProjectModule {
  name: string;
  description: string;
}

interface ProjectDiagnostic {
  label: string;
  value: string;
}

interface FeaturedProjectContent {
  eyebrow: string;
  title: string;
  terminalLabel: string;
  status: string;
  introLabel: string;
  focusLabel: string;
  modulesLabel: string;
  diagnosticsLabel: string;
  stackLabel: string;
  sourceCta: string;
  articleCta: string;
  path: string;
  tagline: string;
  summary: string;
  highlights: string[];
  modules: ProjectModule[];
  diagnostics: ProjectDiagnostic[];
  stack: string[];
  sourceHref: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export default function Projects({ id }: { id?: string }) {
  const { t, i18n } = useTranslation();
  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const projectsBundle = isRecord(bundle?.projects) ? bundle.projects : {};
  const featuredProject = isRecord(projectsBundle.featuredProject) ? projectsBundle.featuredProject : {};

  const highlights = Array.isArray(featuredProject.highlights) ? featuredProject.highlights.filter(isString) : [];
  const stack = Array.isArray(featuredProject.stack) ? featuredProject.stack.filter(isString) : [];

  const modules = (Array.isArray(featuredProject.modules) ? featuredProject.modules : [])
    .filter(isRecord)
    .map((module) => ({
      name: isString(module.name) ? module.name : '',
      description: isString(module.description) ? module.description : '',
    }))
    .filter((module) => module.name && module.description);

  const diagnostics = (Array.isArray(featuredProject.diagnostics) ? featuredProject.diagnostics : [])
    .filter(isRecord)
    .map((diagnostic) => ({
      label: isString(diagnostic.label) ? diagnostic.label : '',
      value: isString(diagnostic.value) ? diagnostic.value : '',
    }))
    .filter((diagnostic) => diagnostic.label && diagnostic.value);

  const content: FeaturedProjectContent = {
    eyebrow: t('projects.featuredProject.eyebrow'),
    title: t('projects.featuredProject.title'),
    terminalLabel: t('projects.featuredProject.terminalLabel'),
    status: t('projects.featuredProject.status'),
    introLabel: t('projects.featuredProject.introLabel'),
    focusLabel: t('projects.featuredProject.focusLabel'),
    modulesLabel: t('projects.featuredProject.modulesLabel'),
    diagnosticsLabel: t('projects.featuredProject.diagnosticsLabel'),
    stackLabel: t('projects.featuredProject.stackLabel'),
    sourceCta: t('projects.featuredProject.sourceCta'),
    articleCta: t('projects.featuredProject.articleCta'),
    path: t('projects.featuredProject.path'),
    tagline: t('projects.featuredProject.tagline'),
    summary: t('projects.featuredProject.summary'),
    highlights,
    modules,
    diagnostics,
    stack,
    sourceHref: t('projects.featuredProject.sourceHref'),
  };

  const moduleIcons = [Cpu, HardDrive, Waypoints];

  return (
    <section id={id} className="scroll-mt-20">
      <div className="py-12">
        <SectionTitle title={t('projects.title')} />

        <ScrollReveal>
          <div className="engineering-panel rounded-[2rem] p-5 md:p-7">
            <div className="relative">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <p className="engineering-kicker mb-3">{content.eyebrow}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)] md:text-3xl">
                      {content.title}
                    </h3>
                    <span className="mono-data inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {content.status}
                    </span>
                  </div>
                  <p className="mono-data mt-3 text-xs text-[var(--color-text-secondary)]">{content.path}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] md:text-[15px]">
                    {content.tagline}
                  </p>
                </div>

                <div className="engineering-subpanel rounded-full px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="mono-data text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                      {content.terminalLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="space-y-4">
                  <div className="engineering-subpanel rounded-[1.5rem] p-5">
                    <p className="engineering-kicker mb-3">{content.introLabel}</p>
                    <p className="text-sm leading-7 text-[var(--color-text-secondary)] md:text-[15px]">
                      {content.summary}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="engineering-subpanel rounded-[1.5rem] p-5">
                      <p className="engineering-kicker mb-4">{content.focusLabel}</p>
                      <div className="space-y-3">
                        {content.highlights.map((highlight) => (
                          <div key={highlight} className="flex items-start gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{highlight}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="engineering-subpanel rounded-[1.5rem] p-5">
                      <p className="engineering-kicker mb-4">{content.modulesLabel}</p>
                      <div className="space-y-3">
                        {content.modules.map((module, index) => {
                          const Icon = moduleIcons[index % moduleIcons.length];

                          return (
                            <div
                              key={module.name}
                              className="rounded-2xl border border-gray-200/80 bg-white/70 p-3 dark:border-slate-800/70 dark:bg-slate-900/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                                  <Icon size={16} />
                                </div>
                                <div>
                                  <p className="mono-data text-sm font-semibold text-[var(--color-text-primary)]">
                                    {module.name}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                                    {module.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="engineering-subpanel rounded-[1.5rem] p-5">
                    <p className="engineering-kicker mb-4">{content.diagnosticsLabel}</p>
                    <div className="space-y-3">
                      {content.diagnostics.map((diagnostic) => (
                        <div
                          key={diagnostic.label}
                          className="rounded-2xl border border-gray-200/80 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/50"
                        >
                          <p className="mono-data text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                            {diagnostic.label}
                          </p>
                          <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-text-primary)]">
                            {diagnostic.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="engineering-subpanel rounded-[1.5rem] p-5">
                    <p className="engineering-kicker mb-4">{content.stackLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {content.stack.map((tech) => (
                        <span
                          key={tech}
                          className="mono-data rounded-full border border-gray-200/80 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)] dark:border-slate-800/70 dark:bg-slate-900/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      href={content.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="md"
                      icon={<Github size={18} />}
                    >
                      {content.sourceCta}
                    </Button>
                    <Button
                      to="/blog"
                      variant="secondary"
                      size="md"
                      icon={<BookOpen size={18} />}
                    >
                      {content.articleCta}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
