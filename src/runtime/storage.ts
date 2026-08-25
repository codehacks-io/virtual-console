/**
 * All localStorage access goes through here: consistently namespaced keys,
 * and safe on the server (SSR) and in environments where storage access
 * throws (Safari private mode, disabled cookies, etc.).
 */

const KEY_PREFIX = 'virtual-console:';

export const STORAGE_KEYS = {
    theme: `${KEY_PREFIX}theme`,
    replHistory: `${KEY_PREFIX}repl-history`,
    dockPosition: `${KEY_PREFIX}dock-position`,
    dockWidth: `${KEY_PREFIX}dock-width`,
    dockHeight: `${KEY_PREFIX}dock-height`
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getStorageItem(key: StorageKey): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setStorageItem(key: StorageKey, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage unavailable (private mode, quota, disabled) - ignore.
    }
}
