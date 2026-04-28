import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { installVirtualConsole } from '@codehacks/virtual-console';
import '@codehacks/virtual-console/styles.css';
import './styles.css';

function App() {
    useEffect(() => {
        const virtualConsole = installVirtualConsole({
            maxLogs: 50
        });

        return () => virtualConsole.destroy();
    }, []);

    return (
        <main>
            <h1>Published Package Import</h1>
            <p>This app imports the virtual console from the npm package, not the local workspace.</p>
            <p>Press <code>Shift+C</code> or long-press with two fingers to toggle the console.</p>
            <div className="actions">
                <button onClick={() => console.log('Packaged import log', { source: 'npm' })}>Log object</button>
                <button onClick={() => console.warn('Packaged import warning')}>Warn</button>
                <button onClick={() => console.error('Packaged import error')}>Error</button>
                <button onClick={() => { throw new Error('Packaged import thrown error'); }}>Throw error</button>
            </div>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
