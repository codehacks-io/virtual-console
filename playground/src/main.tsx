import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    const logInfo = () => console.log('Hello from Virtual Console!', { foo: 'bar', list: [1, 2, 3] });
    const logWarn = () => console.warn('This is a warning message');
    const logError = () => console.error('This is an error message');
    const logComplex = () => {
        const map = new Map();
        map.set('key1', 'value1');
        map.set({ id: 1 }, ['a', 'b']);

        const set = new Set();
        set.add(1);
        set.add({ nested: true });

        const circular: any = { name: 'Circular' };
        circular.self = circular;

        console.log('Complex Object:', {
            map,
            set,
            circular,
            date: new Date(),
            regex: /test/g,
            fn: function myFunc() { }
        });
    };

    const throwError = () => {
        throw new Error('This is a thrown error!');
    };

    const throwAsyncError = async () => {
        throw new Error('This is an async error!');
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <h1>Virtual Console Playground</h1>
            <p>Press <code>Shift+C</code> or long-press (2 fingers) to toggle the console.</p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={logInfo}>Log Info</button>
                <button onClick={logWarn}>Log Warn</button>
                <button onClick={logError}>Log Error</button>
                <button onClick={logComplex}>Log Complex Object</button>
                <button onClick={throwError}>Throw Error</button>
                <button onClick={throwAsyncError}>Throw Async Error</button>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h2>Styled Logs</h2>
                <button onClick={() => console.log('%cStyled Text', 'color: purple; font-size: 20px; font-weight: bold')}>
                    Log Styled Text
                </button>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
