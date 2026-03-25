import { ArrowRight, Eye, GitFork, Github, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { getProjectsContent } from '../lib/projects';

export default function Projects({ id }: { id?: string }) {
  const { i18n } = useTranslation();
  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const content = getProjectsContent(bundle);
  const secondaryCardTones = ['tone-1', 'tone-2', 'tone-3', 'tone-4'] as const;

  const metricIcons = {
    watch: Eye,
    fork: GitFork,
    star: Star,
  } as const;
  const spotlightHighlights = content.featuredProjectDetail.highlights.slice(0, 2);

  return (
    <section id={id} className="scroll-mt-20">
      <div className="pb-12 pt-2 md:pt-3">
        <div className="space-y-6">
          <ScrollReveal>
            <div className="engineering-panel rounded-[1.7rem] p-4 sm:p-5 md:rounded-[2rem] md:p-7">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
                <div>
                  <p className="engineering-kicker mb-3">{content.featuredProject.eyebrow}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-2xl md:text-3xl">
                      {content.featuredProject.title}
                    </h1>
                    <span className="mono-data inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {content.featuredProject.status}
                    </span>
                  </div>

                  <p className="mono-data mt-3 text-xs text-[var(--color-text-secondary)]">
                    {content.featuredProject.path}
                  </p>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)] md:text-[15px] md:leading-7">
                    {content.featuredProject.tagline}
                  </p>
                  {content.featuredProject.summary ? (
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)] md:text-[15px]">
                      {content.featuredProject.summary}
                    </p>
                  ) : null}

                  {content.featuredProject.metrics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {content.featuredProject.metrics.map((metric) => {
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
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {metric.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      href={content.featuredProject.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="md"
                      icon={<Github size={18} />}
                    >
                      {content.featuredProject.repoCta}
                    </Button>
                    <Button
                      to="/projects/hybrid-kv"
                      variant="secondary"
                      size="md"
                      icon={<ArrowRight size={18} />}
                    >
                      {content.featuredProject.detailCta}
                    </Button>
                  </div>
                </div>

                <div className="flex h-full flex-col space-y-4">
                  {spotlightHighlights.length > 0 && (
                    <div className="engineering-subpanel rounded-[1.5rem] p-5">
                      <p className="engineering-kicker mb-4">{content.featuredProjectDetail.focusLabel}</p>
                      <div className="space-y-3">
                        {spotlightHighlights.map((highlight) => (
                          <div key={highlight} className="flex items-start gap-3">
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
                            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{highlight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {content.featuredProject.stack.length > 0 && (
                    <div className="engineering-subpanel rounded-[1.5rem] p-5">
                      <p className="engineering-kicker mb-4">{content.featuredProject.stackLabel}</p>
                      <div className="flex flex-wrap gap-2">
                        {content.featuredProject.stack.map((tech) => (
                          <span
                            key={tech}
                            className="mono-data rounded-full border border-gray-200/80 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)] dark:border-slate-800/70 dark:bg-slate-900/50"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="engineering-kicker">{content.secondaryLabel}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{content.secondaryHint}</p>
              </div>
              <Button
                href={content.githubHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="ghost"
                size="sm"
                icon={<Github size={16} />}
              >
                {content.allReposCta}
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.14}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {content.secondaryProjects.map((project, index) => (
                <article
                  key={project.title}
                  className={`engineering-panel project-mini-card ${secondaryCardTones[index % secondaryCardTones.length]} flex h-full flex-col rounded-[1.45rem] p-5 transition-transform duration-300 hover:-translate-y-1`}
                >
                  <div className="mb-4">
                    <p className="project-mini-card__path mono-data text-[11px] uppercase tracking-[0.2em]">
                      {project.path}
                    </p>
                    <h2 className="mt-3 text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                      {project.title}
                    </h2>
                  </div>

                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{project.summary}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <span
                        key={`${project.title}-${tech}`}
                        className="project-mini-chip mono-data rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-5">
                    <Button
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      size="sm"
                      icon={<Github size={16} />}
                      className="w-full"
                    >
                      {project.title}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
