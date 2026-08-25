import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { formatKeyboardShortcut, getConfig, installVirtualConsole } from '@codehacks/virtual-console';
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
    const [activationHint, setActivationHint] = useState<{ shortcut: string | null; fingers: number } | null>(null);

    useEffect(() => {
        const virtualConsole = installVirtualConsole({
            maxLogs: 50
        });

        const config = getConfig();
        setActivationHint({ shortcut: formatKeyboardShortcut(config.keyboardShortcut), fingers: config.longPressFingers });

        return () => virtualConsole.destroy();
    }, []);

    return (
        <main>
            <h1>Local Workspace Import</h1>
            <p>This app imports and installs the virtual console explicitly from the workspace package.</p>
            {activationHint && (
                <p>
                    {activationHint.shortcut ? <>Press <code>{activationHint.shortcut}</code> or long-press</> : 'Long-press'}
                    {' '}with {activationHint.fingers} finger{activationHint.fingers === 1 ? '' : 's'} to toggle the console.
                </p>
            )}
            <DemoActions />
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
