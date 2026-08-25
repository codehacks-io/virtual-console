import { getConfig, resetConfig, setConfig } from './config';
import { createConsole, destroyConsole, toggleConsole } from './ui';
import { interceptConsole, setupErrorListeners } from './interceptor';
import { setThemeConfig } from './theme';
import type { ThemeConfig, VirtualConsoleConfig, VirtualConsoleGlobalState, VirtualConsoleInstance } from './types';

export { toggleConsole } from './ui';

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let currentTouchCount = 0;

/**
 * True when the shortcut shouldn't fire because the user is actively typing
 * in a form field (the host app's, or the console's own REPL input) - this
 * is what keeps the shortcut from hijacking keystrokes the app being
 * debugged relies on.
 */
function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

function matchesShortcut(e: KeyboardEvent, shortcut: VirtualConsoleConfig['keyboardShortcut']): boolean {
    if (!shortcut) return false;
    return (
        e.code === shortcut.code &&
        e.shiftKey === !!shortcut.shiftKey &&
        e.ctrlKey === !!shortcut.ctrlKey &&
        e.altKey === !!shortcut.altKey &&
        e.metaKey === !!shortcut.metaKey
    );
}

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

    // Keyboard shortcut (configurable, defaults to Shift+C)
    const onKeyDown = (e: KeyboardEvent) => {
        if (isEditableTarget(e.target)) return;
        if (matchesShortcut(e, getConfig().keyboardShortcut)) {
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
            cleanupCallbacks.toReversed().forEach((cleanup) => cleanup());
            destroyConsole();
            resetConfig();
            setThemeConfig();
            delete state.instance;
        }
    };

    state.instance = instance;
    state.options = options;
    state.theme = theme || window.__VIRTUAL_CONSOLE_GLOBAL__?.theme;

    console.info('Virtual Console initialized');

    return instance;
}
