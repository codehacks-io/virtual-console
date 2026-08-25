import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from './storage';
import { cycleTheme, getThemeConfig, initThemeIndex, loadSavedTheme, setThemeConfig } from './theme';

describe('theme', () => {
    beforeEach(() => {
        localStorage.clear();
        setThemeConfig();
    });

    it('defaults to all shipped themes with vscode first', () => {
        const config = getThemeConfig();

        expect(config.availableThemes).toEqual(['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo']);
        expect(config.defaultTheme).toBe('vscode');
    });

    it('accepts a custom theme config', () => {
        setThemeConfig({ availableThemes: ['nord', 'tokyo'], defaultTheme: 'nord' });

        expect(getThemeConfig()).toEqual({ availableThemes: ['nord', 'tokyo'], defaultTheme: 'nord' });
    });

    it('falls back to the default theme when nothing is saved', () => {
        expect(loadSavedTheme()).toBe('vscode');
    });

    it('falls back to the default theme when the saved value is not available', () => {
        localStorage.setItem(STORAGE_KEYS.theme, 'not-a-real-theme');

        expect(loadSavedTheme()).toBe('vscode');
    });

    it('returns the saved theme when it is still available', () => {
        localStorage.setItem(STORAGE_KEYS.theme, 'dracula');

        expect(loadSavedTheme()).toBe('dracula');
    });

    it('cycles to the next theme and persists the choice', () => {
        const container = document.createElement('div');
        container.classList.add('theme-vscode');

        cycleTheme(container);

        expect(container.classList.contains('theme-vscode')).toBe(false);
        expect(container.classList.contains('theme-chrome-light')).toBe(true);
        expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('chrome-light');
    });

    it('wraps back to the first theme after the last one', () => {
        const container = document.createElement('div');
        container.classList.add('theme-vscode');

        for (let i = 0; i < 5; i++) {
            cycleTheme(container);
        }

        expect(container.classList.contains('theme-vscode')).toBe(true);
    });

    it('does not cycle when only one theme is available', () => {
        setThemeConfig({ availableThemes: ['vscode'], defaultTheme: 'vscode' });
        const container = document.createElement('div');
        container.classList.add('theme-vscode');

        cycleTheme(container);

        expect(container.classList.contains('theme-vscode')).toBe(true);
    });

    it('initializes the theme index from the saved preference', () => {
        localStorage.setItem(STORAGE_KEYS.theme, 'nord');

        expect(initThemeIndex()).toBe('nord');
    });
});
