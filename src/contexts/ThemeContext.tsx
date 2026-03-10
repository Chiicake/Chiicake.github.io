import React, { useEffect } from 'react';
import { ThemeContext } from './theme-context';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    localStorage.removeItem('theme');
    localStorage.removeItem('app-theme');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}
