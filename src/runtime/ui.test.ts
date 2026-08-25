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
});
