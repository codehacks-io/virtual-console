import { createObjectViewer } from './object-viewer';

interface ReplHistoryEntry {
    code: string;
    timestamp: number;
}

interface AutocompleteSuggestion {
    value: string;
    type: string;
}

/**
 * REPL Context - manages execution context and history
 */
class ReplContext {
    private history: ReplHistoryEntry[] = [];
    private historyIndex: number = -1;
    private maxHistory: number = 100;

    // Store user-defined variables in REPL context
    private context: Record<string, any> = {};

    addToHistory(code: string) {
        this.history.push({
            code,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Reset history index
        this.historyIndex = this.history.length;
    }

    getPreviousCommand(): string | null {
        if (this.history.length === 0) return null;

        if (this.historyIndex > 0) {
            this.historyIndex--;
        }

        return this.history[this.historyIndex]?.code || null;
    }

    getNextCommand(): string | null {
        if (this.history.length === 0) return null;

        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            return this.history[this.historyIndex]?.code || null;
        } else {
            this.historyIndex = this.history.length;
            return '';
        }
    }

    getContext() {
        return this.context;
    }

    setContextValue(key: string, value: any) {
        this.context[key] = value;
    }
}

const replContext = new ReplContext();

/**
 * Gets autocomplete suggestions based on current input
 */
function getAutocompleteSuggestions(input: string): AutocompleteSuggestion[] {
    if (!input || input.trim().length === 0) return [];

    const suggestions: AutocompleteSuggestion[] = [];
    const parts = input.split('.');
    const currentPart = parts[parts.length - 1].toLowerCase();

    if (parts.length === 1) {
        // Suggest from global scope (window) and REPL context
        const globalKeys = Object.getOwnPropertyNames(window);
        const contextKeys = Object.keys(replContext.getContext());
        const allKeys = [...new Set([...globalKeys, ...contextKeys])];

        allKeys.forEach(key => {
            if (key.toLowerCase().startsWith(currentPart)) {
                try {
                    const value = (window as any)[key] || replContext.getContext()[key];
                    const type = typeof value;
                    suggestions.push({ value: key, type });
                } catch (e) {
                    // Skip properties that throw errors when accessed
                }
            }
        });
    } else {
        // Suggest from object properties
        try {
            const objectPath = parts.slice(0, -1).join('.');
            // Use a safe evaluation approach
            const obj = evaluateInContext(objectPath, true);

            if (obj && typeof obj === 'object') {
                const keys = Object.getOwnPropertyNames(obj);
                keys.forEach(key => {
                    if (key.toLowerCase().startsWith(currentPart)) {
                        try {
                            const type = typeof obj[key];
                            suggestions.push({ value: key, type });
                        } catch (e) {
                            // Skip
                        }
                    }
                });
            }
        } catch (e) {
            // Cannot evaluate, no suggestions
        }
    }

    // Limit suggestions
    return suggestions.slice(0, 20);
}

/**
 * Safely pre-evaluates an expression without executing functions
 * Returns the result or null if it has side effects
 */
function safePreEvaluate(code: string): { value: any; safe: boolean } | null {
    const trimmedCode = code.trim();

    // Don't pre-evaluate empty code
    if (!trimmedCode) return null;

    // Don't pre-evaluate if it looks like a statement (assignment, declaration, etc.)
    if (/^(var|let|const|function|class|if|for|while|do|switch|try|return|throw)\s/.test(trimmedCode)) {
        return null;
    }

    // Don't pre-evaluate if it contains function call syntax ()
    // But allow property access like array.length or object.property
    if (/\w+\s*\(/.test(trimmedCode)) {
        return null;
    }

    // Don't pre-evaluate if it contains assignment operators
    if (/[+\-*/%&|^]?=/.test(trimmedCode) && !/[=!<>]=/.test(trimmedCode)) {
        return null;
    }

    try {
        const result = evaluateInContext(trimmedCode, true);
        return { value: result, safe: true };
    } catch (e) {
        // If evaluation fails, don't show preview
        return null;
    }
}

/**
 * Evaluates code in the REPL context
 */
function evaluateInContext(code: string, safeMode: boolean = false): any {
    // Create a context with both window and REPL variables
    const context = replContext.getContext();

    // Build a scope chain
    const contextKeys = Object.keys(context);
    const contextValues = contextKeys.map(k => context[k]);

    if (safeMode) {
        // In safe mode, only allow property access, no function execution
        // We use a limited Function constructor
        try {
            const func = new Function(...contextKeys, `return (${code});`);
            return func(...contextValues);
        } catch (e) {
            throw e;
        }
    } else {
        // Execute code with full access
        try {
            // Use Function constructor for better scoping
            const func = new Function(...contextKeys, `
                'use strict';
                ${code}
            `);
            return func(...contextValues);
        } catch (e) {
            throw e;
        }
    }
}

/**
 * Executes code and returns the result
 */
function executeCode(code: string): { success: boolean; result?: any; error?: Error } {
    try {
        // For variable declarations, we need to execute in global scope
        // We'll use indirect eval to execute at global scope
        const globalEval = eval; // Indirect eval

        // Check if this is a variable declaration
        const isDeclaration = /^\s*(var|let|const)\s+/.test(code);

        if (isDeclaration) {
            // Replace let/const with var for global scope (let/const don't work in global)
            const modifiedCode = code.replace(/^\s*(let|const)\s+/, 'var ');

            // Execute in global scope
            globalEval(modifiedCode);

            // Try to extract the variable name and store it in context
            const varMatch = code.match(/(?:var|let|const)\s+(\w+)/);
            if (varMatch) {
                const varName = varMatch[1];
                // Access the variable from global scope
                const value = (window as any)[varName];
                replContext.setContextValue(varName, value);
            }

            return { success: true, result: undefined };
        } else {
            // For expressions, evaluate with access to both global scope and REPL context
            const context = replContext.getContext();

            // Create a with statement to access context variables
            const contextCode = Object.keys(context).map(key => {
                return `var ${key} = ${JSON.stringify(context[key])};`;
            }).join('\n');

            // Evaluation expressions - first try to return a value
            try {
                const result: any = globalEval(`
                    (function() {
                        ${contextCode}
                        return (${code});
                    })()
                `);
                return { success: true, result };
            } catch (e) {
                // If that fails, try as statement
                const result: any = globalEval(`
                    (function() {
                        ${contextCode}
                        ${code}
                    })()
                `);
                return { success: true, result };
            }
        }
    } catch (error) {
        return { success: false, error: error as Error };
    }
}

/**
 * Formats output value with syntax highlighting
 */
function formatOutput(value: any): HTMLElement {
    const container = document.createElement('span');
    container.className = 'repl-output';

    // Use the existing object viewer for complex types
    if (value !== null && value !== undefined && typeof value === 'object') {
        const viewer = createObjectViewer(value);
        container.appendChild(viewer);
        return container;
    }

    // For primitives, add syntax highlighting
    const valueSpan = document.createElement('span');

    if (value === null) {
        valueSpan.className = 'vc-null';
        valueSpan.textContent = 'null';
    } else if (value === undefined) {
        valueSpan.className = 'vc-undefined';
        valueSpan.textContent = 'undefined';
    } else if (typeof value === 'string') {
        valueSpan.className = 'vc-string';
        valueSpan.textContent = `"${value}"`;
    } else if (typeof value === 'number') {
        valueSpan.className = 'vc-number';
        valueSpan.textContent = String(value);
    } else if (typeof value === 'boolean') {
        valueSpan.className = 'vc-boolean';
        valueSpan.textContent = String(value);
    } else if (typeof value === 'function') {
        valueSpan.className = 'vc-function';
        valueSpan.textContent = value.toString();
    } else if (typeof value === 'symbol') {
        valueSpan.className = 'vc-symbol';
        valueSpan.textContent = String(value);
    } else {
        valueSpan.textContent = String(value);
    }

    container.appendChild(valueSpan);
    return container;
}

/**
 * Creates the REPL UI
 */
export function createRepl(): HTMLElement {
    const replContainer = document.createElement('div');
    replContainer.className = 'virtual-console-repl';

    // Input controls container
    const inputContainer = document.createElement('div');
    inputContainer.className = 'virtual-console-repl-input-container';

    // Code input
    const input = document.createElement('textarea');
    input.className = 'virtual-console-repl-input';
    input.placeholder = 'Enter JavaScript code...';
    input.rows = 1;
    input.spellcheck = false;

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'virtual-console-repl-submit';
    submitBtn.textContent = '▶';
    submitBtn.title = 'Execute code (Enter)';

    // Preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'virtual-console-repl-preview';
    previewContainer.style.display = 'none';

    // Autocomplete dropdown
    const autocompleteDropdown = document.createElement('div');
    autocompleteDropdown.className = 'virtual-console-repl-autocomplete';
    autocompleteDropdown.style.display = 'none';

    let selectedSuggestionIndex = -1;
    let currentSuggestions: AutocompleteSuggestion[] = [];

    // Update autocomplete
    function updateAutocomplete() {
        const inputValue = input.value;
        const cursorPos = input.selectionStart || 0;
        const textBeforeCursor = inputValue.substring(0, cursorPos);

        // Get the current word being typed
        const match = textBeforeCursor.match(/[\w.]+$/);
        const currentWord = match ? match[0] : '';

        if (currentWord.length > 0) {
            currentSuggestions = getAutocompleteSuggestions(currentWord);

            if (currentSuggestions.length > 0) {
                autocompleteDropdown.innerHTML = '';
                currentSuggestions.forEach((suggestion) => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.textContent = `${suggestion.value} (${suggestion.type})`;

                    item.addEventListener('click', () => {
                        applySuggestion(suggestion.value, currentWord);
                    });

                    autocompleteDropdown.appendChild(item);
                });

                autocompleteDropdown.style.display = 'block';
                selectedSuggestionIndex = -1;
            } else {
                autocompleteDropdown.style.display = 'none';
            }
        } else {
            autocompleteDropdown.style.display = 'none';
            currentSuggestions = [];
        }
    }

    // Apply autocomplete suggestion
    function applySuggestion(suggestionValue: string, currentWord: string) {
        const inputValue = input.value;
        const cursorPos = input.selectionStart || 0;
        const textBeforeCursor = inputValue.substring(0, cursorPos);
        const textAfterCursor = inputValue.substring(cursorPos);

        // Replace the current word with the suggestion
        const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length) + suggestionValue;
        input.value = newTextBefore + textAfterCursor;
        input.selectionStart = input.selectionEnd = newTextBefore.length;

        autocompleteDropdown.style.display = 'none';
        input.focus();
        updatePreview();
    }

