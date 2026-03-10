import { Suspense, lazy } from 'react';
import { Navigate, createHashRouter, RouterProvider } from 'react-router';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { LOCAL_BLOG_ADMIN_ROUTE } from './lib/localBlogAdminConfig';
import './i18n';

const SinglePage = lazy(() => import('./pages/SinglePage'));
const CliHome = lazy(() => import('./pages/CliHome'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogCollection = lazy(() => import('./pages/BlogCollection'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));
const LocalBlogAdmin = import.meta.env.DEV ? lazy(() => import('./pages/LocalBlogAdmin')) : null;

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
      { index: true, element: <Navigate to="/cli" replace /> },
      { path: 'web', element: <SinglePage /> },
      { path: 'cli', element: <CliHome /> },
      { path: 'blog', element: <Blog /> },
      { path: 'blog/collections/:collectionSlug', element: <BlogCollection /> },
      { path: 'blog/:slug', element: <BlogArticle /> },
    ],
  },
  ...(LocalBlogAdmin
    ? [
        {
          path: `/${LOCAL_BLOG_ADMIN_ROUTE}`,
          element: <LocalBlogAdmin />,
        },
      ]
    : []),
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
