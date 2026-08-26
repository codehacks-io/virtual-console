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

        it('previews a parenthesized object literal - a bare `(` is grouping, not a call', () => {
            expect(repl.preEvaluate('({a: 12})')).toEqual({ a: 12 });
        });

        it('previews a logical expression that resolves to a parenthesized object literal', () => {
            expect(repl.preEvaluate("'yes' && ({a: 12, b: [1, 2]})")).toEqual({ a: 12, b: [1, 2] });
        });

        it('previews an arrow function - constructing one has no side effect', () => {
            const fn = repl.preEvaluate('(x) => x + 1');
            expect(typeof fn).toBe('function');
        });

        it('does not mistake a "(" inside a string for a call', () => {
            expect(repl.preEvaluate('"call(x)"')).toBe('call(x)');
        });

        it('still refuses to preview a real call, to avoid side effects while typing', () => {
            expect(repl.preEvaluate('foo()')).toBeUndefined();
        });

        it('refuses to preview a method call reached through grouping', () => {
            expect(repl.preEvaluate('(console).log()')).toBeUndefined();
        });

        it('refuses to preview an immediately-invoked function expression', () => {
            expect(repl.preEvaluate('(function() { return 1; })()')).toBeUndefined();
        });

        it('refuses to preview an increment/decrement, even without any "(" or "="', () => {
            (globalThis as any).__replTestCounter = 0;
            expect(repl.preEvaluate('__replTestCounter++')).toBeUndefined();
            expect((globalThis as any).__replTestCounter).toBe(0);
            delete (globalThis as any).__replTestCounter;
        });

        it('refuses to preview `new`', () => {
            expect(repl.preEvaluate('new Date()')).toBeUndefined();
        });

        it('refuses to preview an assignment but allows a comparison', () => {
            expect(repl.preEvaluate('1 === 1')).toBe(true);
            (globalThis as any).__replTestVar = 1;
            expect(repl.preEvaluate('__replTestVar = 2')).toBeUndefined();
            expect((globalThis as any).__replTestVar).toBe(1);
            delete (globalThis as any).__replTestVar;
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

        it('evaluates a leading-comment object literal - the comment does not defeat the { detection', () => {
            createConsole();
            repl.execute('// note\n{a: 1}');

            expect(document.querySelector('.virtual-console-log-error')).toBeNull();
            const result = document.querySelector('.virtual-console-log-result .virtual-console-content')!;
            expect(result.querySelector('.vc-object-type')?.textContent).toBe('Object(1)');
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
