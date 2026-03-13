import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Globe, History, Menu, SquareTerminal, UserRound, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  const headerClasses = `nav-terminal-shell fixed left-0 right-0 top-0 z-50 transition-all duration-300${
    isScrolled ? ' is-scrolled' : ''
  }`;
  const isCliPage = location.pathname === '/cli';
  const homepageModeTitle = isCliPage ? t('common.switchToStandardHome') : t('common.switchToCliHome');
  const desktopTabs = navItems.map((item) => ({
    ...item,
    pathLabel: item.id === 'top' ? '/home' : item.routePath!,
    Icon:
      item.id === 'top'
        ? FolderOpen
        : item.id === 'blog'
          ? History
          : item.id === 'projects'
            ? SquareTerminal
            : UserRound,
  }));

  return (
    <header className={headerClasses}>
      <div className="nav-terminal-shell__inner">
        <div className="nav-terminal-shell__left">
          <button onClick={handleLogoClick} className="nav-terminal-shell__brand" aria-label={t('nav.home')}>
            <span className="nav-terminal-shell__brand-mark" aria-hidden="true">
              <SquareTerminal size={15} />
            </span>
            <span className="nav-terminal-shell__brand-copy">
              <span className="nav-terminal-shell__brand-title">Chiicake&apos;s Blog</span>
            </span>
          </button>

          <nav className="nav-terminal-shell__tabs hidden md:flex">
            {desktopTabs.map((item) => {
              const active = isActive(item);
              const Icon = item.Icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  onMouseEnter={() => handleNavIntent(item)}
                  onFocus={() => handleNavIntent(item)}
                  className={`nav-terminal-shell__tab${active ? ' is-active' : ''}`}
                >
                  <Icon size={14} />
                  <span>{item.pathLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="nav-terminal-shell__right">
          <button
            onClick={() => navigate(isCliPage ? WEB_HOME_PATH : '/cli')}
            className="nav-terminal-shell__mode-toggle"
            aria-label={homepageModeTitle}
            title={homepageModeTitle}
          >
            <span className={`nav-terminal-shell__mode-segment${!isCliPage ? ' is-active' : ''}`}>WEB</span>
            <span className={`nav-terminal-shell__mode-segment${isCliPage ? ' is-active' : ''}`}>CLI</span>
          </button>

          <span className="nav-terminal-shell__divider hidden sm:block" aria-hidden="true" />

          <button
            onClick={toggleLang}
            className="nav-terminal-shell__lang"
            aria-label={t('common.switchLang')}
            title={t('common.switchLang')}
          >
            <Globe size={15} />
            <span className="mono-data">中文 / EN</span>
          </button>
          
          <button 
            className="nav-terminal-shell__mobile-toggle md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="nav-terminal-shell__mobile md:hidden"
          >
            <nav className="nav-terminal-shell__mobile-list">
              {desktopTabs.map((item) => {
                const active = isActive(item);
                const Icon = item.Icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    onFocus={() => handleNavIntent(item)}
                    className={`nav-terminal-shell__mobile-tab${active ? ' is-active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{item.pathLabel}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
