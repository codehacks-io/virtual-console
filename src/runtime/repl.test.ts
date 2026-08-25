import { afterEach, describe, expect, it } from 'vitest';
import { destroyConsole, createConsole } from './ui';
import { repl } from './repl';

describe('REPL', () => {
    afterEach(() => {
        destroyConsole();
        document.body.innerHTML = '';
    });

    describe('preEvaluate', () => {
        it('previews an object literal instead of treating the leading { as a block', () => {
            expect(repl.preEvaluate('{a: 123, b: [1, 2, 3]}')).toEqual({ a: 123, b: [1, 2, 3] });
        });

        it('still refuses to preview calls, to avoid side effects while typing', () => {
            expect(repl.preEvaluate('foo()')).toBeUndefined();
        });
    });

    describe('execute', () => {
        it('evaluates an object literal instead of throwing "Unexpected token"', () => {
            createConsole();
            repl.execute('{a: 123, b: [1, 2, 3]}');

            expect(document.querySelector('.virtual-console-log-error')).toBeNull();
            const result = document.querySelector('.virtual-console-log-result .virtual-console-content')!;
            expect(result.querySelector('.vc-object-type')?.textContent).toBe('Object(2)');
            expect(result.querySelector('.vc-object-preview')?.textContent).toBe(' {a, b}');
        });

        it('falls back to running a genuine block statement when the object-literal wrap does not parse', () => {
            createConsole();
            repl.execute('{ let x = 5; x + 1 }');

            expect(document.querySelector('.virtual-console-log-error')).toBeNull();
            const result = document.querySelector('.virtual-console-log-result .virtual-console-content')!;
            expect(result.textContent).toContain('6');
        });

        it('reports a runtime error thrown while building the object literal without re-running it', () => {
            createConsole();
            (globalThis as any).__replTestCalls = 0;
            (globalThis as any).__replTestThrow = () => {
                (globalThis as any).__replTestCalls++;
                throw new Error('boom');
            };

            repl.execute('{a: __replTestThrow()}');

            expect((globalThis as any).__replTestCalls).toBe(1);
            const error = document.querySelector('.virtual-console-log-error .virtual-console-content')!;
            expect(error.textContent).toContain('boom');

            delete (globalThis as any).__replTestCalls;
            delete (globalThis as any).__replTestThrow;
        });
    });
});
