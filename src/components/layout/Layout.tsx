import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageTransition } from '../animations/PageTransition';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [location.pathname, isHomePage]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={isHomePage ? 'flex-grow pt-0' : 'flex-grow pt-24 px-6 max-w-7xl mx-auto w-full'}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}