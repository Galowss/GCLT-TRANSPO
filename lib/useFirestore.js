'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to fetch data from a Firestore service function.
 * Returns { data, loading, error, refetch }.
 *
 * Guards:
 * - Skips fetch if first dep is `undefined` (auth not loaded yet)
 * - Skips fetch if first dep is `null` (user logged out)
 * - Always fetches fresh from Firestore (no stale cache)
 * - Clears data on user change to prevent stale display
 */
export function useFirestore(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(0);

  const refetch = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      // Only update if this is still the latest fetch
      if (fetchId === fetchRef.current) {
        setData(result);
      }
    } catch (err) {
      console.error('[useFirestore] Fetch error:', err.message, err.code || '');
      if (fetchId === fetchRef.current) {
        setError(err.message);
      }
    } finally {
      if (fetchId === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn]);

  useEffect(() => {
    // If deps are provided and the first dep is explicitly undefined,
    // skip — auth context hasn't loaded yet.
    if (deps.length > 0 && deps[0] === undefined) {
      setLoading(true); // still loading, auth not ready
      return;
    }

    // If first dep is null (user logged out), clear data and stop loading
    if (deps.length > 0 && deps[0] === null) {
      setData(null);
      setLoading(false);
      return;
    }

    // Clear previous data before fetching new data
    // This prevents showing stale data from a previous user session
    setData(null);
    refetch();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
}
