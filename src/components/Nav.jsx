import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSubjects } from '../context/SubjectsContext';

// Render the primary navigation: a slim bar with a Home link and a
// "File index" button that opens a grid of every subject.
//
// The index is a drop-down on every screen size so the sticky bar stays one
// line however many subjects the catalogue holds. The links come from the
// shared subjects list (Supabase); while it loads, or if it fails, the index
// is empty and the Home page explains why.
function Nav() {
  const [open, setOpen] = useState(false);
  const { subjects } = useSubjects();

  // While the index is open, let the Escape key close it.
  useEffect(() => {
    if (!open) return;

    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    // Remove the listener when the index closes or the component unmounts.
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <nav className="site-nav" aria-label="Primary">
      <div className="site-nav__bar">
        <NavLink to="/" end className="site-nav__home" onClick={() => setOpen(false)}>
          Home
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-nav-list"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle__icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          File index
          <span className="nav-toggle__count">{subjects.length}</span>
        </button>
      </div>

      {/* hidden keeps the list in the page (so aria-controls always points
          at it) but out of sight and out of the tab order while closed.
          Clicking any link inside closes the index. */}
      <ul
        id="primary-nav-list"
        className="nav-list"
        hidden={!open}
        onClick={() => setOpen(false)}
      >
        {subjects.map((entry) => (
          <li key={entry.id}>
            <NavLink to={`/${entry.id}`}>{entry.item}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Nav;
