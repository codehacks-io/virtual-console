export {
    getVirtualConsoleGlobalState,
    installVirtualConsole,
    toggleConsole,
    virtualConsoleGlobalStateKey
} from './core';

export { getConfig } from './config';

export { formatKeyboardShortcut } from './utils';

export { getBuildId, getVersion } from './version';

export type {
    KeyboardShortcut,
    LogEntry,
    LogType,
    ThemeConfig,
    VirtualConsoleConfig,
    VirtualConsoleGlobalState,
    VirtualConsoleInstance
} from './types';
