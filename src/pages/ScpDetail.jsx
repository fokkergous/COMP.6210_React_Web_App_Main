import { useParams, Link } from 'react-router-dom';
import { useSubject } from '../hooks/useSubject';
import { useSubjects } from '../context/SubjectsContext';
import Redacted from '../components/Redacted';
import SubjectImage from '../components/SubjectImage';
import FileStatus from '../components/FileStatus';
import NotFound from './NotFound';

// Render the detailed dossier for a single SCP entry based on the URL `id`
// (the subject's slug, e.g. /scp-002). The full file is fetched from
// Supabase; optional sections are only shown when the subject has them.
function ScpDetail() {
  const { id } = useParams();
  const { subject: entry, loading, error, reload } = useSubject(id);
  const { subjects } = useSubjects();

  if (loading) {
    return <FileStatus type="loading" message={`Retrieving file ${id.toUpperCase()}…`} />;
  }
  if (error) {
    return (
      <FileStatus
        type="error"
        message="This file could not be retrieved. Check your connection and try again."
        onRetry={reload}
      />
    );
  }
  // Loaded without error but nothing matched the slug.
  if (!entry) {
    return <NotFound />;
  }

  // Previous / next links follow the catalogue order and wrap around.
  // Hidden until the shared list has loaded.
  const index = subjects.findIndex((s) => s.id === entry.id);
  const hasPager = index !== -1 && subjects.length > 1;
  const prev = hasPager && subjects[(index - 1 + subjects.length) % subjects.length];
  const next = hasPager && subjects[(index + 1) % subjects.length];

  return (
    <article className="dossier">
      <Link to="/" className="dossier__back">
        ← Back to index
      </Link>

      <header className="dossier__header">
        <div className="dossier__heading">
          <p className="eyebrow">Item #</p>
          <h1>{entry.item}</h1>
        </div>
        {/* tone (green / amber / red) comes from the object_classes table. */}
        <p className={`class-label class-label--${entry.tone || 'amber'}`}>
          <span className="class-label__tag">Object Class</span>
          {entry.objectClass}
        </p>
      </header>

      <SubjectImage src={entry.image} alt={entry.imageAlt} className="dossier__image" />

      <section className="dossier__section">
        <h2>Special Containment Procedures</h2>
        {entry.containmentProcedures.map((p, i) => (
          <p key={i}><Redacted text={p} /></p>
        ))}
      </section>

      <section className="dossier__section">
        <h2>Description</h2>
        {entry.description.map((p, i) => (
          <p key={i}><Redacted text={p} /></p>
        ))}
      </section>

      {entry.chronology && (
        <section className="dossier__section">
          <h2>Chronology</h2>
          <ol className="chronology">
            {entry.chronology.map((row, i) => (
              <li key={i}>
                {/* Already formatted as DD/MM/YYYY in lib/subjects.js */}
                <span className="chronology__date">{row.date}</span>
                <span className="chronology__text"><Redacted text={row.text} /></span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {entry.addenda && (
        <section className="dossier__section">
          <h2>Addenda</h2>
          {entry.addenda.map((add) => (
            <div className="addendum" key={add.id}>
              <h3>{add.title}</h3>
              <p><Redacted text={add.text} /></p>
            </div>
          ))}
        </section>
      )}

      {entry.reference && (
        <section className="dossier__section">
          <h2>Reference</h2>
          {entry.reference.map((p, i) => (
            <p key={i}><Redacted text={p} /></p>
          ))}
        </section>
      )}

      {entry.additionalNotes && (
        <section className="dossier__section">
          <h2>Additional Notes</h2>
          {entry.additionalNotes.map((p, i) => (
            <p key={i}><Redacted text={p} /></p>
          ))}
        </section>
      )}

      {entry.appendix && (
        <section className="dossier__section">
          <h2>{entry.appendix.title}</h2>
          <p><Redacted text={entry.appendix.text} /></p>
        </section>
      )}

      {entry.fieldReport && (
        <section className="dossier__section dossier__section--report">
          <h2>{entry.fieldReport.title}</h2>
          <p className="field-report__intro">{entry.fieldReport.intro}</p>
          {entry.fieldReport.entries.map((p, i) => (
            <p className="field-report__entry" key={i}><Redacted text={p} /></p>
          ))}
        </section>
      )}

      {hasPager && (
        <nav className="dossier__pager" aria-label="Adjacent files">
          <Link to={`/${prev.id}`} className="dossier__pager-link">
            <span className="eyebrow">Previous</span>
            <span>{prev.item}</span>
          </Link>
          <Link to={`/${next.id}`} className="dossier__pager-link dossier__pager-link--next">
            <span className="eyebrow">Next</span>
            <span>{next.item}</span>
          </Link>
        </nav>
      )}
    </article>
  );
}

export default ScpDetail;
