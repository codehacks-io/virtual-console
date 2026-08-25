import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { installVirtualConsole } from '@codehacks/virtual-console';
import '@codehacks/virtual-console/styles.css';
import './styles.css';

function DemoActions() {
    return (
        <div className="actions">
            <button onClick={() => console.log('Local import log', { source: 'workspace' })}>Log object</button>
            <button onClick={() => console.warn('Local import warning')}>Warn</button>
            <button onClick={() => console.error('Local import error')}>Error</button>
            <button onClick={() => { throw new Error('Local import thrown error'); }}>Throw error</button>
        </div>
    );
}

function App() {
    useEffect(() => {
        const virtualConsole = installVirtualConsole({
            maxLogs: 50
        });

        return () => virtualConsole.destroy();
    }, []);

    return (
        <main>
            <h1>Local Workspace Import</h1>
            <p>This app imports and installs the virtual console explicitly from the workspace package.</p>
            <p>Press <code>Shift+C</code> or long-press with two fingers to toggle the console.</p>
            <DemoActions />
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
