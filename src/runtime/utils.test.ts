import { describe, expect, it } from 'vitest';
import { formatKeyboardShortcut } from './utils';

describe('formatKeyboardShortcut', () => {
    it('formats the default Shift+C shortcut', () => {
        expect(formatKeyboardShortcut({ code: 'KeyC', shiftKey: true })).toBe('Shift+C');
    });

    it('formats every modifier in a consistent order', () => {
        expect(
            formatKeyboardShortcut({ code: 'KeyD', ctrlKey: true, altKey: true, shiftKey: true, metaKey: true })
        ).toBe('Ctrl+Alt+Shift+Meta+D');
    });

    it('formats a bare key with no modifiers', () => {
        expect(formatKeyboardShortcut({ code: 'F8' })).toBe('F8');
    });

    it('strips the Digit prefix', () => {
        expect(formatKeyboardShortcut({ code: 'Digit1', ctrlKey: true })).toBe('Ctrl+1');
    });

    it('leaves unrecognized codes as-is', () => {
        expect(formatKeyboardShortcut({ code: 'Space' })).toBe('Space');
    });

    it('returns null for a disabled shortcut', () => {
        expect(formatKeyboardShortcut(null)).toBeNull();
        expect(formatKeyboardShortcut(undefined)).toBeNull();
    });
});
