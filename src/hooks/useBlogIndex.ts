import { useEffect, useState } from 'react';
import { fetchBlogIndex, type BlogIndex } from '../lib/blog';

interface UseBlogIndexResult {
  index: BlogIndex | null;
  loading: boolean;
  error: boolean;
}

export function useBlogIndex(): UseBlogIndexResult {
  const [index, setIndex] = useState<BlogIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    fetchBlogIndex()
      .then((data) => {
        if (!active) {
          return;
        }

        setIndex(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { index, loading, error };
}
