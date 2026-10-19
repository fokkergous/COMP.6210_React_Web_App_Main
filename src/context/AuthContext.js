import { createContext, useContext } from 'react';

// Holds the current user's login state so any component can read it with
// useAuth(), without passing props down through every level.
// The value is supplied by <AuthProvider> (AuthProvider.jsx).
//
// Kept in a separate .js file from the provider component so that React's
// fast refresh keeps working (a file should export only components, or no
// components at all).
export const AuthContext = createContext(null);

// Returns the auth state and actions:
//   session, user          the Supabase Auth session and user (null if logged out)
//   profile                the user's row from public.profiles: { display_name, role }
//   role                   shortcut for profile.role ('contributor' | 'editor' | 'admin')
//   loading                true until the initial session check has finished
//   signIn, signUp, signOut
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth() must be used inside <AuthProvider>.');
  }
  return auth;
}
