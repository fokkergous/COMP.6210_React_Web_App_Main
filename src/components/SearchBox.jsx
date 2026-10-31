import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// The site-wide search box in the sticky header row (v1.2.0). Submitting it
// opens the results page, /search?q=<text>. On the results page the box
// shows the current search so it can be refined.
function SearchBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [text, setText] = useState('');

  // Keep the box in step with the URL when on the results page (including
  // after using the Back button).
  const onResultsPage = location.pathname === '/search';
  const urlQuery = searchParams.get('q') ?? '';
  useEffect(() => {
    if (onResultsPage) setText(urlQuery);
  }, [onResultsPage, urlQuery]);

  function handleSubmit(event) {
    // Stop the browser reloading the page; React Router navigates instead.
    event.preventDefault();
    const query = text.trim();
    if (!query) return;
    // encodeURIComponent makes the text safe to put in a URL (spaces, & …).
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    // role="search" marks this as the site's search area for screen readers.
    <form className="site-search" role="search" onSubmit={handleSubmit}>
      <label htmlFor="site-search-input" className="visually-hidden">
        Search the catalogue
      </label>
      <input
        id="site-search-input"
        type="search"
        placeholder="Search files…"
        maxLength={100}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="site-search__button" aria-label="Search">
        {/* Magnifying-glass icon */}
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}

export default SearchBox;
