import { Link, useLocation } from 'react-router-dom';
import { useSubjects } from '../context/SubjectsContext';
import { useAuth } from '../context/AuthContext';
import SubjectImage from '../components/SubjectImage';
import FileStatus from '../components/FileStatus';

// Render the homepage: hero section and a grid of SCP entry cards.
// The cards come from Supabase via the shared subjects list.
function Home() {
  const { subjects, loading, error, reload } = useSubjects();
  const { role } = useAuth();
  // Only editors and admins can create files (matches the database rules).
  const canCreate = role === 'editor' || role === 'admin';

  // A message passed by the page that sent the user here, e.g. after
  // deleting a file: navigate('/', { state: { notice: 'SCP-022 has been deleted.' } })
  const notice = useLocation().state?.notice;

  return (
    <>
      {notice && (
        <p className="page-notice" role="status">
          {notice}
        </p>
      )}

      <section className="hero">
        <p className="eyebrow">Field Catalogue — Restricted Access</p>
        <h1>Anomalous Item Index</h1>
        <p className="hero__lede">
          A modernised, record of contained subjects, entities, and objects.
          Select a file below or in the Navbar to open its full containment dossier.
        </p>
        {canCreate && (
          <Link to="/new" className="form-button hero__action">
            + New file
          </Link>
        )}
      </section>

      {/* Show exactly one of: loading, error, empty catalogue, or the cards. */}
      {loading ? (
        <FileStatus type="loading" message="Retrieving catalogue…" />
      ) : error ? (
        <FileStatus
          type="error"
          message="The catalogue could not be retrieved. Check your connection and try again."
          onRetry={reload}
        />
      ) : subjects.length === 0 ? (
        <FileStatus type="empty" message="No files have been entered into the catalogue yet." />
      ) : (
        <section className="grid" aria-label="Catalogue entries">
          {subjects.map((entry) => (
            <Link to={`/${entry.id}`} className="card" key={entry.id}>
              <div className="card__image-wrap">
                <SubjectImage src={entry.image} alt={entry.imageAlt} className="card__image" />
              </div>
              <div className="card__body">
                <h2 className="card__item">{entry.item}</h2>
                <p className="card__summary">{entry.summary}</p>
                <span className="card__cta">Open file →</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

export default Home;
