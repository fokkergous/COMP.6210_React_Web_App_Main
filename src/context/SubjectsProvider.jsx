import { useCallback, useEffect, useState } from 'react';
import { fetchSubjectList } from '../lib/subjects';
import { SubjectsContext } from './SubjectsContext';

// Fetches the catalogue list from Supabase once and shares it with every
// component through SubjectsContext. Wraps the app in App.jsx.
function SubjectsProvider({ children }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bumped by reload() to make the effect below run again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Ignore the result if the provider unmounts first (for example
    // React StrictMode's double mount in development).
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchSubjectList()
      .then((list) => {
        if (!cancelled) setSubjects(list);
      })
      .catch((err) => {
        console.error('Could not load the catalogue:', err.message);
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // useCallback keeps the same function between renders, so components
  // that receive it don't re-render unnecessarily.
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <SubjectsContext.Provider value={{ subjects, loading, error, reload }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export default SubjectsProvider;
