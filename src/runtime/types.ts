export interface VirtualConsoleConfig {
    maxLogs: number;
    minHeight: number;
    maxHeight: number;
    defaultHeight: number;
    keyboardShortcut: string;
    longPressFingers: number;
    longPressDuration: number;
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
    interface Window {
        __VIRTUAL_CONSOLE_GLOBAL__?: {
            theme: ThemeConfig;
            options: Partial<VirtualConsoleConfig>;
        };
        __VIRTUAL_CONSOLE_STATE__?: VirtualConsoleGlobalState;
        __VIRTUAL_CONSOLE_MOUNTED__?: boolean;
    }
}
