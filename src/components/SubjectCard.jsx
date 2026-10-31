import { Link } from 'react-router-dom';
import SubjectImage from './SubjectImage';

// One catalogue card: image, item number and summary, linking to the
// subject's dossier. Shared by the Home page grid and the search results
// (added in v1.2.0 so both pages use the same card).
//
//   entry  a subject from lib/subjects.js: { id, item, summary, image, imageAlt }
function SubjectCard({ entry }) {
  return (
    <Link to={`/${entry.id}`} className="card">
      <div className="card__image-wrap">
        <SubjectImage src={entry.image} alt={entry.imageAlt} className="card__image" />
      </div>
      <div className="card__body">
        <h2 className="card__item">{entry.item}</h2>
        <p className="card__summary">{entry.summary}</p>
        <span className="card__cta">Open file →</span>
      </div>
    </Link>
  );
}

export default SubjectCard;
