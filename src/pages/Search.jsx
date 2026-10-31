import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSubjects } from '../lib/subjects';
import SubjectCard from '../components/SubjectCard';
import FileStatus from '../components/FileStatus';

// How many results to load at a time.
const PAGE_SIZE = 24;

// Search results page (/search?q=…), opened from the search box in the
// header (v1.2.0). The search text is kept in the URL, so a search can be
// bookmarked, shared, or returned to with the Back button. Results are
// fetched from Supabase a page at a time, with a "Load more" button.
function Search() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // Bumped by "Try again" to run the search again.
  const [attempt, setAttempt] = useState(0);

  // Run the search whenever the query in the URL changes.
  useEffect(() => {
    if (!query) {
      setResults([]);
      setTotal(0);
      return;
    }

    // Ignore a slow response if the user has already searched for something
    // else, so old results never replace newer ones.
    let cancelled = false;
    setLoading(true);
    setError(null);

    searchSubjects(query, { offset: 0, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setResults(page.subjects);
        setTotal(page.total);
      })
      .catch((err) => {
        console.error('Search failed:', err.message);
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, attempt]);

  // Fetch the next page and add it below the results already shown.
  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await searchSubjects(query, { offset: results.length, limit: PAGE_SIZE });
      setResults((current) => [...current, ...page.subjects]);
      setTotal(page.total);
    } catch (err) {
      console.error('Loading more results failed:', err.message);
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Catalogue search</p>
        <h1>{query ? `Results for “${query}”` : 'Search the catalogue'}</h1>
        <p className="hero__lede">
          {!query
            ? 'Type an item number, a word from a summary, or an object class into the search box above.'
            : loading
              ? 'Searching…'
              : `${total} ${total === 1 ? 'file matches' : 'files match'} your search.`}
        </p>
      </section>

      {/* Show exactly one of: nothing (no query), loading, error, no matches, or the cards. */}
      {!query ? null : loading ? (
        <FileStatus type="loading" message="Searching the catalogue…" />
      ) : error ? (
        <FileStatus
          type="error"
          message="The search could not be completed. Check your connection and try again."
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : results.length === 0 ? (
        <FileStatus
          type="empty"
          message="No files match your search. Try an item number (e.g. 017), a single word, or a class name."
        />
      ) : (
        <>
          <section className="grid" aria-label="Search results">
            {results.map((entry) => (
              <SubjectCard entry={entry} key={entry.id} />
            ))}
          </section>

          {/* More matches than are shown: offer the next page. */}
          {results.length < total && (
            <div className="search__more">
              <button type="button" className="form-button" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load more (${total - results.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default Search;
