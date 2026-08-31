import { Link } from 'react-router-dom';

// Render a simple 404 Not Found page with a link back to the index.
function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">Error 404</p>
      <h1>File Not Found</h1>
      <p>No record matches this designation. It may be classified beyond your clearance, or does not exist.</p>
      <Link to="/" className="card__cta">← Return to index</Link>
    </section>
  );
}

export default NotFound;
