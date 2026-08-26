import { describe, expect, it } from 'vitest';
import { tokenize } from './tokenizer';

describe('tokenize', () => {
    it('does not treat a "(" inside a string as a real token', () => {
        const tokens = tokenize('"call(x)"');
        expect(tokens).toEqual([{ type: 'string', value: '"call(x)"' }]);
    });

    it('keeps a `=>` arrow as one operator token, not "=" then ">"', () => {
        const tokens = tokenize('x=>x');
        expect(tokens.map((t) => t.value)).toEqual(['x', '=>', 'x']);
        expect(tokens[1].type).toBe('operator');
    });

    it('distinguishes multi-char comparison/logical operators from assignment', () => {
        const tokens = tokenize('a === b && c >= d');
        const ops = tokens.filter((t) => t.type === 'operator').map((t) => t.value);
        expect(ops).toEqual(['===', '&&', '>=']);
    });

    it('recognizes ?? and ?. distinctly from ?', () => {
        expect(tokenize('a ?? b').map((t) => t.value)).toContain('??');
        expect(tokenize('a?.b').map((t) => t.value)).toContain('?.');
    });

    it('tokenizes a leading object literal brace as punctuation', () => {
        const tokens = tokenize('{a: 1}');
        expect(tokens[0]).toEqual({ type: 'punctuation', value: '{' });
    });

    it('classifies keywords, booleans, numbers, and identifiers separately', () => {
        const tokens = tokenize('let x = true');
        expect(tokens.filter((t) => t.type !== 'whitespace')).toEqual([
            { type: 'keyword', value: 'let' },
            { type: 'identifier', value: 'x' },
            { type: 'operator', value: '=' },
            { type: 'boolean', value: 'true' }
        ]);
    });
});
