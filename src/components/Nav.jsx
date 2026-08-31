import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import scpData from '../data/scpData.json';

// Render the primary navigation: toggleable index and per entry links.
function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav" aria-label="Primary">
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
        Index
      </button>

      <ul
        id="primary-nav-list"
        className={`nav-list ${open ? 'nav-list--open' : ''}`}
        onClick={() => setOpen(false)}
      >
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        {scpData.map((entry) => (
          <li key={entry.id}>
            <NavLink to={`/${entry.id}`}>{entry.item}</NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Nav;
