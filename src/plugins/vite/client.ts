/// <reference types="vite/client" />

// Imported by package name and marked external in tsup.config.ts so this
// resolves to the app's own module instance at runtime, instead of getting
// bundled as a separate copy with its own isolated state.
import { getVirtualConsoleGlobalState, installVirtualConsole } from '@codehacks/virtual-console';
import type { ThemeConfig, VirtualConsoleConfig } from '@codehacks/virtual-console';
import { virtualConsoleOptionsElementId } from './constants';

interface VirtualConsoleInjectedOptions {
    options?: Partial<VirtualConsoleConfig>;
    theme?: ThemeConfig;
}

function readVirtualConsoleOptions(): VirtualConsoleInjectedOptions {
    const element = document.getElementById(virtualConsoleOptionsElementId);

    if (!element?.textContent) {
        return {};
    }

    try {
        return JSON.parse(element.textContent) as VirtualConsoleInjectedOptions;
    } catch (error) {
        console.warn('[virtual-console] Failed to parse Vite plugin options.', error);
        return {};
    }
}

function installInjectedVirtualConsole() {
    const injectedOptions = readVirtualConsoleOptions();
    const state = getVirtualConsoleGlobalState();

    state.instance?.destroy();
    state.options = injectedOptions.options;
    state.theme = injectedOptions.theme;
    state.instance = installVirtualConsole(injectedOptions.options, injectedOptions.theme);

    return state;
}

const virtualConsoleState = installInjectedVirtualConsole();

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        virtualConsoleState.instance?.destroy();
        delete virtualConsoleState.instance;
    });

    import.meta.hot.accept();
}
