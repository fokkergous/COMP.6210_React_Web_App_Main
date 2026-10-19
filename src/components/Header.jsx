import { Link } from 'react-router-dom';
import logo from '../assets/scp/scp-logo.png';
import DbStatus from './DbStatus';
import AccountStatus from './AccountStatus';

// Render the site header with branding, clearance information, the live
// database connection status and the account (log in / log out) area.
function Header() {
  return (
    <header className="site-header">
      <div className="clearance-bar">
        <span>LEVEL 3 CLEARANCE REQUIRED</span>
        <span className="clearance-bar__sep" aria-hidden="true">·</span>
        <span>FIELD CATALOGUE — MOBILE ACCESS ENABLED</span>
        <span className="clearance-bar__sep" aria-hidden="true">·</span>
        <DbStatus />
      </div>
      <div className="site-header__row">
        <Link to="/" className="brand">
          <img src={logo} alt="SCP Foundation seal" className="brand__logo" />
          <span className="brand__text">
            <span className="brand__name">SCP Foundation</span>
            <span className="brand__tag">Secure · Contain · Protect</span>
          </span>
        </Link>
        <AccountStatus />
      </div>
    </header>
  );
}

export default Header;
