import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TypewriterText } from '../components/ui/TypewriterText';
import { ScrollReveal } from '../components/animations/ScrollReveal';

export default function Home() {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const rolesRaw = i18n.getResourceBundle(i18n.language, 'translation')?.hero?.roles || [
    "Software Engineer",
    "Frontend Developer",
    "Creative Thinker"
  ];
  
  const roles = Array.isArray(rolesRaw) ? rolesRaw : Object.values(rolesRaw);

  return (
    <div className="min-h-screen flex flex-col justify-center relative px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-accent)]/12 via-transparent to-transparent opacity-70"></div>

        <div className="hidden md:block absolute -top-24 right-[-10%] h-[52vh] w-[48vw] min-w-[320px] max-w-[680px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.14)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70 [mask-image:radial-gradient(circle_at_top_right,black_30%,transparent_82%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_68%)] blur-2xl"></div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto w-full">
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
            <Button onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })} variant="outline" size="lg" icon={<BookOpen size={20} />}>
              {t('hero.ctaBlog')}
            </Button>
            <Button onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })} size="lg" icon={<ArrowRight size={20} />}>
              {t('hero.ctaPrimary')}
            </Button>
            <Button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} variant="secondary" size="lg">
              {t('hero.ctaSecondary')}
            </Button>
          </div>
        </ScrollReveal>
      </div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--color-text-secondary)]"
        animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
        transition={shouldReduceMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown size={24} className="opacity-50" />
      </motion.div>
    </div>
  );
}
