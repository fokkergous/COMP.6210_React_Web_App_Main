import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Supabase error messages mapped to friendlier wording. Anything not listed
// is shown as Supabase wrote it.
const FRIENDLY_ERRORS = {
  'Invalid login credentials': 'Email or password is incorrect.',
  'Email not confirmed':
    'This email address has not been confirmed yet. Check your inbox for the confirmation link.',
  'email rate limit exceeded':
    'Too many emails have been sent recently. Please wait a while and try again.',
};

function friendlyError(error) {
  return FRIENDLY_ERRORS[error.message] ?? error.message;
}

// Must match the database rule on profiles.display_name (1 to 50 characters).
const MAX_NAME_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 8;

// Personnel access page: sign in, or create an account ("request clearance").
// Visitors can browse the catalogue without an account; logging in is only
// needed to add or change content.
function Login() {
  const { user, signIn, signUp } = useAuth();
  const location = useLocation();

  // 'signIn' or 'signUp': which form is showing.
  const [mode, setMode] = useState('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Page to return to after logging in (set by the header's Log in link).
  const returnTo = location.state?.from ?? '/';

  // Already logged in (including straight after a successful sign-in):
  // go back to where the user came from.
  if (user) {
    return <Navigate to={returnTo} replace />;
  }

  const isSignUp = mode === 'signUp';

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  }

  // Checks the browser's built-in validation can't do (required, email
  // format and minimum length are handled by the input attributes).
  function validate() {
    if (isSignUp && displayName.trim() === '') {
      return 'Please enter a display name.';
    }
    if (isSignUp && password !== confirmPassword) {
      return 'The passwords do not match.';
    }
    return '';
  }

  async function handleSubmit(event) {
    // Stop the browser reloading the page; React handles the form instead.
    event.preventDefault();
    setError('');
    setNotice('');

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);

    if (isSignUp) {
      const result = await signUp(email.trim(), password, displayName.trim());
      if (result.error) {
        setError(friendlyError(result.error));
      } else if (result.alreadyRegistered) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (result.needsConfirmation) {
        // Account created; it becomes usable once the email link is clicked.
        switchMode('signIn');
        setNotice(
          `Clearance requested. We've sent a confirmation link to ${email.trim()}. ` +
            'Open it to activate your account, then sign in.'
        );
      }
      // Otherwise Supabase logged the user straight in (email confirmation
      // turned off) and the redirect above takes over on the next render.
    } else {
      const result = await signIn(email.trim(), password);
      if (result.error) setError(friendlyError(result.error));
      // On success the session changes and the redirect above takes over.
    }

    setSubmitting(false);
  }

  return (
    <section className="auth">
      <div className="auth__panel">
        <p className="eyebrow">Personnel access</p>
        <h1 className="auth__title">{isSignUp ? 'Request Clearance' : 'Sign In'}</h1>

        {/* Switch between the two forms. aria-pressed tells screen readers
            which one is active. */}
        <div className="auth__tabs" role="group" aria-label="Choose form">
          <button
            type="button"
            className="auth__tab"
            aria-pressed={!isSignUp}
            onClick={() => switchMode('signIn')}
          >
            Sign in
          </button>
          <button
            type="button"
            className="auth__tab"
            aria-pressed={isSignUp}
            onClick={() => switchMode('signUp')}
          >
            Create account
          </button>
        </div>

        {/* role="alert" / role="status" make screen readers read these out
            as soon as they appear. */}
        {error && (
          <p className="form-message form-message--error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="form-message form-message--notice" role="status">
            {notice}
          </p>
        )}

        <form className="auth__form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-field">
              <label htmlFor="auth-name">Display name</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="nickname"
                required
                maxLength={MAX_NAME_LENGTH}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <span className="form-hint">Shown on addenda you write.</span>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              // Lets password managers tell the two forms apart.
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {isSignUp && (
              <span className="form-hint">At least {MIN_PASSWORD_LENGTH} characters.</span>
            )}
          </div>

          {isSignUp && (
            <div className="form-field">
              <label htmlFor="auth-confirm">Confirm password</label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {/* Disabled while waiting for Supabase so it can't be submitted twice. */}
          <button type="submit" className="form-button" disabled={submitting}>
            {submitting ? 'Verifying…' : isSignUp ? 'Request clearance' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
