import { getConfig, resetConfig, setConfig } from './config';
import { createConsole, destroyConsole, toggleConsole } from './ui';
import { interceptConsole, setupErrorListeners } from './interceptor';
import { setThemeConfig } from './theme';
import type { ThemeConfig, VirtualConsoleConfig, VirtualConsoleGlobalState, VirtualConsoleInstance } from './types';

let longPressTimer: any = null;
let currentTouchCount = 0;

export const virtualConsoleGlobalStateKey = '__VIRTUAL_CONSOLE_STATE__';

export function getVirtualConsoleGlobalState(): VirtualConsoleGlobalState {
    window[virtualConsoleGlobalStateKey] ??= {};
    return window[virtualConsoleGlobalStateKey];
}

/**
 * Sets up activation gestures
 */
function setupActivation() {
    const clearLongPressTimer = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    // Keyboard shortcut: Shift+C (or configured key)
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.shiftKey && e.code === getConfig().keyboardShortcut) {
            e.preventDefault();
            toggleConsole();
        }
    };

    // Multi-finger long press
    const onTouchStart = (e: TouchEvent) => {
        currentTouchCount = e.touches.length;

        // Clear existing timer when touch count changes
        clearLongPressTimer();

        // Start timer if we have the required finger count
        const config = getConfig();
        if (currentTouchCount === config.longPressFingers) {
            longPressTimer = setTimeout(() => {
                // Verify we still have the correct finger count
                if (currentTouchCount === config.longPressFingers) {
                    toggleConsole();
                }
                longPressTimer = null;
            }, config.longPressDuration);
        }
    };

    const onTouchEnd = (e: TouchEvent) => {
        currentTouchCount = e.touches.length;

        // Cancel timer when any finger lifts
        clearLongPressTimer();

        // Reset touch count when all fingers lift
        if (currentTouchCount === 0) {
            currentTouchCount = 0;
        }
    };

    const onTouchMove = (e: TouchEvent) => {
        currentTouchCount = e.touches.length;

        // Cancel timer if fingers move
        clearLongPressTimer();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
        clearLongPressTimer();
        currentTouchCount = 0;
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('touchstart', onTouchStart);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchmove', onTouchMove);
    };
}

export function installVirtualConsole(
    options?: Partial<VirtualConsoleConfig>,
    theme?: ThemeConfig
): VirtualConsoleInstance {
    const state = getVirtualConsoleGlobalState();

    state.instance?.destroy();

    resetConfig();
    if (options) {
        setConfig(options);
    }

    setThemeConfig(theme || window.__VIRTUAL_CONSOLE_GLOBAL__?.theme);

    const cleanupCallbacks = [
        createConsole(),
        interceptConsole(),
        setupErrorListeners(),
        setupActivation()
    ];

    const instance: VirtualConsoleInstance = {
        destroy() {
            cleanupCallbacks.slice().reverse().forEach((cleanup) => cleanup());
            destroyConsole();
            resetConfig();
            setThemeConfig();
            delete state.instance;
            window.__VIRTUAL_CONSOLE_MOUNTED__ = false;
        }
    };

    state.instance = instance;
    state.options = options;
    state.theme = theme || window.__VIRTUAL_CONSOLE_GLOBAL__?.theme;
    window.__VIRTUAL_CONSOLE_MOUNTED__ = true;

    console.info('Virtual Console initialized');

    return instance;
}

// Initialize
export function mount(options?: Partial<VirtualConsoleConfig>) {
    return installVirtualConsole(options);
}
