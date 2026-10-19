import { createContext, useContext } from 'react';

// Holds the catalogue list (one entry per subject) so the Home page cards
// and the Nav links share a single request. Supplied by <SubjectsProvider>.
// Kept separate from the provider component for React fast refresh, like
// AuthContext.js.
export const SubjectsContext = createContext(null);

// Returns { subjects, loading, error, reload }:
//   subjects  array of { id, item, summary, image, imageAlt, objectClass, tone }
//   loading   true while the list is being fetched
//   error     the error if the fetch failed, otherwise null
//   reload()  fetch the list again (used by "Try again" buttons)
export function useSubjects() {
  const value = useContext(SubjectsContext);
  if (!value) {
    throw new Error('useSubjects() must be used inside <SubjectsProvider>.');
  }
  return value;
}
