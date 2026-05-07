'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useRealtimeFirestore
 *
 * Subscribes to a Firestore real-time listener that uses onSnapshot.
 * The `subscribeFn` should be one of the subscribe* functions from firebaseService.js.
 * It must accept `(callback) => unsubscribeFn`.
 *
 * Guards:
 * - If the first dep is `undefined` → auth not ready yet, stay in loading state.
 * - If the first dep is `null`      → user logged out, clear data.
 * - Automatically unsubscribes when the component unmounts or deps change.
 *
 * @param {Function} subscribeFn  e.g. (cb) => subscribeToBookings(userId, cb)
 * @param {Array}    deps         Dependency array (include userId, etc.)
 * @returns {{ data, loading, error }}
 *
 * @example
 * const { data: bookings, loading } = useRealtimeFirestore(
 *   (cb) => subscribeToBookings(user?.uid, cb),
 *   [user?.uid]
 * );
 */
export function useRealtimeFirestore(subscribeFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    // Auth not loaded yet
    if (deps.length > 0 && deps[0] === undefined) {
      setLoading(true);
      return;
    }

    // User logged out — clear data
    if (deps.length > 0 && deps[0] === null) {
      setData(null);
      setLoading(false);
      // Clean up any existing listener
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      return;
    }

    // Tear down previous listener before creating a new one
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const unsub = subscribeFn((result) => {
        setData(result);
        setLoading(false);
      });
      unsubRef.current = unsub;
    } catch (err) {
      console.error('[useRealtimeFirestore] Subscription error:', err.message);
      setError(err.message);
      setLoading(false);
    }

    // Cleanup on unmount or dep change
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
