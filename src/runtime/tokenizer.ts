/**
 * A real single-pass JS lexer producing a token stream, shared by anything
 * that needs to reason about REPL input structurally instead of guessing
 * from raw substrings (`code.includes('(')` and friends are exactly the
 * kind of brittle, false-positive-prone checks this exists to replace -
 * a string literal containing "(" or a `=>` arrow both defeat a naive
 * `includes` check, but not a real token stream).
 *
 * This is a lexer, not a parser: it has no grammar/AST, so it can't answer
 * "is this valid JS" or "what does this expression evaluate to" - only
 * "what are the tokens, in order, ignoring string/comment/regex-shaped
 * traps". That's enough for the two things this project needs it for:
 * syntax highlighting (syntax-highlighter.ts) and lightweight structural
 * checks on REPL input (repl.ts) - e.g. "is the first real token `{`" or
 * "is this `(` a call, based on what token precedes it".
 */

export type TokenType =
    | 'string'
    | 'comment'
    | 'number'
    | 'keyword'
    | 'boolean'
    | 'identifier'
    | 'operator'
    | 'punctuation'
    | 'whitespace';

export interface Token {
    type: TokenType;
    value: string;
}

const KEYWORDS = new Set([
    'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'return',
    'function', 'class', 'new', 'try', 'catch', 'finally', 'switch', 'case',
    'break', 'continue', 'default', 'import', 'export', 'from', 'async',
    'await', 'this', 'typeof', 'void', 'delete', 'in', 'of', 'instanceof',
    'extends', 'super', 'throw', 'yield', 'debugger'
]);

const BOOLEANS = new Set(['true', 'false', 'null', 'undefined']);

const PUNCTUATION = new Set(['(', ')', '{', '}', '[', ']', ',', ';', ':', '.']);

// Longest-match-first so e.g. `>>>=` isn't split into `>>>` + `=`, and `=>`
// isn't mistaken for an assignment by anything consuming this token stream.
const MULTI_CHAR_OPERATORS = [
    '>>>=', '**=', '<<=', '>>=', '&&=', '||=', '??=', '>>>',
    '===', '!==', '...', '?.',
    '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '**', '++', '--',
    '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>'
];

const SINGLE_CHAR_OPERATORS = new Set(['+', '-', '*', '/', '%', '=', '&', '|', '<', '>', '!', '^', '~', '?']);

/**
 * The most recent token that carries structural meaning, skipping back over
 * trivia. Cheap in practice: a whitespace run is already collapsed into a
 * single token, so this walks past a handful of entries at most, and since
 * it stops at the first significant token the runs never overlap.
 */
function lastSignificantToken(tokens: Token[]): Token | null {
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        if (token.type !== 'whitespace' && token.type !== 'comment') {
            return token;
        }
    }
    return null;
}

export function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const len = code.length;

    while (i < len) {
        const char = code[i];

        if (/\s/.test(char)) {
            let value = char;
            i++;
            while (i < len && /\s/.test(code[i])) {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'whitespace', value });
            continue;
        }

        if (char === '"' || char === "'") {
            const quote = char;
            let value = quote;
            i++;
            while (i < len) {
                const c = code[i];
                value += c;
                i++;
                if (c === '\\') {
                    if (i < len) {
                        value += code[i];
                        i++;
                    }
                } else if (c === quote) {
                    break;
                }
            }
            tokens.push({ type: 'string', value });
            continue;
        }

        if (char === '`') {
            let value = char;
            i++;
            while (i < len) {
                const c = code[i];
                value += c;
                i++;
                if (c === '\\') {
                    if (i < len) {
                        value += code[i];
                        i++;
                    }
                } else if (c === '`') {
                    break;
                }
            }
            tokens.push({ type: 'string', value });
            continue;
        }

        if (char === '/' && code[i + 1] === '/') {
            let value = '//';
            i += 2;
            while (i < len && code[i] !== '\n') {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'comment', value });
            continue;
        }

        if (char === '/' && code[i + 1] === '*') {
            let value = '/*';
            i += 2;
            while (i < len) {
                const c = code[i];
                value += c;
                i++;
                if (c === '*' && code[i] === '/') {
                    value += '/';
                    i++;
                    break;
                }
            }
            tokens.push({ type: 'comment', value });
            continue;
        }

        if (/\d/.test(char)) {
            let value = char;
            i++;
            while (i < len && /[\d.]/.test(code[i])) {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'number', value });
            continue;
        }

        if (/[a-zA-Z_$]/.test(char)) {
            let value = char;
            i++;
            while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) {
                value += code[i];
                i++;
            }

            // A word directly after `.` / `?.` is a property name, never a
            // keyword - JS allows reserved words there (`gen.return()`,
            // `Array.from`, `mod.default`). Classifying those as keywords
            // both mis-colors them and, worse, hides the call from
            // repl.ts's "is the token before `(` callable" check.
            const prev = lastSignificantToken(tokens);
            const afterMemberAccess = prev !== null && (
                (prev.type === 'punctuation' && prev.value === '.') ||
                (prev.type === 'operator' && prev.value === '?.')
            );

            if (afterMemberAccess) {
                tokens.push({ type: 'identifier', value });
            } else if (KEYWORDS.has(value)) {
                tokens.push({ type: 'keyword', value });
            } else if (BOOLEANS.has(value)) {
                tokens.push({ type: 'boolean', value });
            } else {
                tokens.push({ type: 'identifier', value });
            }
            continue;
        }

        const multiCharMatch = MULTI_CHAR_OPERATORS.find((op) => code.startsWith(op, i));
        if (multiCharMatch) {
            tokens.push({ type: 'operator', value: multiCharMatch });
            i += multiCharMatch.length;
            continue;
        }

        if (PUNCTUATION.has(char)) {
            tokens.push({ type: 'punctuation', value: char });
            i++;
            continue;
        }

        if (SINGLE_CHAR_OPERATORS.has(char)) {
            tokens.push({ type: 'operator', value: char });
            i++;
            continue;
        }

        tokens.push({ type: 'punctuation', value: char });
        i++;
    }

    return tokens;
}
