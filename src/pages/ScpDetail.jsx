import { useParams, Link, Navigate } from 'react-router-dom';
import scpData from '../data/scpData.json';
import Redacted from '../components/Redacted';

const images = import.meta.glob('../assets/scp/*.{jpg,png}', { eager: true, import: 'default' });

const CLASS_TONE = {
  Safe: 'green',
  Euclid: 'amber',
  Keter: 'red',
};

// Return the imported image module that matches `filename` (or undefined if not found).
function imageFor(filename) {
  const match = Object.entries(images).find(([path]) => path.endsWith(filename));
  return match ? match[1] : undefined;
}

// Render the detailed dossier for a single SCP entry based on the URL `id`.
// Shows containment procedures, description, chronology, addenda, references, and navigation.
function ScpDetail() {
  const { id } = useParams();
  const index = scpData.findIndex((entry) => entry.id === id);
  const entry = scpData[index];

  if (!entry) {
    return <Navigate to="/" replace />;
  }

  const prev = scpData[(index - 1 + scpData.length) % scpData.length];
  const next = scpData[(index + 1) % scpData.length];

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
        <p className={`class-label class-label--${CLASS_TONE[entry.objectClass] || 'amber'}`}>
          <span className="class-label__tag">Object Class</span>
          {entry.objectClass}
        </p>
      </header>

      <img
        src={imageFor(entry.image)}
        alt={entry.imageAlt}
        className="dossier__image"
      />

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
          {entry.addenda.map((add, i) => (
            <div className="addendum" key={i}>
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
    </article>
  );
}

export default ScpDetail;
