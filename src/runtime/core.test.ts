import { afterEach, describe, expect, it } from 'vitest';
import { getVirtualConsoleGlobalState, installVirtualConsole } from './core';
import type { VirtualConsoleInstance } from './types';

describe('installVirtualConsole', () => {
    let instance: VirtualConsoleInstance | undefined;

    afterEach(() => {
        instance?.destroy();
        instance = undefined;
        document.body.innerHTML = '';
    });

    it('mounts the console container into the DOM', () => {
        instance = installVirtualConsole();

        expect(document.querySelector('.virtual-console-container')).not.toBeNull();
    });

    it('marks the console as mounted in the global state', () => {
        instance = installVirtualConsole();

        expect(getVirtualConsoleGlobalState().instance).toBe(instance);
    });

    it('toggles visibility on Shift+C', () => {
        instance = installVirtualConsole();
        const container = document.querySelector('.virtual-console-container') as HTMLElement;

        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', shiftKey: true }));

        expect(container.classList.contains('virtual-console-visible')).toBe(true);
    });

    it('does not toggle without the Shift modifier', () => {
        instance = installVirtualConsole();
        const container = document.querySelector('.virtual-console-container') as HTMLElement;

        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', shiftKey: false }));

        expect(container.classList.contains('virtual-console-visible')).toBe(false);
    });

    it('does not toggle on an exact-modifier mismatch (e.g. an extra Ctrl held down)', () => {
        instance = installVirtualConsole();
        const container = document.querySelector('.virtual-console-container') as HTMLElement;

        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', shiftKey: true, ctrlKey: true }));

        expect(container.classList.contains('virtual-console-visible')).toBe(false);
    });

    it('does not toggle while focus is in an editable field, so it cannot hijack the host app', () => {
        instance = installVirtualConsole();
        const container = document.querySelector('.virtual-console-container') as HTMLElement;
        const appInput = document.createElement('input');
        document.body.appendChild(appInput);
        appInput.focus();

        appInput.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', shiftKey: true, bubbles: true }));

        expect(container.classList.contains('virtual-console-visible')).toBe(false);
        appInput.remove();
    });

    it('respects a fully custom keyboard shortcut', () => {
        instance = installVirtualConsole({ keyboardShortcut: { code: 'F8', ctrlKey: true } });
        const container = document.querySelector('.virtual-console-container') as HTMLElement;

        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', shiftKey: true }));
        expect(container.classList.contains('virtual-console-visible')).toBe(false);

        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'F8', ctrlKey: true }));
        expect(container.classList.contains('virtual-console-visible')).toBe(true);
    });

    it('disables the keyboard shortcut entirely when set to null', () => {
        instance = installVirtualConsole({ keyboardShortcut: null });
        const container = document.querySelector('.virtual-console-container') as HTMLElement;

        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', shiftKey: true }));

        expect(container.classList.contains('virtual-console-visible')).toBe(false);
    });

    it('omits the REPL input when replEnabled is false', () => {
        instance = installVirtualConsole({ replEnabled: false });

        expect(document.querySelector('.virtual-console-repl')).toBeNull();
    });

    it('includes the REPL input by default', () => {
        instance = installVirtualConsole();

        expect(document.querySelector('.virtual-console-repl')).not.toBeNull();
    });

    it('captures intercepted console.log calls as log entries', () => {
        instance = installVirtualConsole();

        console.log('hello from a test');

        const entries = document.querySelectorAll('.virtual-console-log-entry');
        expect(entries[entries.length - 1].textContent).toContain('"hello from a test"');
    });

    it('captures uncaught window errors as log entries', () => {
        instance = installVirtualConsole();

        window.dispatchEvent(new ErrorEvent('error', { message: 'boom' }));

        const entries = document.querySelectorAll('.virtual-console-log-entry');
        expect(entries[entries.length - 1].textContent).toContain('boom');
    });

    it('removes the console and restores console methods on destroy', () => {
        const originalLog = console.log;
        instance = installVirtualConsole();

        expect(console.log).not.toBe(originalLog);

        instance.destroy();
        instance = undefined;

        expect(document.querySelector('.virtual-console-container')).toBeNull();
        expect(console.log).toBe(originalLog);
        expect(getVirtualConsoleGlobalState().instance).toBeUndefined();
    });
});
