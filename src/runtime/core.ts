import { getConfig, setConfig } from './config';
import { createConsole, toggleConsole } from './ui';
import { interceptConsole, setupErrorListeners } from './interceptor';
import { VirtualConsoleConfig } from './types';

let longPressTimer: any = null;
let currentTouchCount = 0;

/**
 * Sets up activation gestures
 */
function setupActivation() {
    // Keyboard shortcut: Shift+C (or configured key)
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.code === getConfig().keyboardShortcut) {
            e.preventDefault();
            toggleConsole();
        }
    });

    // Multi-finger long press
    document.addEventListener('touchstart', (e) => {
        currentTouchCount = e.touches.length;

        // Clear existing timer when touch count changes
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

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
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        currentTouchCount = e.touches.length;

        // Cancel timer when any finger lifts
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }

        // Reset touch count when all fingers lift
        if (currentTouchCount === 0) {
            currentTouchCount = 0;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        currentTouchCount = e.touches.length;

        // Cancel timer if fingers move
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }, { passive: true });
}

// Initialize
export function mount(options?: Partial<VirtualConsoleConfig>) {
    // Prevent multiple mounts
    if (window.__VIRTUAL_CONSOLE_MOUNTED__) return;
    window.__VIRTUAL_CONSOLE_MOUNTED__ = true;

    if (options) {
        setConfig(options);
    }

    console.log("Injecting virtual console...");
    createConsole();
    interceptConsole();
    setupErrorListeners();
    setupActivation();
}
