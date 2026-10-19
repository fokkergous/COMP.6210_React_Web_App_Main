import { Link, useLocation } from 'react-router-dom';

// Shown instead of a form the user isn't allowed to use (creating or editing
// a subject). Visitors get a Log in link that brings them back to this page;
// logged-in users get the reason and a link back to the index.
//
//   loggedIn  whether someone is logged in
//   reason    explanation shown to logged-in users
function ClearanceRequired({ loggedIn, reason }) {
  const location = useLocation();

  return (
    <section className="not-found">
      <p className="eyebrow">Access denied</p>
      <h1>Editor Clearance Required</h1>
      <p>{loggedIn ? reason : 'Log in with an editor account to continue.'}</p>
      {loggedIn ? (
        <Link to="/" className="card__cta">← Return to index</Link>
      ) : (
        <Link to="/login" state={{ from: location.pathname }} className="card__cta">Log in →</Link>
      )}
    </section>
  );
}

export default ClearanceRequired;
