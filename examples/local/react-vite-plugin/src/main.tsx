import React from 'react';
import ReactDOM from 'react-dom/client';
import { formatKeyboardShortcut, getConfig } from '@codehacks/virtual-console';
import './styles.css';

function App() {
    // The Vite plugin injects and installs the console before this component
    // ever renders, so the config is already live - no effect/state needed.
    const config = getConfig();
    const shortcut = formatKeyboardShortcut(config.keyboardShortcut);

    return (
        <main>
            <h1>Local Workspace Plugin</h1>
            <p>The Vite plugin injects the virtual console before the React app mounts.</p>
            <p>
                {shortcut ? <>Press <code>{shortcut}</code> or long-press</> : 'Long-press'}
                {' '}with {config.longPressFingers} finger{config.longPressFingers === 1 ? '' : 's'} to toggle the console.
            </p>
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
