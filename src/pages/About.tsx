import avatarImage from '../../avatar.png';
import { useTranslation } from 'react-i18next';
import { Briefcase, Cpu, Github, GraduationCap, MapPin } from 'lucide-react';
import { AboutSnakePanel } from '../components/about/AboutSnakePanel';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { SkillsRegistry } from './Skills';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

interface MachineInfoItem {
  label: string;
  value: string;
}

interface JobItem {
  role: string;
  company: string;
  period: string;
  description: string;
}

interface EducationItem {
  degree: string;
  school: string;
  period: string;
  description: string;
}

export default function About({ id }: { id?: string }) {
  const { t, i18n } = useTranslation();

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const aboutBundle = isRecord(bundle?.about) ? bundle.about : {};
  const experienceBundle = isRecord(bundle?.experience) ? bundle.experience : {};
  const educationBundle = isRecord(bundle?.education) ? bundle.education : {};
  const profileEyebrow = isString(aboutBundle.profileEyebrow) ? aboutBundle.profileEyebrow.trim() : '';
  const profileMeta = Array.isArray(aboutBundle.profileMeta) ? aboutBundle.profileMeta.filter(isString) : [];
  const machineInfoItems: MachineInfoItem[] = Array.isArray(aboutBundle.machineInfoItems)
    ? aboutBundle.machineInfoItems
        .filter(isRecord)
        .map((item) => ({
          label: isString(item.label) ? item.label : '',
          value: isString(item.value) ? item.value : '',
        }))
        .filter((item) => item.label && item.value)
    : [];
  const machineInfoHints = Array.isArray(aboutBundle.machineInfoHints)
    ? aboutBundle.machineInfoHints.filter(isString)
    : [];
  const jobs: JobItem[] = Array.isArray(experienceBundle.jobs)
    ? experienceBundle.jobs
        .filter(isRecord)
        .map((job) => ({
          role: isString(job.role) ? job.role : '',
          company: isString(job.company) ? job.company : '',
          period: isString(job.period) ? job.period : '',
          description: isString(job.description) ? job.description : '',
        }))
        .filter((job) => job.role && job.company)
    : [];
  const educationItems: EducationItem[] = Array.isArray(educationBundle.items)
    ? educationBundle.items
        .filter(isRecord)
        .map((item) => ({
          degree: isString(item.degree) ? item.degree : '',
          school: isString(item.school) ? item.school : '',
          period: isString(item.period) ? item.period : '',
          description: isString(item.description) ? item.description : '',
        }))
        .filter((item) => item.degree && item.school)
    : [];

  const metaIcons = [Github, MapPin, GraduationCap];

  return (
    <section id={id} className="scroll-mt-20">
      <div className="pb-12 pt-2 md:pt-3">
        <div className="mt-2 grid grid-cols-1 gap-10 md:mt-3 md:gap-12 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <ScrollReveal direction="right">
            <div className="engineering-panel overflow-hidden rounded-[2rem] p-5 md:p-6">
              <div className="relative">
                <div className="overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/50">
                  <img
                    src={avatarImage}
                    alt="Chiicake avatar"
                    className="aspect-[4/5] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {profileEyebrow && <p className="engineering-kicker mt-5">{profileEyebrow}</p>}

                {profileMeta.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {profileMeta.map((meta, index) => {
                      const Icon = metaIcons[index % metaIcons.length];

                      return (
                        <div
                          key={meta}
                          className="engineering-subpanel flex items-center gap-3 rounded-[1.25rem] px-4 py-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                            <Icon size={16} />
                          </div>
                          <span className="text-sm text-[var(--color-text-secondary)]">{meta}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {machineInfoItems.length > 0 && (
                  <div className="engineering-subpanel mt-5 overflow-hidden rounded-[1.35rem]">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 px-4 py-3">
                      <p className="engineering-kicker">{t('about.machineInfoTitle')}</p>
                      {machineInfoHints[0] && (
                        <span className="mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--color-accent)]">
                          {machineInfoHints[0]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 px-4 py-3">
                      {machineInfoItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700/35 bg-slate-950/35 px-3 py-2"
                        >
                          <span className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                            {item.label}
                          </span>
                          <span className="mono-data text-sm font-medium text-[var(--color-text-primary)]">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.18} direction="left">
            <AboutSnakePanel />
          </ScrollReveal>
        </div>

        <div className="mt-10 md:mt-14">
          <ScrollReveal direction="up">
            <section className="engineering-panel rounded-[1.75rem] p-4 sm:p-5 md:rounded-[2rem] md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <Cpu size={18} />
                </div>
                <div>
                  <p className="engineering-kicker">{t('about.title')}</p>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{t('skills.title')}</h3>
                </div>
              </div>

              <SkillsRegistry className="mt-6" />
            </section>
          </ScrollReveal>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:mt-14 md:gap-8 xl:grid-cols-2">
          <ScrollReveal direction="up">
            <section className="engineering-panel rounded-[1.75rem] p-4 sm:p-5 md:rounded-[2rem] md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <Briefcase size={18} />
                </div>
                <div>
                  <p className="engineering-kicker">{t('about.title')}</p>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{t('experience.title')}</h3>
                </div>
              </div>

              <div className="relative mt-5 md:mt-6">
                <div className="absolute bottom-2 left-[1.05rem] top-2 w-px bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/50 to-transparent" />

                <div className="space-y-4 md:space-y-5">
                  {jobs.map((job) => (
                    <div key={`${job.company}-${job.period}`} className="relative pl-9 sm:pl-11">
                      <div className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-bg)] sm:h-8 sm:w-8">
                        <Briefcase size={13} />
                      </div>

                      <div className="engineering-subpanel rounded-[1.25rem] px-3.5 py-3.5 sm:rounded-[1.5rem] sm:px-4 sm:py-4 md:px-5">
                        <span className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-accent)]">
                          {job.period}
                        </span>
                        <h4 className="mt-2 text-base font-bold text-[var(--color-text-primary)] sm:text-lg">{job.role}</h4>
                        <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{job.company}</p>
                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] md:leading-7">{job.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={0.1} direction="up">
            <section className="engineering-panel rounded-[1.75rem] p-4 sm:p-5 md:rounded-[2rem] md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="engineering-kicker">{t('about.title')}</p>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{t('education.title')}</h3>
                </div>
              </div>

              <div className="relative mt-5 md:mt-6">
                <div className="absolute bottom-2 left-[1.05rem] top-2 w-px bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent)]/50 to-transparent" />

                <div className="space-y-4 md:space-y-5">
                  {educationItems.map((item) => (
                    <div key={`${item.school}-${item.period}`} className="relative pl-9 sm:pl-11">
                      <div className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-bg)] sm:h-8 sm:w-8">
                        <GraduationCap size={13} />
                      </div>

                      <div className="engineering-subpanel rounded-[1.25rem] px-3.5 py-3.5 sm:rounded-[1.5rem] sm:px-4 sm:py-4 md:px-5">
                        <span className="mono-data text-[11px] uppercase tracking-[0.16em] text-[var(--color-accent)]">
                          {item.period}
                        </span>
                        <h4 className="mt-2 text-base font-bold text-[var(--color-text-primary)] sm:text-lg">{item.degree}</h4>
                        <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{item.school}</p>
                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] md:leading-7">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
