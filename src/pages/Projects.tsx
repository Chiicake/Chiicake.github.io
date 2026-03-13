import { useTranslation } from 'react-i18next';
import { BookOpen, Cpu, Eye, GitFork, Github, HardDrive, Star, Waypoints } from 'lucide-react';
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

interface ProjectMetric {
  key: string;
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
  metrics: ProjectMetric[];
  stack: string[];
  sourceHref: string;
  flowLabel: string;
  flowHint: string;
  flowNodes: string[];
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
  const metrics = (Array.isArray(featuredProject.metrics) ? featuredProject.metrics : [])
    .filter(isRecord)
    .map((metric) => ({
      key: isString(metric.key) ? metric.key : '',
      label: isString(metric.label) ? metric.label : '',
      value: isString(metric.value) ? metric.value : '',
    }))
    .filter((metric) => metric.key && metric.label && metric.value);

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
    metrics,
    stack,
    sourceHref: t('projects.featuredProject.sourceHref'),
    flowLabel: t('projects.featuredProject.flowLabel'),
    flowHint: t('projects.featuredProject.flowHint'),
    flowNodes: (Array.isArray(featuredProject.flowNodes) ? featuredProject.flowNodes : []).filter(isString),
  };

  const moduleIcons = [Cpu, HardDrive, Waypoints];
  const metricIcons = {
    watch: Eye,
    fork: GitFork,
    star: Star,
  } as const;

  return (
    <section id={id} className="scroll-mt-20">
      <div className="pb-12 pt-2 md:pt-3">
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
                  {content.metrics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {content.metrics.map((metric) => {
                        const Icon = metricIcons[metric.key as keyof typeof metricIcons] ?? Eye;

                        return (
                          <div
                            key={metric.key}
                            className="engineering-subpanel inline-flex items-center gap-2.5 rounded-full px-3.5 py-2"
                          >
                            <Icon size={14} className="text-[var(--color-accent)]" />
                            <span className="mono-data text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                              {metric.label}
                            </span>
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{metric.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] md:text-[15px]">
                    {content.tagline}
                  </p>
                </div>

                <div className="engineering-subpanel rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="project-session-badge mono-data">/dev/pts/0</span>
                    <span className="mono-data text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                      {content.terminalLabel}
                    </span>
                  </div>
                </div>
              </div>

              {content.flowNodes.length > 0 && (
                <div className="engineering-subpanel mb-4 rounded-[1.5rem] p-5">
                  <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="engineering-kicker">{content.flowLabel}</p>
                    <p className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                      {content.flowHint}
                    </p>
                  </div>

                  <div className="project-flow-track">
                    <div className="project-flow-grid">
                      {content.flowNodes.map((node, index) => (
                        <div
                          key={node}
                          className="project-flow-node"
                          style={{ ['--node-index' as string]: String(index) }}
                        >
                          <span className="project-flow-node__index mono-data">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="project-flow-node__label">{node}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
