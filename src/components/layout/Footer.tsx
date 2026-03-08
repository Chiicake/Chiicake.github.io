import { useTranslation } from 'react-i18next';
import { Github, Mail } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 dark:border-slate-800 bg-[var(--color-surface)] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <p className="text-[var(--color-text-secondary)] text-sm">
            {t('footer.copyright', { year })}
          </p>
          <p className="text-[var(--color-text-secondary)] text-xs mt-1">
            {t('footer.builtWith')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/chiicake"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="mailto:hello@example.com"
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
