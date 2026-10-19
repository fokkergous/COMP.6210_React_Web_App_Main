import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Header account area: a "Log in" link for visitors, or the user's display
// name, role and a "Log out" button once logged in.
function AccountStatus() {
  const { user, profile, role, loading, signOut } = useAuth();
  const location = useLocation();

  // Show nothing until the saved session has been checked, to avoid "Log in"
  // flashing up for a user who is already logged in.
  if (loading) return null;

  if (!user) {
    return (
      // Pass the current page so the login page can send the user back here.
      <Link to="/login" state={{ from: location.pathname }} className="account__login">
        Log in
      </Link>
    );
  }

  return (
    <div className="account">
      <span className="account__name">
        {/* Fall back to the email while the profile is still loading. */}
        {profile?.display_name ?? user.email}
        {role && <span className="account__role">{role}</span>}
      </span>
      <button type="button" className="account__logout" onClick={signOut}>
        Log out
      </button>
    </div>
  );
}

export default AccountStatus;
