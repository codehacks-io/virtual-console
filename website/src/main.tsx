import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root')!;
const app = (
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// The build's prerender step (see scripts/prerender.mjs) fills #root with
// real markup, so a production/preview load must hydrate it rather than
// throw it away and render from scratch. In dev, index.html is served as-is
// (no prerender step runs), so #root starts empty and needs a normal render.
if (rootEl.hasChildNodes()) {
    ReactDOM.hydrateRoot(rootEl, app);
} else {
    ReactDOM.createRoot(rootEl).render(app);
}
