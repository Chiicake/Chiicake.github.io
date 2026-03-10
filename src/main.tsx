import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';

document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.classList.add('dark');
document.documentElement.style.colorScheme = 'dark';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
