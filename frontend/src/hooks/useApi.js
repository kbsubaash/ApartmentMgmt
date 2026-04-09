import { useState, useCallback } from 'react';

/**
 * Generic hook for API calls with loading/error state.
 * Usage: const { run, data, loading, error } = useApi(apiFn);
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFn(...args);
        setData(res.data);
        return res.data;
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Request failed';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  return { run, data, loading, error, setData };
}
