import { useCallback, useEffect, useState } from 'react';
import { fetchSubject } from '../lib/subjects';

// Loads one full subject (every section) for the dossier page.
// Fetches again whenever the slug in the URL changes.
//
// Returns { subject, loading, error, reload, refresh }:
//   subject  the dossier object, or null (still loading, failed, or no such slug)
//   loading  true while fetching
//   error    the error if the fetch failed, otherwise null
//   reload   fetch again from scratch, showing the loading state (for "Try again")
//   refresh  fetch again quietly, keeping the page on screen (after saving a change)
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

  // Re-fetch without clearing the subject or showing "Retrieving file…", so
  // the page doesn't flash or jump back to the top after a save. Errors are
  // thrown back to the caller, which shows its own message.
  const refresh = useCallback(async () => {
    const result = await fetchSubject(slug);
    setSubject(result);
  }, [slug]);

  return { subject, loading, error, reload, refresh };
}
