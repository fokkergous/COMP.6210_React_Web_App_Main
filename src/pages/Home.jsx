import { Link } from 'react-router-dom';
import scpData from '../data/scpData.json';

const images = import.meta.glob('../assets/scp/*.{jpg,png}', { eager: true, import: 'default' });

// Return the imported image module that matches `filename` (or undefined if not found).
function imageFor(filename) {
  const match = Object.entries(images).find(([path]) => path.endsWith(filename));
  return match ? match[1] : undefined;
}

// Render the homepage: hero section and a grid of SCP entry cards.
function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Field Catalogue — Restricted Access</p>
        <h1>Anomalous Item Index</h1>
        <p className="hero__lede">
          A modernised, record of contained subjects, entities, and objects.
          Select a file below or in the Navbar to open its full containment dossier.
        </p>
      </section>

      <section className="grid" aria-label="Catalogue entries">
        {scpData.map((entry) => (
          <Link to={`/${entry.id}`} className="card" key={entry.id}>
            <div className="card__image-wrap">
              <img src={imageFor(entry.image)} alt={entry.imageAlt} className="card__image" />
            </div>
            <div className="card__body">
              <h2 className="card__item">{entry.item}</h2>
              <p className="card__summary">{entry.summary}</p>
              <span className="card__cta">Open file →</span>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}

export default Home;
