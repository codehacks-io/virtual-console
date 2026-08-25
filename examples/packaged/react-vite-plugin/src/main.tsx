import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
    return (
        <main>
            <h1>Published Package Plugin</h1>
            <p>The Vite plugin is imported from the npm package and injects the virtual console.</p>
            <p>Press <code>Shift+C</code> or long-press with two fingers to toggle the console.</p>
            <div className="actions">
                <button onClick={() => console.log('Packaged plugin log', { source: 'npm' })}>Log object</button>
                <button onClick={() => console.warn('Packaged plugin warning')}>Warn</button>
                <button onClick={() => console.error('Packaged plugin error')}>Error</button>
                <button onClick={() => { throw new Error('Packaged plugin thrown error'); }}>Throw error</button>
            </div>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
