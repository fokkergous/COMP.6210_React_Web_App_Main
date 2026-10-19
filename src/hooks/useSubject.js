import { useCallback, useEffect, useState } from 'react';
import { fetchSubject } from '../lib/subjects';

// Loads one full subject (every section) for the dossier page.
// Fetches again whenever the slug in the URL changes.
//
// Returns { subject, loading, error, reload }:
//   subject  the dossier object, or null (still loading, failed, or no such slug)
//   loading  true while fetching
//   error    the error if the fetch failed, otherwise null
// "Not found" is: not loading, no error, and subject is null.
export function useSubject(slug) {
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Ignore a slow response if the user has already moved to another
    // subject, so an old file can never replace the current one.
    let cancelled = false;

    setLoading(true);
    setError(null);
    setSubject(null);

    fetchSubject(slug)
      .then((result) => {
        if (!cancelled) setSubject(result);
      })
      .catch((err) => {
        console.error(`Could not load ${slug}:`, err.message);
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { subject, loading, error, reload };
}
