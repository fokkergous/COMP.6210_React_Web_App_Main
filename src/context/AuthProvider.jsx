import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContext';

// Tracks who is logged in and shares it with the whole app through
// AuthContext. Wraps the app in App.jsx.
//
// Two pieces of state:
//   session  comes from Supabase Auth (who you are)
//   profile  comes from the public.profiles table (your display name and role,
//            which Row Level Security uses to decide what you may change)
function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session: read the saved session on first load, then listen for changes
  //    (sign in, sign out, token refresh, or arriving from the email
  //    confirmation link, which supabase-js picks up from the URL).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Only store the session here. Supabase advises against calling other
      // Supabase methods inside this callback, so the profile is loaded by
      // the separate effect below instead.
      setSession(newSession);
    });

    // Stop listening when the provider unmounts.
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2. Profile: load it whenever the logged-in user changes.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    // Ignore a slow response if the user changed in the meantime.
    let cancelled = false;

    supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Could not load profile:', error.message);
        setProfile(data ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Log in with email and password. Returns { error } (null on success);
  // the session listener above updates the state.
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  // Create an account. display_name is passed as user metadata, which the
  // database trigger handle_new_user() copies into public.profiles.
  // emailRedirectTo is where the confirmation link sends the user back to:
  // the address the app is running on (localhost now, Netlify later).
  // Returns { error, needsConfirmation, alreadyRegistered }.
  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });

    // When email confirmation is on, Supabase does not report "already
    // registered" as an error (so attackers can't test which emails exist).
    // Instead it returns a user with no identities.
    const alreadyRegistered = !error && data.user?.identities?.length === 0;

    // No session yet means the user must click the link in their email.
    const needsConfirmation = !error && !alreadyRegistered && !data.session;

    return { error, needsConfirmation, alreadyRegistered };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out failed:', error.message);
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
