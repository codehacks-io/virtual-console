import { afterEach, describe, expect, it } from 'vitest';
import { resetConfig, setConfig } from './config';
import { addLog, destroyConsole, createConsole } from './ui';

describe('createConsole', () => {
    afterEach(() => {
        destroyConsole();
        resetConfig();
        document.body.innerHTML = '';
    });

    it('appends each structural element exactly once', () => {
        createConsole();

        expect(document.querySelectorAll('.virtual-console-header').length).toBe(1);
        expect(document.querySelectorAll('.virtual-console-resize-handle').length).toBe(1);
        expect(document.querySelectorAll('.virtual-console-logs').length).toBe(1);
    });

    it('promotes a static custom target to position:relative and docks the console absolutely', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        setConfig({ targetElement: target });

        createConsole();

        expect(target.style.position).toBe('relative');
        const container = target.querySelector('.virtual-console-container') as HTMLElement;
        expect(container.style.position).toBe('absolute');
    });

    it('leaves a target that already has a positioning context alone', () => {
        const target = document.createElement('div');
        target.style.position = 'fixed';
        document.body.appendChild(target);
        setConfig({ targetElement: target });

        createConsole();

        expect(target.style.position).toBe('fixed');
    });

    it('renders a command log entry with syntax highlighting instead of quoting it as a string', () => {
        createConsole();
        addLog(['var x = 1; // comment'], 'command');

        const content = document.querySelector('.virtual-console-log-command .virtual-console-content')!;

        expect(content.querySelector('.vc-keyword')?.textContent).toBe('var');
        expect(content.querySelector('.vc-comment')?.textContent).toBe('// comment');
        expect(content.textContent).not.toContain('"var x = 1; // comment"');
    });

    it.each([
        ['command', 'prompt'],
        ['result', 'result'],
        ['error', 'error'],
        ['warn', 'warning']
    ] as const)('gives a %s log entry the %s icon', (type, iconName) => {
        createConsole();
        addLog(['x'], type);

        const entry = document.querySelector(`.virtual-console-log-${type}`)!;
        expect(entry.querySelector('use')?.getAttribute('href')).toBe(`#vc-icon-${iconName}`);
    });

    it('does not add an icon to a plain log entry', () => {
        createConsole();
        addLog(['x'], 'log');

        const entry = document.querySelector('.virtual-console-log-log')!;
        expect(entry.querySelector('.vc-icon')).toBeNull();
    });

    describe('REPL input', () => {
        it('is a textarea, so it can hold multi-line commands', () => {
            createConsole();
            const input = document.querySelector('.virtual-console-input')!;
            expect(input.tagName).toBe('TEXTAREA');
        });

        it('runs the command on plain Enter', () => {
            createConsole();
            const input = document.querySelector('.virtual-console-input') as HTMLTextAreaElement;
            input.value = '1 + 1';
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

            expect(document.querySelector('.virtual-console-log-command')).not.toBeNull();
            expect(document.querySelector('.virtual-console-log-result')).not.toBeNull();
            expect(input.value).toBe('');
        });

        it('leaves Shift+Enter alone (native newline insertion) instead of running the command', () => {
            createConsole();
            const input = document.querySelector('.virtual-console-input') as HTMLTextAreaElement;
            input.value = '1 + 1';
            const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true });
            input.dispatchEvent(event);

            expect(document.querySelector('.virtual-console-log-command')).toBeNull();
            expect(document.querySelector('.virtual-console-log-result')).toBeNull();
            expect(event.defaultPrevented).toBe(false);
            // Value is untouched by our handler - jsdom doesn't simulate the
            // browser's native newline insertion, so this just confirms we
            // didn't clear it the way execute() would.
            expect(input.value).toBe('1 + 1');
        });
    });
});
