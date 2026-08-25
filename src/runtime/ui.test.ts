import { afterEach, describe, expect, it } from 'vitest';
import { resetConfig, setConfig } from './config';
import { destroyConsole, createConsole } from './ui';

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
});
