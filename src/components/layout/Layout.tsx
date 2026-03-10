import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageTransition } from '../animations/PageTransition';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';
  const isCliPage = location.pathname === '/cli';

  useEffect(() => {
    if (!isHomePage && !isCliPage) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [isCliPage, isHomePage, location.pathname]);

  useEffect(() => {
    if (!isCliPage) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isCliPage]);

  return (
    <div className={`flex min-h-screen flex-col${isCliPage ? ' overflow-hidden' : ''}`}>
      <Header />
      <main className={isCliPage ? 'flex-grow overflow-hidden pt-0' : isHomePage ? 'flex-grow pt-0' : 'flex-grow pt-24 px-6 max-w-7xl mx-auto w-full'}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      {!isCliPage ? <Footer /> : null}
    </div>
  );
}
