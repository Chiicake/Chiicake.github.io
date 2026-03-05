import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { Briefcase } from 'lucide-react';

interface JobItem {
  role: string;
  company: string;
  period: string;
  description: string;
}

export default function Experience() {
  const { t, i18n } = useTranslation();

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown>;
  const expData = (bundle?.experience as Record<string, unknown>)?.jobs;
  const jobs: JobItem[] = Array.isArray(expData) ? expData : [];

  return (
    <div className="py-12">
      <SectionTitle title={t('experience.title')} />

      <div className="relative">
        <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/50 to-transparent" />

        <div className="space-y-12">
          {jobs.map((job, index) => {
            const isLeft = index % 2 === 0;
            return (
              <ScrollReveal key={index} direction={isLeft ? 'left' : 'right'} delay={index * 0.1}>
                <div className={`relative flex items-start gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="hidden md:block md:w-1/2" />

                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center z-10 ring-4 ring-[var(--color-bg)]">
                    <Briefcase size={14} className="text-white" />
                  </div>

                  <div className="ml-16 md:ml-0 md:w-1/2 bg-[var(--color-surface)] rounded-2xl p-6 border border-gray-100 dark:border-slate-800/50 shadow-sm">
                    <span className="text-xs font-medium text-[var(--color-accent)] uppercase tracking-wider">
                      {job.period}
                    </span>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                      {job.role}
                    </h3>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                      {job.company}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
