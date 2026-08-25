const TOKEN_CLASS = {
    KEYWORD: 'vc-keyword',
    STRING: 'vc-string',
    NUMBER: 'vc-number',
    BOOLEAN: 'vc-boolean',
    COMMENT: 'vc-comment',
    OPERATOR: 'vc-operator',
    FUNCTION: 'vc-function'
};

const KEYWORDS = new Set([
    'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'return',
    'function', 'class', 'new', 'try', 'catch', 'finally', 'switch', 'case',
    'break', 'continue', 'default', 'import', 'export', 'from', 'async',
    'await', 'this', 'typeof', 'void', 'delete', 'in', 'of', 'instanceof',
    'extends', 'super', 'throw', 'yield', 'debugger'
]);

const BOOLEANS = new Set(['true', 'false', 'null', 'undefined']);

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Tokenizes JavaScript source with a single-pass scanner and returns HTML
 * with a <span> per token, for use as a highlighted display layer behind
 * a transparent <input> (so it can't be run through a full parser/AST).
 */
export function highlightCode(code: string): string {
    if (!code) return '';

    let html = '';
    let i = 0;
    const len = code.length;

    while (i < len) {
        const char = code[i];

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
            html += `<span class="${TOKEN_CLASS.STRING}">${escapeHtml(value)}</span>`;
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
            html += `<span class="${TOKEN_CLASS.STRING}">${escapeHtml(value)}</span>`;
            continue;
        }

        if (char === '/' && code[i + 1] === '/') {
            let value = '//';
            i += 2;
            while (i < len && code[i] !== '\n') {
                value += code[i];
                i++;
            }
            html += `<span class="${TOKEN_CLASS.COMMENT}">${escapeHtml(value)}</span>`;
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
            html += `<span class="${TOKEN_CLASS.COMMENT}">${escapeHtml(value)}</span>`;
            continue;
        }

        if (/\d/.test(char)) {
            let value = char;
            i++;
            while (i < len && /[\d.]/.test(code[i])) {
                value += code[i];
                i++;
            }
            html += `<span class="${TOKEN_CLASS.NUMBER}">${value}</span>`;
            continue;
        }

        if (/[a-zA-Z_$]/.test(char)) {
            let value = char;
            i++;
            while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) {
                value += code[i];
                i++;
            }

            if (KEYWORDS.has(value)) {
                html += `<span class="${TOKEN_CLASS.KEYWORD}">${value}</span>`;
            } else if (BOOLEANS.has(value)) {
                html += `<span class="${TOKEN_CLASS.BOOLEAN}">${value}</span>`;
            } else if (code[i] === '(') {
                html += `<span class="${TOKEN_CLASS.FUNCTION}">${value}</span>`;
            } else {
                html += value;
            }
            continue;
        }

        if (/[+\-*/%=&|<>!^~?]/.test(char)) {
            html += `<span class="${TOKEN_CLASS.OPERATOR}">${escapeHtml(char)}</span>`;
            i++;
            continue;
        }

        html += escapeHtml(char);
        i++;
    }

    return html;
}
