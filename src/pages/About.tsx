import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { Card } from '../components/ui/Card';
import { ScrollReveal } from '../components/animations/ScrollReveal';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="py-12">
      <SectionTitle title={t('about.title')} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        <ScrollReveal className="lg:col-span-1" direction="right">
          <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--color-accent)] to-purple-400 relative">
            <div className="absolute inset-0 flex items-center justify-center text-white/50 font-medium text-lg">
              Avatar Placeholder
            </div>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" 
              alt="Portrait placeholder" 
              className="w-full h-full object-cover mix-blend-overlay opacity-80"
            />
          </div>
        </ScrollReveal>

        <ScrollReveal className="lg:col-span-2" delay={0.2} direction="left">
          <div className="prose dark:prose-invert max-w-none text-lg text-[var(--color-text-secondary)] leading-relaxed mb-10">
            <p>{t('about.bio')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: t('about.stats.experience'), value: '5+' },
              { label: t('about.stats.projects'), value: '40+' },
              { label: t('about.stats.clients'), value: '20+' }
            ].map((stat, idx) => (
              <Card key={idx} className="text-center p-6 bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg)]">
                <div className="text-3xl font-black text-[var(--color-accent)] mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">{stat.label}</div>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-[var(--color-text-primary)]">
              {t('about.interests')}
            </h3>
            <div className="flex flex-wrap gap-3">
              {t('about.interestsList').split(',').map((interest, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium text-sm"
                >
                  {interest.trim()}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}