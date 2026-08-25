import type { VirtualConsoleConfig } from './types';

function getDefaultMaxHeight() {
    return typeof window === 'undefined' ? 600 : window.innerHeight * 0.8;
}

function getDefaultMaxWidth() {
    return typeof window === 'undefined' ? 600 : window.innerWidth * 0.8;
}

export const DEFAULT_CONFIG: VirtualConsoleConfig = {
    maxLogs: 100,
    minHeight: 100,
    maxHeight: getDefaultMaxHeight(),
    defaultHeight: 200,
    minWidth: 200,
    maxWidth: getDefaultMaxWidth(),
    defaultWidth: 400,
    keyboardShortcut: { code: 'KeyC', shiftKey: true }, // Shift+C to toggle
    longPressFingers: 2, // amount of fingers long press to toggle
    longPressDuration: 500, // milliseconds to hold fingers to toggle
    replEnabled: true,
    replHistoryLimit: 50,
    targetElement: undefined
};

let activeConfig: VirtualConsoleConfig = { ...DEFAULT_CONFIG };

/**
 * Returns the active config. Shallow copy only - do not mutate the result
 * or any nested value (e.g. keyboardShortcut); treat it as read-only.
 */
export function getConfig(): VirtualConsoleConfig {
    return { ...activeConfig };
}

export function setConfig(options: Partial<VirtualConsoleConfig>) {
    activeConfig = { ...activeConfig, ...options };
}

export function resetConfig() {
    activeConfig = { ...DEFAULT_CONFIG, maxHeight: getDefaultMaxHeight(), maxWidth: getDefaultMaxWidth() };
}