    // Update preview
    function updatePreview() {
        const code = input.value.trim();

        if (code.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }

        const preEval = safePreEvaluate(code);

        if (preEval && preEval.safe) {
            previewContainer.innerHTML = '';
            const resultEl = formatOutput(preEval.value);
            resultEl.style.opacity = '0.5';
            previewContainer.appendChild(resultEl);
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    }

    // Execute code
    function execute() {
        const code = input.value.trim();

        if (code.length === 0) return;

        // Hide preview and autocomplete
        previewContainer.style.display = 'none';
        autocompleteDropdown.style.display = 'none';

        // Add to history
        replContext.addToHistory(code);

        // Log input
        addReplLog(code, 'input');

        // Execute
        const result = executeCode(code);

        if (result.success) {
            addReplLog(result.result, 'output');
        } else {
            addReplLog(result.error, 'error');
        }

        // Clear input
        input.value = '';
        input.rows = 1;
    }

    // Add REPL log entry
    function addReplLog(value: any, type: 'input' | 'output' | 'error') {
        const logsContainer = document.querySelector('.virtual-console-logs');
        if (!logsContainer) return;

        const entry = document.createElement('div');
        entry.className = `virtual-console-log-entry repl-${type}`;

        const prefix = document.createElement('span');
        prefix.className = 'repl-prefix';
        prefix.textContent = type === 'input' ? '> ' : type === 'error' ? '✗ ' : '← ';

        const content = document.createElement('div');
        content.className = 'virtual-console-content';

        if (type === 'input') {
            const codeEl = document.createElement('code');
            codeEl.textContent = value;
            content.appendChild(codeEl);
        } else if (type === 'error') {
            const errorEl = createObjectViewer(value);
            content.appendChild(errorEl);
        } else {
            const outputEl = formatOutput(value);
            content.appendChild(outputEl);
        }

        entry.appendChild(prefix);
        entry.appendChild(content);
        logsContainer.appendChild(entry);

        // Auto-scroll
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Event listeners
    input.addEventListener('input', () => {
        // Auto-resize textarea
        input.rows = Math.min(5, input.value.split('\n').length);

        updateAutocomplete();
        updatePreview();
    });

    input.addEventListener('keydown', (e) => {
        // Handle Enter key
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            execute();
            return;
        }

        // Handle Tab for autocomplete
        if (e.key === 'Tab' && autocompleteDropdown.style.display === 'block') {
            e.preventDefault();
            if (currentSuggestions.length > 0) {
                const index = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0;
                const suggestion = currentSuggestions[index];
                const cursorPos = input.selectionStart || 0;
                const textBeforeCursor = input.value.substring(0, cursorPos);
                const match = textBeforeCursor.match(/[\w.]+$/);
                const currentWord = match ? match[0] : '';
                applySuggestion(suggestion.value, currentWord);
            }
            return;
        }

        // Handle arrow keys for autocomplete navigation
        if (autocompleteDropdown.style.display === 'block' && currentSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
                updateAutocompletSelection();
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
                updateAutocompletSelection();
                return;
            }
        }

        // Handle arrow keys for history when autocomplete is not shown
        if (autocompleteDropdown.style.display === 'none') {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = replContext.getPreviousCommand();
                if (prev !== null) {
                    input.value = prev;
                    input.rows = Math.min(5, prev.split('\n').length);
                    updatePreview();
                }
                return;
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = replContext.getNextCommand();
                if (next !== null) {
                    input.value = next;
                    input.rows = Math.min(5, next.split('\n').length);
                    updatePreview();
                }
                return;
            }
        }

        // Escape to close autocomplete
        if (e.key === 'Escape') {
            autocompleteDropdown.style.display = 'none';
            previewContainer.style.display = 'none';
        }
    });

    function updateAutocompletSelection() {
        const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            if (index === selectedSuggestionIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    submitBtn.addEventListener('click', execute);

    inputContainer.appendChild(input);
    inputContainer.appendChild(submitBtn);

    replContainer.appendChild(inputContainer);
    replContainer.appendChild(previewContainer);
    replContainer.appendChild(autocompleteDropdown);

    return replContainer;
}
