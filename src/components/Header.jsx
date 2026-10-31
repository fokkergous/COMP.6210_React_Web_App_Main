import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/scp/scp-logo.png';
import DbStatus from './DbStatus';
import Sidebar from './Sidebar';
import SearchBox from './SearchBox';

// Render the site header: the clearance bar (with the live database
// connection status), then a sticky row with the ☰ menu button and the
// brand. The ☰ button opens the Sidebar, which holds all navigation and
// the account (log in / log out) area.
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Close the side bar and put keyboard focus back on the ☰ button, so
  // keyboard users continue from where they opened it. useCallback keeps the
  // same function between renders (Sidebar's Escape listener depends on it).
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="clearance-bar">
          <span>LEVEL 3 CLEARANCE REQUIRED</span>
          <span className="clearance-bar__sep" aria-hidden="true">·</span>
          <span>FIELD CATALOGUE — MOBILE ACCESS ENABLED</span>
          <span className="clearance-bar__sep" aria-hidden="true">·</span>
          <DbStatus />
        </div>
      </header>

      {/* Kept outside <header> so it can stick to the top of the screen
          while the page scrolls, keeping ☰ always within reach. */}
      <div className="site-header__row">
        <button
          ref={menuButtonRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-sidebar"
          aria-label="Open navigation"
          onClick={() => setMenuOpen(true)}
        >
          <span className="menu-toggle__icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="menu-toggle__label">Menu</span>
        </button>

        <Link to="/" className="brand">
          <img src={logo} alt="SCP Foundation seal" className="brand__logo" />
          <span className="brand__text">
            <span className="brand__name">SCP Foundation</span>
            <span className="brand__tag">Secure · Contain · Protect</span>
          </span>
        </Link>

        {/* Site-wide search (v1.2.0): right-hand side, own line on phones. */}
        <SearchBox />
      </div>

      <Sidebar open={menuOpen} onClose={closeMenu} />
    </>
  );
}

export default Header;
