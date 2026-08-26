import { tokenize } from './tokenizer';
import type { Token } from './tokenizer';

const TOKEN_CLASS = {
    KEYWORD: 'vc-keyword',
    STRING: 'vc-string',
    NUMBER: 'vc-number',
    BOOLEAN: 'vc-boolean',
    COMMENT: 'vc-comment',
    OPERATOR: 'vc-operator',
    FUNCTION: 'vc-function'
};

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Renders a token stream as HTML with a <span> per highlighted token, for
 * use as a display layer behind a transparent <input> (so it can't be run
 * through a full parser/AST).
 */
export function highlightCode(code: string): string {
    if (!code) return '';

    const tokens = tokenize(code);
    let html = '';

    tokens.forEach((token: Token, index: number) => {
        switch (token.type) {
            case 'string':
                html += `<span class="${TOKEN_CLASS.STRING}">${escapeHtml(token.value)}</span>`;
                break;
            case 'comment':
                html += `<span class="${TOKEN_CLASS.COMMENT}">${escapeHtml(token.value)}</span>`;
                break;
            case 'number':
                html += `<span class="${TOKEN_CLASS.NUMBER}">${token.value}</span>`;
                break;
            case 'keyword':
                html += `<span class="${TOKEN_CLASS.KEYWORD}">${token.value}</span>`;
                break;
            case 'boolean':
                html += `<span class="${TOKEN_CLASS.BOOLEAN}">${token.value}</span>`;
                break;
            case 'identifier': {
                // Colored as a function name only when immediately (no
                // whitespace between) followed by `(` - matches how a call
                // reads visually, same rule the old inline scanner used.
                const next = tokens[index + 1];
                const isCall = next?.type === 'punctuation' && next.value === '(';
                html += isCall
                    ? `<span class="${TOKEN_CLASS.FUNCTION}">${token.value}</span>`
                    : token.value;
                break;
            }
            case 'operator':
                html += `<span class="${TOKEN_CLASS.OPERATOR}">${escapeHtml(token.value)}</span>`;
                break;
            default:
                // punctuation / whitespace: plain passthrough, no styling.
                html += escapeHtml(token.value);
        }
    });

    return html;
}
