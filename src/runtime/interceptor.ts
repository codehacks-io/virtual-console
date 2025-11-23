import { addLog } from './ui';

/**
 * Intercepts console methods
 */
export function interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = function (...args) {
        originalLog.apply(console, args);
        addLog(args, 'log');
    };

    console.error = function (...args) {
        originalError.apply(console, args);
        addLog(args, 'error');
    };

    console.warn = function (...args) {
        originalWarn.apply(console, args);
        addLog(args, 'warn');
    };

    console.info = function (...args) {
        originalInfo.apply(console, args);
        addLog(args, 'info');
    };

    console.debug = function (...args) {
        originalDebug.apply(console, args);
        addLog(args, 'debug');
    };
}

/**
 * Sets up error listeners
 */
export function setupErrorListeners() {
    window.addEventListener('error', (e) => {
        const message = e.filename
            ? `Error in ${e.filename}:${e.lineno}:${e.colno} - ${e.message}`
            : `Error: ${e.message}`;
        addLog([message], 'error');
    }, true);

    window.addEventListener('unhandledrejection', (e) => {
        addLog([`Unhandled Promise Rejection:`, e.reason], 'error');
    });
}
