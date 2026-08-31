import logo from '../assets/scp/scp-logo.png';

// Render the site footer with logo, placeholder links, and copyright.
function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <img src={logo} alt="SCP Foundation seal" className="site-footer__logo" />
        <div className="site-footer__links" aria-label="SCP Foundation office links">
          <span className="eyebrow">Other Offices</span>
          {/* Placeholder links only, for assignment purposes */}
          <a href="#" onClick={(e) => e.preventDefault()}>Site-42</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Area-12</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Site-64</a>
        </div>
        <p className="site-footer__copyright">
          © 2026 SCP Foundation. Unauthorised distribution of contained files is a Class-3 violation.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
