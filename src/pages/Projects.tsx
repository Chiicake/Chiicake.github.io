import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Card } from '../components/ui/Card';
import { StaggeredList } from '../components/animations/StaggeredList';
import { ExternalLink, Github } from 'lucide-react';

interface ProjectItem {
  title: string;
  description: string;
  tags: string[];
}

export default function Projects({ id }: { id?: string }) {
  const { t, i18n } = useTranslation();

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown>;
  const projectsData = (bundle?.projects as Record<string, unknown>)?.items;
  const projects: ProjectItem[] = Array.isArray(projectsData) ? projectsData : [];

  return (
    <section id={id} className="scroll-mt-20">
    <div className="py-12">
      <SectionTitle title={t('projects.title')} />

      <StaggeredList className="grid md:grid-cols-2 gap-8">
        {projects.map((project, index) => (
          <Card key={index} hoverable>
            <div className="w-full h-40 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 rounded-xl mb-4 flex items-center justify-center">
              <span className="text-4xl font-bold text-[var(--color-accent)]/30">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>

            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              {project.title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4 flex-grow">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-[var(--color-text-secondary)] rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-3 mt-auto pt-2 border-t border-gray-100 dark:border-slate-800/50">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline font-medium"
                aria-label={t('projects.source')}
              >
                <Github size={14} />
                {t('projects.source')}
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline font-medium"
                aria-label={t('projects.live')}
              >
                <ExternalLink size={14} />
                {t('projects.live')}
              </a>
            </div>
          </Card>
        ))}
      </StaggeredList>
    </div>
    </section>
  );
}
