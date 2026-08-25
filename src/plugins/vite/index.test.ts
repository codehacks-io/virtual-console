import { describe, expect, it } from 'vitest';
import { virtualConsoleVitePlugin } from './index';

describe('virtualConsoleVitePlugin', () => {
    it('throws when no themes are provided', () => {
        expect(() => virtualConsoleVitePlugin({ themes: [] })).toThrow(/at least one theme/i);
    });

    it('throws when an invalid theme is provided', () => {
        expect(() => virtualConsoleVitePlugin({ themes: ['not-a-real-theme' as any] })).toThrow(/invalid theme/i);
    });

    it('returns a named Vite plugin when themes are valid', () => {
        const plugin = virtualConsoleVitePlugin({ themes: ['vscode', 'dracula'] });

        expect(plugin.name).toBe('virtual-console:vite');
        expect(typeof plugin.transformIndexHtml).toBe('function');
        expect(typeof plugin.configureServer).toBe('function');
    });
});
