// Entry point: mounts the React app into the <div id="root"> in index.html.
// Global styles (index.css) are loaded here so they apply to every page.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// StrictMode adds extra checks in development only (for example, running
// effects twice to expose missing cleanup). It has no effect on the live site.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
