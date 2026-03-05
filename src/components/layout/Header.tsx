import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const navLinks = [
    { path: '/', label: 'nav.home' },
    { path: '/about', label: 'nav.about' },
    { path: '/skills', label: 'nav.skills' },
    { path: '/projects', label: 'nav.projects' },
    { path: '/experience', label: 'nav.experience' },
    { path: '/education', label: 'nav.education' },
    { path: '/blog', label: 'nav.blog' },
    { path: '/contact', label: 'nav.contact' },
  ];

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled 
      ? 'bg-[var(--color-surface)]/80 backdrop-blur-md shadow-sm py-3' 
      : 'bg-transparent py-5'
  }`;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <NavLink 
          to="/" 
          className="text-xl font-bold tracking-tight text-[var(--color-accent)] transition-transform hover:scale-105"
        >
          C.
        </NavLink>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => 
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800'
                }`
              }
            >
              {t(link.label)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLang}
            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={t('common.switchLang')}
            title={t('common.switchLang')}
          >
            <Globe size={20} />
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={t('common.toggleTheme')}
            title={t('common.toggleTheme')}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            className="md:hidden p-2 rounded-full text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[var(--color-surface)] border-b border-gray-200 dark:border-slate-800 overflow-hidden"
          >
            <nav className="flex flex-col p-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => 
                    `px-4 py-3 rounded-xl text-base font-medium mb-1 ${
                      isActive 
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {t(link.label)}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}