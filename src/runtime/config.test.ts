import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, getConfig, resetConfig, setConfig } from './config';

describe('config', () => {
    beforeEach(() => {
        resetConfig();
    });

    it('starts with the default config', () => {
        expect(getConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('merges partial overrides on top of the current config', () => {
        setConfig({ maxLogs: 42 });

        expect(getConfig().maxLogs).toBe(42);
        expect(getConfig().minHeight).toBe(DEFAULT_CONFIG.minHeight);
    });

    it('applies overrides cumulatively across multiple calls', () => {
        setConfig({ maxLogs: 42 });
        setConfig({ minHeight: 10 });

        expect(getConfig().maxLogs).toBe(42);
        expect(getConfig().minHeight).toBe(10);
    });

    it('restores every field back to the defaults', () => {
        setConfig({ maxLogs: 42, minHeight: 10 });
        resetConfig();

        expect(getConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('defaults the keyboard shortcut to Shift+C', () => {
        expect(DEFAULT_CONFIG.keyboardShortcut).toEqual({ code: 'KeyC', shiftKey: true });
    });

    it('allows disabling the keyboard shortcut entirely', () => {
        setConfig({ keyboardShortcut: null });

        expect(getConfig().keyboardShortcut).toBeNull();
    });

    it('defaults the REPL to enabled with a 50-command history limit', () => {
        expect(DEFAULT_CONFIG.replEnabled).toBe(true);
        expect(DEFAULT_CONFIG.replHistoryLimit).toBe(50);
    });

    it('allows disabling the REPL', () => {
        setConfig({ replEnabled: false });

        expect(getConfig().replEnabled).toBe(false);
    });

    it('defaults width bounds alongside the existing height bounds', () => {
        expect(DEFAULT_CONFIG.defaultWidth).toBe(400);
        expect(DEFAULT_CONFIG.minWidth).toBe(200);
        expect(DEFAULT_CONFIG.maxWidth).toBeGreaterThan(DEFAULT_CONFIG.minWidth);
    });

    it('returns a copy, so top-level reassignment does not affect internal state', () => {
        const config = getConfig();
        config.maxLogs = 999999;

        expect(getConfig().maxLogs).toBe(DEFAULT_CONFIG.maxLogs);
    });
});
