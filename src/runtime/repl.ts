import { getConfig } from './config';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';
import { addLog } from './ui';

/**
 * Evaluates REPL input in the global scope. A leading `{` is ambiguous in
 * JS: `{a: 1}` parses as a block statement (with `a:` read as a label),
 * not an object literal, so `eval` throws "Unexpected token ':'". Chrome's
 * console works around this by wrapping such input in parentheses to force
 * expression context; we do the same, falling back to the raw source if
 * that wrapping itself doesn't parse (a genuine block statement).
 */
function evalReplCode(code: string): any {
    const trimmed = code.trim();
    if (trimmed.startsWith('{')) {
        try {
            return (0, eval)(`(${code})`);
        } catch (err) {
            if (err instanceof SyntaxError) {
                return (0, eval)(code);
            }
            throw err;
        }
    }
    return (0, eval)(code);
}

export class REPL {
    private history: string[] = [];
    private historyIndex: number = -1;

    constructor() {
        const saved = getStorageItem(STORAGE_KEYS.replHistory);
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch {
                // Corrupt data - start fresh.
            }
        }
    }

    /**
     * Executes a command and logs the result
     */
    execute(command: string) {
        if (!command.trim()) return;

        // Add to history
        this.addToHistory(command);

        // Log the command itself
        addLog([command], 'command');

        try {
            const result = evalReplCode(command);
            addLog([result], 'result');
            // The user requested syntax highlighting for output. 
            // addLog uses createObjectViewer which handles syntax highlighting for primitives and objects.
        } catch (error: any) {
            addLog([error], 'error');
        }
    }

    /**
     * Adds a command to history
     */
    private addToHistory(command: string) {
        // Remove if already exists to avoid duplicates
        const index = this.history.indexOf(command);
        if (index !== -1) {
            this.history.splice(index, 1);
        }

        this.history.push(command);
        const maxHistory = getConfig().replHistoryLimit;
        if (this.history.length > maxHistory) {
            this.history.splice(0, this.history.length - maxHistory);
        }

        this.historyIndex = this.history.length;

        setStorageItem(STORAGE_KEYS.replHistory, JSON.stringify(this.history));
    }

    getHistoryPrevious(): string | null {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.history[this.historyIndex];
        }
        return null;
    }

    getHistoryNext(): string | null {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            return this.history[this.historyIndex];
        }
        this.historyIndex = this.history.length;
        return '';
    }

    /**
     * Safely pre-evaluates code to show a preview
     * Returns the result or undefined if unsafe/error
     */
    preEvaluate(code: string): any {
        const trimmed = code.trim();
        if (!trimmed) return undefined;

        // Heuristic: Unsafe if it contains assignment or function calls (parentheses)
        // We allow parentheses if they are part of a method call? No, that triggers side effects.
        // We strictly disallow '(' and '=' for safety.
        // Exception: We might want to allow property access like 'foo.bar'
        if (trimmed.includes('(') || trimmed.includes('=')) {
            return undefined;
        }

        try {
            // Check if it's a valid identifier or property access chain
            // This prevents eval of things like "while(true)" although the '(' check helps.
            // But "delete window.foo" is also bad.
            if (trimmed.includes('delete ')) return undefined;

            return evalReplCode(trimmed);
        } catch {
            return undefined;
        }
    }

    /**
     * Gets autocompletion suggestions
     */
    getSuggestions(input: string): string[] {
        if (!input) return [];

        // Find the last token being typed
        // e.g. "console.lo" -> "console", "lo"
        // e.g. "window.document.bo" -> "window.document", "bo"

        // Simple regex to find the last property access chain
        const match = input.match(/([a-zA-Z0-9_$]+(\.[a-zA-Z0-9_$]+)*\.?)$/);
        if (!match) return [];

        const chain = match[0];
        const parts = chain.split('.');

        let context: any = window;
        let prefix = '';

        // If ending with dot, we want all properties of the object
        // If not ending with dot, the last part is the prefix to filter by
        if (chain.endsWith('.')) {
            // "obj." -> context is obj, prefix is empty
            for (let i = 0; i < parts.length - 1; i++) {
                if (context === null || context === undefined) return [];
                context = context[parts[i]];
            }
            prefix = '';
        } else {
            // "obj.pre" -> context is obj, prefix is "pre"
            for (let i = 0; i < parts.length - 1; i++) {
                if (context === null || context === undefined) return [];
                context = context[parts[i]];
            }
            prefix = parts[parts.length - 1];
        }

        if (context === null || context === undefined) return [];

        try {
            // Get all property names (including prototype chain)
            const props = new Set<string>();
            let obj = context;
            while (obj !== null && obj !== undefined) {
                Object.getOwnPropertyNames(obj).forEach(p => props.add(p));
                obj = Object.getPrototypeOf(obj);
            }

            return Array.from(props)
                .filter(p => p.startsWith(prefix) && p !== prefix)
                .toSorted()
                .slice(0, 50); // Limit results
        } catch {
            return [];
        }
    }
}

export const repl = new REPL();
