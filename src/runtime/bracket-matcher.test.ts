import { describe, expect, it } from 'vitest';
import { findMatchingBrackets } from './bracket-matcher';

describe('findMatchingBrackets', () => {
    it('matches a simple pair with the caret right after the opener', () => {
        // "(a)" - caret after "(" (index 1)
        expect(findMatchingBrackets('(a)', 1)).toEqual([0, 2]);
    });

    it('matches a simple pair with the caret right before the opener', () => {
        // "(a)" - caret before "(" (index 0), nothing precedes it
        expect(findMatchingBrackets('(a)', 0)).toEqual([0, 2]);
    });

    it('matches with the caret right before the closer', () => {
        // "(a)" - caret before ")" (index 2)
        expect(findMatchingBrackets('(a)', 2)).toEqual([0, 2]);
    });

    it('matches with the caret right after the closer', () => {
        // "(a)" - caret after ")" (index 3)
        expect(findMatchingBrackets('(a)', 3)).toEqual([0, 2]);
    });

    it('prefers the bracket behind the caret when two sit back-to-back with no space', () => {
        const code = '[{ONE:{a:1},TWO:[1,2]}]';
        //             0123456789...

        // Caret between the inner object's "}" (21) and the outer array's
        // "]" (22): the character immediately behind the caret ("}") wins,
        // so this should match the outer object's braces, not the array.
        expect(findMatchingBrackets(code, 22)).toEqual([1, 21]);

        // Caret after the final "]" (23): behind the caret is "]" (22),
        // which matches the array's opening "[" at index 0.
        expect(findMatchingBrackets(code, 23)).toEqual([0, 22]);
    });

    it('matches the same pair from either side when brackets are separated by whitespace', () => {
        const code = '[ { } ]';
        //             0123456

        // Caret just after "{" (index 3) and just before "{" (index 2) are
        // both "touching" the same bracket once whitespace separates it
        // from its neighbor, so the side doesn't change the result.
        expect(findMatchingBrackets(code, 2)).toEqual([2, 4]);
        expect(findMatchingBrackets(code, 3)).toEqual([2, 4]);
    });

    it('returns null when the caret is not adjacent to any bracket', () => {
        expect(findMatchingBrackets('( a )', 2)).toBeNull();
    });

    it('returns null for an unmatched (unbalanced) bracket', () => {
        expect(findMatchingBrackets('(a', 1)).toBeNull();
    });

    it('returns null for mismatched bracket types instead of pairing them', () => {
        // "(]" - the "(" and "]" never match, so neither is highlighted.
        expect(findMatchingBrackets('(]', 1)).toBeNull();
        expect(findMatchingBrackets('(]', 2)).toBeNull();
    });

    it('ignores brackets inside a string literal', () => {
        expect(findMatchingBrackets('"(a)"', 2)).toBeNull();
    });

    it('returns null for empty input', () => {
        expect(findMatchingBrackets('', 0)).toBeNull();
    });
});
