import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../contexts/useTheme';

interface NavItem {
  id: string;
  label: string;
  isRoute?: boolean;
  routePath?: string;
}

const navItems: NavItem[] = [
  { id: 'top', label: 'nav.home' },
  { id: 'blog', label: 'nav.blog', isRoute: true, routePath: '/blog' },
  { id: 'projects', label: 'nav.projects' },
  { id: 'about', label: 'nav.about' },
  { id: 'skills', label: 'nav.skills' },
  { id: 'experience', label: 'nav.experience' },
  { id: 'education', label: 'nav.education' },
  { id: 'contact', label: 'nav.contact' },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('top');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMobileMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/') return;

    const observers = new Map<string, IntersectionObserver>();
    const sectionIds = ['blog', 'projects', 'about', 'skills', 'experience', 'education', 'contact'];
    
    const handleScrollForTop = () => {
      if (window.scrollY < 200) {
        setActiveSection('top');
      }
    };
    window.addEventListener('scroll', handleScrollForTop);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(entry.target.id);
              }
            });
          },
          { rootMargin: '-80px 0px -60% 0px' }
        );
        observer.observe(element);
        observers.set(id, observer);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScrollForTop);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [location.pathname]);

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const handleNavClick = useCallback((item: NavItem) => {
    setIsMobileMenuOpen(false);
    
    if (item.isRoute) {
      navigate(item.routePath!);
    } else if (location.pathname === '/') {
      if (item.id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: item.id === 'top' ? undefined : item.id } });
    }
  }, [location.pathname, navigate]);

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const isActive = (item: NavItem) => {
    if (item.isRoute) {
      return location.pathname.startsWith(item.routePath!);
    }
    return location.pathname === '/' && activeSection === item.id;
  };

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled 
      ? 'bg-[var(--color-surface)]/80 backdrop-blur-md shadow-sm py-3' 
      : 'bg-transparent py-5'
  }`;

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="text-xl font-bold tracking-tight text-[var(--color-accent)] transition-transform hover:scale-105"
        >
          C.
        </button>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item)
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              {t(item.label)}
            </button>
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
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`px-4 py-3 rounded-xl text-base font-medium mb-1 text-left ${
                    isActive(item)
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t(item.label)}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
