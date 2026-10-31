import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubjects } from '../context/SubjectsContext';

// The slide-out navigation panel, opened by the ☰ button in the header.
// Holds every navigation option: Home, "+ New file" (editors and admins),
// and the File index (a collapsible list of every subject). The account
// area is pinned to the bottom: "Log in" for visitors, or the user's name,
// role and a "Log out" button.
//
// Added in v1.1.0 after user testing: users found the old navigation bar and
// header buttons awkward and preferred a hamburger side bar, with the
// account shown at the bottom (like the Claude desktop app).
//
//   open     whether the panel is showing
//   onClose  called to close it (link chosen, ✕, Escape, or clicking outside)
function Sidebar({ open, onClose }) {
  const { user, profile, role, loading, signOut } = useAuth();
  const { subjects } = useSubjects();
  const location = useLocation();
  const closeButtonRef = useRef(null);

  // Whether the File index list is expanded. Kept while the panel closes and
  // reopens, so it remembers the user's choice.
  const [indexOpen, setIndexOpen] = useState(false);

  // Only editors and admins can create files (matches the database rules).
  const canCreate = role === 'editor' || role === 'admin';

  // While open: move keyboard focus into the panel, and let Escape close it.
  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    // Remove the listener when the panel closes or the component unmounts.
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Close the panel whenever a link inside it is followed.
  function handleNavClick(event) {
    if (event.target.closest('a')) onClose();
  }

  async function handleLogOut() {
    await signOut();
    onClose();
  }

  return (
    <>
      {/* Dimmed page behind the open panel; clicking it closes the panel. */}
      <div
        className={`sidebar-backdrop ${open ? 'sidebar-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* inert while closed: the hidden panel's links can't be tabbed to or
          read out by screen readers. */}
      <aside
        id="site-sidebar"
        className={`sidebar ${open ? 'sidebar--open' : ''}`}
        aria-label="Site navigation"
        inert={!open}
      >
        <div className="sidebar__header">
          <span className="eyebrow">Navigation</span>
          <button
            ref={closeButtonRef}
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary" onClick={handleNavClick}>
          <NavLink to="/" end className="sidebar__link">
            Home
          </NavLink>

          {canCreate && (
            <Link to="/new" className="sidebar__link sidebar__link--action">
              + New file
            </Link>
          )}

          {/* File index: a button that expands the list of every subject. */}
          <button
            type="button"
            className="sidebar__link sidebar__index-toggle"
            aria-expanded={indexOpen}
            aria-controls="sidebar-file-index"
            onClick={() => setIndexOpen((v) => !v)}
          >
            <span>File index</span>
            <span className="sidebar__count">{subjects.length}</span>
            <span className="sidebar__chevron" aria-hidden="true">
              {indexOpen ? '▾' : '▸'}
            </span>
          </button>

          <ul id="sidebar-file-index" className="sidebar__index" hidden={!indexOpen}>
            {subjects.map((entry) => (
              <li key={entry.id}>
                {/* NavLink highlights the file currently open. */}
                <NavLink to={`/${entry.id}`} className="sidebar__file">
                  {entry.item}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account area, pinned to the bottom of the panel. Nothing shows
            until the saved session has been checked, so "Log in" doesn't
            flash up for a user who is already logged in. */}
        <div className="sidebar__account">
          {!loading && !user && (
            // Pass the current page so the login page can send the user back here.
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="form-button sidebar__login"
              onClick={onClose}
            >
              Log in
            </Link>
          )}

          {!loading && user && (
            <>
              <div className="sidebar__user">
                {/* Fall back to the email while the profile is still loading. */}
                <span className="sidebar__name">{profile?.display_name ?? user.email}</span>
                {role && <span className="sidebar__role">{role}</span>}
              </div>
              <button type="button" className="sidebar__logout" onClick={handleLogOut}>
                Log out
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
