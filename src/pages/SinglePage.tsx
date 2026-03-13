import { useEffect } from 'react';
import { useLocation } from 'react-router';

import Home from './Home';
import { BlogPreview } from './sections/BlogPreview';

export default function SinglePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const { scrollTo } = location.state;
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
        window.history.replaceState({}, document.title);
      }, 100);
    }
  }, [location]);

  return (
    <div className="flex flex-col w-full">
      <Home />
      <div className="px-6 max-w-7xl mx-auto w-full">
        <BlogPreview id="blog" />
      </div>
    </div>
  );
}
