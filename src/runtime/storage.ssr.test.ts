// @vitest-environment node
//
// Regression test for the SSR crash: `ui.ts` used to call `localStorage`
// directly at module scope, which throws immediately on import in any
// environment without a `window` (Next.js/Remix server rendering, etc.).
// Running this file under Node (no jsdom) reproduces that environment.
import { describe, expect, it } from 'vitest';

describe('storage (no window/DOM)', () => {
    it('importing the runtime does not throw when window is unavailable', async () => {
        await expect(import('./storage')).resolves.toBeDefined();
        await expect(import('./ui')).resolves.toBeDefined();
        await expect(import('./index')).resolves.toBeDefined();
    });

    it('getStorageItem/setStorageItem are no-ops instead of throwing', async () => {
        const { getStorageItem, setStorageItem, STORAGE_KEYS } = await import('./storage');

        expect(() => setStorageItem(STORAGE_KEYS.theme, 'dracula')).not.toThrow();
        expect(getStorageItem(STORAGE_KEYS.theme)).toBeNull();
    });
});
