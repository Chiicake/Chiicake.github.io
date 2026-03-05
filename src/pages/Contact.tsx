import { useTranslation } from 'react-i18next';
import { SectionTitle } from '../components/ui/SectionTitle';
import { ScrollReveal } from '../components/animations/ScrollReveal';
import { Github, Mail, Send } from 'lucide-react';

export default function Contact({ id }: { id?: string }) {
  const { t } = useTranslation();

  const contactLinks = [
    {
      icon: Github,
      label: 'GitHub',
      value: t('contact.github'),
      href: `https://${t('contact.github')}`,
    },
    {
      icon: Mail,
      label: 'Email',
      value: t('contact.email'),
      href: `mailto:${t('contact.email')}`,
    },
  ];

  return (
    <section id={id} className="scroll-mt-20">
    <div className="py-12">
      <SectionTitle title={t('contact.title')} />

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <ScrollReveal direction="left">
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8">
            {t('contact.description')}
          </p>

          <div className="space-y-4">
            {contactLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.label === 'Email' ? undefined : '_blank'}
                  rel={link.label === 'Email' ? undefined : 'noopener noreferrer'}
                  className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-xl border border-gray-100 dark:border-slate-800/50 hover:border-[var(--color-accent)]/30 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center group-hover:bg-[var(--color-accent)]/20 transition-colors">
                    <IconComponent size={20} className="text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{link.label}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{link.value}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="bg-[var(--color-surface)] rounded-2xl p-8 border border-gray-100 dark:border-slate-800/50 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] mx-auto mb-6 flex items-center justify-center">
              <Send size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
              {t('contact.title')}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {t('contact.description')}
            </p>
            <a
              href={`mailto:${t('contact.email')}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              <Mail size={18} />
              {t('contact.email')}
            </a>
          </div>
        </ScrollReveal>
      </div>
    </div>
    </section>
  );
}
