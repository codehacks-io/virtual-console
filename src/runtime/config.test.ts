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
});
