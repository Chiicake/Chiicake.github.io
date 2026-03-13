import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, SquareTerminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import avatarImage from '../../../avatar.png';
import { preloadBlogPageAssets } from '../../lib/blogPrefetch';

interface NavItem {
  id: string;
  label: string;
  isRoute?: boolean;
  routePath?: string;
}

const navItems: NavItem[] = [
  { id: 'top', label: 'nav.home' },
  { id: 'blog', label: 'nav.blog', isRoute: true, routePath: '/blog' },
  { id: 'projects', label: 'nav.projects', isRoute: true, routePath: '/projects' },
  { id: 'about', label: 'nav.about', isRoute: true, routePath: '/about' },
];

const WEB_HOME_PATH = '/home';

export function Header() {
  const { t, i18n } = useTranslation();
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
    if (location.pathname !== WEB_HOME_PATH) return;

    const observers = new Map<string, IntersectionObserver>();
    const sectionIds = ['blog'];
    
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

  const handleNavIntent = (item: NavItem) => {
    if (item.routePath === '/blog') {
      preloadBlogPageAssets();
    }
  };

  const handleNavClick = useCallback((item: NavItem) => {
    setIsMobileMenuOpen(false);

    handleNavIntent(item);
    
    if (item.isRoute) {
      navigate(item.routePath!);
    } else if (location.pathname === WEB_HOME_PATH) {
      if (item.id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(WEB_HOME_PATH, { state: { scrollTo: item.id === 'top' ? undefined : item.id } });
    }
  }, [location.pathname, navigate]);

  const handleLogoClick = () => {
    if (location.pathname === WEB_HOME_PATH) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(WEB_HOME_PATH);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.isRoute) {
      return location.pathname.startsWith(item.routePath!);
    }
    return location.pathname === WEB_HOME_PATH && activeSection === item.id;
  };

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isScrolled 
      ? 'bg-[var(--color-surface)]/80 backdrop-blur-md shadow-sm py-3' 
      : 'bg-transparent py-5'
  }`;
  const isCliPage = location.pathname === '/cli';
  const homepageModeTitle = isCliPage ? t('common.switchToStandardHome') : t('common.switchToCliHome');
  const homepageModeLabel = isCliPage ? t('common.standardModeLabel') : t('common.cliModeLabel');

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="overflow-hidden rounded-full border border-gray-200/80 shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition-transform hover:scale-105 dark:border-slate-800/80"
          aria-label={t('nav.home')}
        >
          <img
            src={avatarImage}
            alt="Chiicake avatar"
            className="h-11 w-11 object-cover"
            loading="eager"
          />
        </button>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              onMouseEnter={() => handleNavIntent(item)}
              onFocus={() => handleNavIntent(item)}
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
            onClick={() => navigate(isCliPage ? WEB_HOME_PATH : '/cli')}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
              isCliPage
                ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent)]/12 text-[var(--color-accent)]'
                : 'border-gray-200/80 text-[var(--color-text-secondary)] hover:bg-gray-100 dark:border-slate-800/80 dark:hover:bg-slate-800'
            }`}
            aria-label={homepageModeTitle}
            title={homepageModeTitle}
          >
            <SquareTerminal size={18} />
            <span className="mono-data hidden text-[11px] uppercase tracking-[0.18em] sm:inline">
              {homepageModeLabel}
            </span>
          </button>

          <button
            onClick={toggleLang}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 px-3 py-2 text-[var(--color-text-secondary)] transition-colors hover:bg-gray-100 dark:border-slate-800/80 dark:hover:bg-slate-800"
            aria-label={t('common.switchLang')}
            title={t('common.switchLang')}
          >
            <Globe size={18} />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">中文 / English</span>
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
                  onFocus={() => handleNavIntent(item)}
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
