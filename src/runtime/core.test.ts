import { afterEach, describe, expect, it } from 'vitest';
import { installVirtualConsole } from './core';
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

    it('marks the console as mounted on window', () => {
        instance = installVirtualConsole();

        expect(window.__VIRTUAL_CONSOLE_MOUNTED__).toBe(true);
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
        expect(window.__VIRTUAL_CONSOLE_MOUNTED__).toBe(false);
    });
});
