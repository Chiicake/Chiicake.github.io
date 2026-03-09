import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { TypewriterText } from '../components/ui/TypewriterText';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { HomeRollingUpdatesPanel } from '../components/home/HomeRollingUpdatesPanel';
import { preloadBlogPageAssets } from '../lib/blogPrefetch';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [bootVisible, setBootVisible] = useState(false);
  const [bootStep, setBootStep] = useState(0);

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

  const bundle = i18n.getResourceBundle(i18n.language, 'translation') as Record<string, unknown> | undefined;
  const heroBundle = isRecord(bundle?.hero) ? bundle.hero : {};
  const rolesRaw = Array.isArray(heroBundle.roles) ? heroBundle.roles.filter(isString) : [];
  const roles = rolesRaw.length > 0
    ? rolesRaw
    : ['Software Engineer', 'Rust / Go / Java Developer', 'Distributed Systems Builder'];
  const heroDescription = isString(heroBundle.description) ? heroBundle.description : '';

  const bootLines = (Array.isArray(heroBundle.bootSequence) ? heroBundle.bootSequence : [])
    .filter(isString)
    .slice(0, 5);

  useEffect(() => {
    if (shouldReduceMotion || bootLines.length === 0 || typeof window === 'undefined') {
      return undefined;
    }

    try {
      if (window.sessionStorage.getItem('home-boot-seen') === '1') {
        return undefined;
      }
    } catch {
      return undefined;
    }

    let currentStep = 0;
    let hideTimeoutId: number | undefined;
    let intervalId: number | undefined;

    const startTimeoutId = window.setTimeout(() => {
      setBootVisible(true);
      setBootStep(0);

      intervalId = window.setInterval(() => {
        currentStep += 1;
        setBootStep(currentStep);

        if (currentStep >= bootLines.length) {
          if (intervalId !== undefined) {
            window.clearInterval(intervalId);
          }

          hideTimeoutId = window.setTimeout(() => {
            setBootVisible(false);
            try {
              window.sessionStorage.setItem('home-boot-seen', '1');
            } catch {
              return;
            }
          }, 700);
        }
      }, 150);
    }, 0);

    return () => {
      window.clearTimeout(startTimeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      if (hideTimeoutId !== undefined) {
        window.clearTimeout(hideTimeoutId);
      }
    };
  }, [bootLines.length, shouldReduceMotion]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const terminalShortcuts = [
    {
      command: '$ open /blog',
      label: t('hero.ctaBlog'),
      href: '/blog',
    },
    {
      command: '$ jump #projects',
      label: t('hero.ctaPrimary'),
      onClick: () => scrollToSection('projects'),
    },
    {
      command: '$ xdg-open github.com/Chiicake',
      label: t('hero.ctaGithub'),
      href: 'https://github.com/Chiicake',
      external: true,
    },
    {
      command: '$ jump #contact',
      label: t('hero.ctaSecondary'),
      onClick: () => scrollToSection('contact'),
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col justify-center px-6 pb-20 pt-28 xl:pb-20 xl:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-accent)]/12 via-transparent to-transparent opacity-70"></div>
        <div className="absolute left-[6%] top-[22%] hidden h-16 w-16 rounded-full border border-[var(--color-accent)]/15 md:block" />
        <div className="absolute left-[8%] top-[34%] hidden h-px w-24 bg-gradient-to-r from-[var(--color-accent)]/45 to-transparent md:block" />

        <div className="absolute right-[-8%] top-[-5%] hidden h-[52vh] w-[48vw] min-w-[320px] max-w-[680px] md:block">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,147,209,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,147,209,0.16)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70 [mask-image:radial-gradient(circle_at_top_right,black_30%,transparent_82%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_68%)] blur-2xl"></div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl xl:grid xl:grid-cols-[minmax(0,1fr)_34rem] xl:items-stretch xl:gap-6">
        <div className="relative max-w-4xl xl:flex xl:min-h-[42rem] xl:flex-col xl:justify-center xl:pt-0">
          {bootVisible && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-none absolute right-0 top-1 z-20 hidden w-full max-w-md lg:block"
            >
              <div className="home-boot-sequence rounded-[1.5rem] p-4">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="engineering-kicker">{t('hero.bootLabel')}</span>
                  <span className="mono-data rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    {t('hero.bootStatus')}
                  </span>
                </div>

                <div className="space-y-2">
                  {bootLines.slice(0, bootStep).map((line, index) => (
                    <motion.div
                      key={line}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="home-boot-line"
                    >
                      <span className="home-boot-line__index mono-data">{String(index + 1).padStart(2, '0')}</span>
                      <span className="mono-data text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        {line}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <ScrollReveal delay={0.14}>
            <p className="mb-4 text-xl font-medium text-[var(--color-text-secondary)] md:text-2xl">
              {t('hero.greeting')}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.22}>
            <h1 className="mb-6 text-5xl font-black tracking-tight text-[var(--color-text-primary)] md:text-7xl lg:text-8xl">
              {t('hero.name')}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mb-8 h-[1.5em] text-2xl font-bold text-[var(--color-accent)] md:text-4xl">
              <TypewriterText texts={roles} />
            </div>
          </ScrollReveal>

          {heroDescription && (
            <ScrollReveal delay={0.38}>
              <p className="mb-8 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
                {heroDescription}
              </p>
            </ScrollReveal>
          )}
        </div>

        <div className="mt-auto xl:mt-auto xl:-translate-x-40 xl:flex xl:justify-self-start xl:self-stretch xl:py-3">
          <ScrollReveal delay={0.52}>
            <div className="h-full">
              <HomeRollingUpdatesPanel shortcuts={terminalShortcuts} />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
