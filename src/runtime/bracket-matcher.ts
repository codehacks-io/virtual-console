import { tokenize } from './tokenizer';

const OPEN_TO_CLOSE: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const OPENERS = new Set(Object.keys(OPEN_TO_CLOSE));
const CLOSERS = new Set(Object.values(OPEN_TO_CLOSE));

interface BracketToken {
    char: string;
    pos: number;
}

/**
 * Finds the character offsets of the bracket pair that should be highlighted
 * for a given cursor position, mirroring Chrome DevTools / editor behavior:
 * only punctuation-token brackets count (so `"{"` inside a string is never a
 * candidate - tokenize() already separates those out), and matching runs
 * left-to-right with a stack so mismatched closers are simply left unpaired
 * rather than corrupting the rest of the match.
 *
 * Which bracket is "active" for the cursor resolves the ambiguity of
 * back-to-back brackets with no whitespace between them (`}]`): the
 * character immediately *before* the cursor wins over the one immediately
 * after. When whitespace separates brackets, only one side is ever actually
 * touching a bracket character, so this priority never changes the outcome -
 * it only matters for the tightly-packed case.
 */
export function findMatchingBrackets(code: string, cursorPos: number): [number, number] | null {
    const brackets: BracketToken[] = [];
    let offset = 0;
    for (const token of tokenize(code)) {
        if (token.type === 'punctuation' && (OPENERS.has(token.value) || CLOSERS.has(token.value))) {
            brackets.push({ char: token.value, pos: offset });
        }
        offset += token.value.length;
    }

    if (brackets.length === 0) return null;

    const matches = new Map<number, number>();
    const stack: BracketToken[] = [];
    for (const bracket of brackets) {
        if (OPENERS.has(bracket.char)) {
            stack.push(bracket);
            continue;
        }
        const top = stack[stack.length - 1];
        if (top && OPEN_TO_CLOSE[top.char] === bracket.char) {
            stack.pop();
            matches.set(top.pos, bracket.pos);
            matches.set(bracket.pos, top.pos);
        }
    }

    const findAt = (pos: number) => brackets.find((b) => b.pos === pos);
    const active = findAt(cursorPos - 1) ?? findAt(cursorPos);
    if (!active) return null;

    const matchPos = matches.get(active.pos);
    if (matchPos === undefined) return null;

    return active.pos < matchPos ? [active.pos, matchPos] : [matchPos, active.pos];
}
