import { installVirtualConsole } from './core';

// Auto-mount when loaded as a script
installVirtualConsole(window.__VIRTUAL_CONSOLE_GLOBAL__?.options);
