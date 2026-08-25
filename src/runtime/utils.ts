import type { KeyboardShortcut } from './types';

/**
 * Formats a timestamp
 */
export function getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Gets the constructor name or type of a value
 */
export function getType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'Array';
    if (value instanceof Map) return 'Map';
    if (value instanceof Set) return 'Set';
    if (value instanceof Date) return 'Date';
    if (value instanceof RegExp) return 'RegExp';
    if (value instanceof Error) return 'Error';
    if (typeof value === 'object') {
        return value.constructor ? value.constructor.name : 'Object';
    }
    return typeof value;
}

/**
 * Gets the size/length of a collection
 */
export function getSize(value: any): number | null {
    if (Array.isArray(value)) return value.length;
    if (value instanceof Map || value instanceof Set) return value.size;
    if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length;
    }
    return null;
}

/**
 * Debounces a function, delaying invocation until `wait` ms after the last call
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Turns a `KeyboardEvent.code` into a short human-readable label,
 * e.g. 'KeyD' -> 'D', 'Digit1' -> '1', 'F8' -> 'F8'.
 */
function formatKeyCode(code: string): string {
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    return code;
}

/**
 * Formats a keyboard shortcut config into readable text, e.g.
 * { code: 'KeyD', ctrlKey: true, shiftKey: true } -> 'Ctrl+Shift+D'.
 * Returns null for a disabled shortcut (`null`/`undefined`), so callers can
 * render UI that adapts when no keyboard shortcut is configured at all.
 */
export function formatKeyboardShortcut(shortcut: KeyboardShortcut | null | undefined): string | null {
    if (!shortcut) return null;

    const modifiers: string[] = [];
    if (shortcut.ctrlKey) modifiers.push('Ctrl');
    if (shortcut.altKey) modifiers.push('Alt');
    if (shortcut.shiftKey) modifiers.push('Shift');
    if (shortcut.metaKey) modifiers.push('Meta');

    return [...modifiers, formatKeyCode(shortcut.code)].join('+');
}
