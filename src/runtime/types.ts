export interface VirtualConsoleConfig {
    maxLogs: number;
    minHeight: number;
    maxHeight: number;
    defaultHeight: number;
    keyboardShortcut: string;
    longPressFingers: number;
    longPressDuration: number;
}

export interface ThemeConfig {
    availableThemes: string[];
    defaultTheme: string;
}

export type LogType = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'repl-input' | 'repl-output';

export interface LogEntry {
    type: LogType;
    args: any[];
    timestamp: string;
}

declare global {
    interface Window {
        __VIRTUAL_CONSOLE_CONFIG__?: ThemeConfig;
    }
}
