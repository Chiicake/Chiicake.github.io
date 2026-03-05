import { useEffect } from 'react';
import { useLocation } from 'react-router';

import Home from './Home';
import About from './About';
import Skills from './Skills';
import Projects from './Projects';
import Experience from './Experience';
import Education from './Education';
import Contact from './Contact';
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
        <About id="about" />
        <Skills id="skills" />
        <Projects id="projects" />
        <Experience id="experience" />
        <Education id="education" />
        <BlogPreview id="blog" />
        <Contact id="contact" />
      </div>
    </div>
  );
}