import { beforeEach, describe, expect, it } from 'vitest';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('round-trips a value through localStorage under the namespaced key', () => {
        setStorageItem(STORAGE_KEYS.theme, 'dracula');

        expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dracula');
        expect(getStorageItem(STORAGE_KEYS.theme)).toBe('dracula');
    });

    it('returns null for a key that was never set', () => {
        expect(getStorageItem(STORAGE_KEYS.dockPosition)).toBeNull();
    });

    it('namespaces every key so instances/apps sharing an origin cannot collide', () => {
        expect(Object.values(STORAGE_KEYS).every(key => key.startsWith('virtual-console:'))).toBe(true);
    });
});
