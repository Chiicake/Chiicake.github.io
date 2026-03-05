import { Suspense, lazy } from 'react';
import { createHashRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import './i18n';

const SinglePage = lazy(() => import('./pages/SinglePage'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <SinglePage /> },
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <BlogArticle /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
}