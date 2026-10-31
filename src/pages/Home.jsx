import { Link, useLocation } from 'react-router-dom';
import { useSubjects } from '../context/SubjectsContext';
import { useAuth } from '../context/AuthContext';
import SubjectCard from '../components/SubjectCard';
import FileStatus from '../components/FileStatus';

// Render the homepage: an optional notice (e.g. "SCP-022 has been deleted."),
// the hero section with a "+ New file" button for editors and admins, and a
// grid of SCP entry cards. The cards come from Supabase via the shared
// subjects list.
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
          Select a file below, search for one above, or browse the file index in the sidebar menu.
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
            <SubjectCard entry={entry} key={entry.id} />
          ))}
        </section>
      )}
    </>
  );
}

export default Home;
