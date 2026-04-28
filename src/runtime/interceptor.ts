import { addLog } from './ui';
import type { LogType } from './types';

type ConsoleMethod = 'log' | 'error' | 'warn' | 'info' | 'debug';

let restoreConsole: (() => void) | null = null;

/**
 * Intercepts console methods
 */
export function interceptConsole() {
    if (restoreConsole) {
        return restoreConsole;
    }

    const originalMethods: Record<ConsoleMethod, (...args: any[]) => void> = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };

    const intercept = (method: ConsoleMethod, type: LogType) => {
        console[method] = function (...args: any[]) {
            originalMethods[method].apply(console, args);
            addLog(args, type);
        };
    };

    intercept('log', 'log');
    intercept('error', 'error');
    intercept('warn', 'warn');
    intercept('info', 'info');
    intercept('debug', 'debug');

    restoreConsole = () => {
        console.log = originalMethods.log;
        console.error = originalMethods.error;
        console.warn = originalMethods.warn;
        console.info = originalMethods.info;
        console.debug = originalMethods.debug;
        restoreConsole = null;
    };

    return restoreConsole;
}

/**
 * Sets up error listeners
 */
export function setupErrorListeners() {
    const onError = (e: ErrorEvent) => {
        const message = e.filename
            ? `Error in ${e.filename}:${e.lineno}:${e.colno} - ${e.message}`
            : `Error: ${e.message}`;
        addLog([message], 'error');
    };

    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
        addLog([`Unhandled Promise Rejection:`, e.reason], 'error');
    };

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
        window.removeEventListener('error', onError, true);
        window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
}
