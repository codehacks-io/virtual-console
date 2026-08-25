import { describe, expect, it } from 'vitest';
import { createIcon, ensureIconSprite } from './icons';

describe('ensureIconSprite', () => {
    it('inserts the sprite into the given root', () => {
        const root = document.createElement('div');
        ensureIconSprite(root);

        expect(root.querySelector('#virtual-console-icon-sprite')).not.toBeNull();
    });

    it('is idempotent - a second call does not insert a duplicate', () => {
        const root = document.createElement('div');
        ensureIconSprite(root);
        ensureIconSprite(root);

        expect(root.querySelectorAll('#virtual-console-icon-sprite').length).toBe(1);
    });

    it('defines a symbol for every icon createIcon can reference', () => {
        const root = document.createElement('div');
        ensureIconSprite(root);

        (['prompt', 'result', 'error', 'warning'] as const).forEach(name => {
            expect(root.querySelector(`#vc-icon-${name}`)).not.toBeNull();
        });
    });
});

describe('createIcon', () => {
    it('creates an <svg><use> referencing the requested icon', () => {
        const icon = createIcon('error');

        expect(icon.tagName.toLowerCase()).toBe('svg');
        expect(icon.querySelector('use')?.getAttribute('href')).toBe('#vc-icon-error');
    });

    it('always carries the base vc-icon class, plus any extra class given', () => {
        expect(createIcon('prompt').getAttribute('class')).toBe('vc-icon');
        expect(createIcon('prompt', 'virtual-console-prompt-icon').getAttribute('class')).toBe(
            'vc-icon virtual-console-prompt-icon'
        );
    });
});
