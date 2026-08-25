import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
    return (
        <main>
            <h1>Local Workspace Plugin</h1>
            <p>The Vite plugin injects the virtual console before the React app mounts.</p>
            <p>Press <code>Shift+C</code> or long-press with two fingers to toggle the console.</p>
            <div className="actions">
                <button onClick={() => console.log('Local plugin log', { source: 'workspace' })}>Log object</button>
                <button onClick={() => console.warn('Local plugin warning')}>Warn</button>
                <button onClick={() => console.error('Local plugin error')}>Error</button>
                <button onClick={() => { throw new Error('Local plugin thrown error'); }}>Throw error</button>
            </div>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
