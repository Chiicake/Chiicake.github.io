import avatarImage from '../../avatar.png';
import { useTranslation } from 'react-i18next';
import { Github, GraduationCap, MapPin } from 'lucide-react';
import { AboutSnakePanel } from '../components/about/AboutSnakePanel';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ScrollReveal } from '../components/animations/ScrollReveal';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export default function About({ id }: { id?: string }) {
  const { t, i18n } = useTranslation();

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const aboutBundle = isRecord(bundle?.about) ? bundle.about : {};
  const profileMeta = Array.isArray(aboutBundle.profileMeta) ? aboutBundle.profileMeta.filter(isString) : [];

  const metaIcons = [Github, MapPin, GraduationCap];

  return (
    <section id={id} className="scroll-mt-20">
      <div className="py-12">
        <SectionTitle title={t('about.title')} />

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <ScrollReveal direction="right">
            <div className="engineering-panel overflow-hidden rounded-[2rem] p-5 md:p-6">
              <div className="relative">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/50">
                  <img
                    src={avatarImage}
                    alt="Chiicake avatar"
                    className="aspect-[4/5] w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <p className="engineering-kicker mt-5">{t('about.profileEyebrow')}</p>

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
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.18} direction="left">
            <AboutSnakePanel />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
