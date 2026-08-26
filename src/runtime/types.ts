/**
 * A keyboard shortcut used to toggle the console. `code` is a
 * `KeyboardEvent.code` value (e.g. `'KeyC'`, `'F8'`). Modifiers default to
 * `false` when omitted, so every modifier that should be held down must be
 * listed explicitly - this keeps matching exact and avoids the console
 * popping open on an unrelated combination that happens to share a key.
 */
export interface KeyboardShortcut {
    code: string;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
}

export interface VirtualConsoleConfig {
    maxLogs: number;
    minHeight: number;
    maxHeight: number;
    defaultHeight: number;
    minWidth: number;
    maxWidth: number;
    defaultWidth: number;
    /**
     * Toggles the console. Set to `null` to disable the keyboard shortcut
     * entirely (e.g. if it conflicts with the host app and you only want
     * the long-press gesture on mobile).
     */
    keyboardShortcut: KeyboardShortcut | null;
    longPressFingers: number;
    longPressDuration: number;
    /**
     * Enables the REPL input (arbitrary code evaluation via `eval`). Set to
     * `false` to ship a read-only log viewer with no eval surface - e.g. for
     * builds that might reach production.
     */
    replEnabled: boolean;
    /**
     * Number of REPL commands kept in history (persisted to localStorage).
     */
    replHistoryLimit: number;
    targetElement?: HTMLElement;
}

export interface ThemeConfig {
    availableThemes: string[];
    defaultTheme: string;
}

export interface VirtualConsoleInstance {
    destroy(): void;
}

export interface VirtualConsoleGlobalState {
    instance?: VirtualConsoleInstance;
    options?: Partial<VirtualConsoleConfig>;
    theme?: ThemeConfig;
}

export type LogType = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'command' | 'result';

export interface LogEntry {
    type: LogType;
    args: any[];
    timestamp: string;
}

declare global {
    /**
     * Package version, baked in by tsup's `define` (see tsup.config.ts).
     * Guard with `typeof __VC_VERSION__ !== 'undefined'` (see ui.ts) - not
     * set outside that build step (e.g. importing source directly).
     */
    const __VC_VERSION__: string;

    /**
     * Short git commit hash this build came from, `''` if unavailable at
     * build time - see tsup.config.ts. Same typeof-guard rule as
     * __VC_VERSION__.
     */
    const __VC_GIT_HASH__: string;

    /** Whether the working tree had uncommitted changes at build time. */
    const __VC_GIT_DIRTY__: boolean;

    interface Window {
        __VIRTUAL_CONSOLE_GLOBAL__?: {
            theme: ThemeConfig;
            options: Partial<VirtualConsoleConfig>;
        };
        __VIRTUAL_CONSOLE_STATE__?: VirtualConsoleGlobalState;
    }
}
