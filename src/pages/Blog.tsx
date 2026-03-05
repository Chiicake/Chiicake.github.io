import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { PenLine } from 'lucide-react';

export default function Blog() {
  const { t } = useTranslation();

  return (
    <div className="py-12">
      <SectionTitle title={t('blog.title')} subtitle={t('blog.subtitle')} />

      <ScrollReveal>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-6">
            <PenLine size={36} className="text-[var(--color-accent)]" />
          </div>
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
            {t('common.comingSoon')}
          </h3>
          <p className="text-[var(--color-text-secondary)] max-w-md">
            {t('blog.stayTuned')}
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
