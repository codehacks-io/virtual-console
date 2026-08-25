import { getConfig } from './config';
import { debounce, getTimestamp } from './utils';
import { createIcon, ensureIconSprite } from './icons';
import type { IconName } from './icons';
import { createObjectViewer } from './object-viewer';
import { repl } from './repl';
import { highlightCode } from './syntax-highlighter';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';
import { cycleTheme, getThemeConfig, initThemeIndex } from './theme';
import type { LogType } from './types';

let container: HTMLElement | null = null;
let logsContainer: HTMLElement | null = null;
let isVisible = false;
let teardownCallbacks: Array<() => void> = [];

type DockPosition = 'bottom' | 'top' | 'left' | 'right';

function isDockPosition(value: string | null): value is DockPosition {
    return value === 'bottom' || value === 'top' || value === 'left' || value === 'right';
}

const savedDockPosition = getStorageItem(STORAGE_KEYS.dockPosition);
let dockPosition: DockPosition = isDockPosition(savedDockPosition) ? savedDockPosition : 'bottom';
let consoleWidth = parseInt(getStorageItem(STORAGE_KEYS.dockWidth) || String(getConfig().defaultWidth), 10);
let consoleHeight = parseInt(getStorageItem(STORAGE_KEYS.dockHeight) || String(getConfig().defaultHeight), 10);

function addTeardown(callback: () => void) {
    teardownCallbacks.push(callback);
}

/**
 * Toggles console visibility
 */
export function toggleConsole() {
    if (!container) return;
    isVisible = !isVisible;
    container.classList.toggle('virtual-console-visible', isVisible);
}

/**
 * Clears logs
 */
function clearLogs() {
    if (!logsContainer) return;
    const replElement = logsContainer.querySelector('.virtual-console-repl');
    logsContainer.innerHTML = '';
    if (replElement) {
        logsContainer.appendChild(replElement);
    }
}

/**
 * Creates a styled text element from CSS string
 */
function createStyledElement(text: string, cssText: string): HTMLElement {
    const span = document.createElement('span');
    span.textContent = text;

    // Apply CSS safely (filter out potentially harmful properties)
    if (cssText) {
        try {
            // Create a temporary element to parse CSS
            const temp = document.createElement('div');
            temp.style.cssText = cssText;

            // Allow only safe styling properties
            const safeProps = [
                'color', 'background', 'background-color', 'font-size',
                'font-weight', 'font-style', 'font-family', 'text-decoration',
                'text-transform', 'letter-spacing', 'padding', 'margin',
                'border', 'border-radius', 'opacity', 'text-shadow'
            ];

            safeProps.forEach(prop => {
                // Convert kebab-case to camelCase for style property access
                const camelProp = prop.replace(/-./g, x => x[1].toUpperCase());
                const value = temp.style[camelProp as any];
                if (value) {
                    span.style[camelProp as any] = value;
                }
            });
        } catch (e) {
            // If CSS parsing fails, just use plain text
            console.error('Failed to parse CSS:', cssText, e);
        }
    }

    return span;
}

/**
 * Processes Chrome console %c styling syntax
 */
function processStyledArgs(args: any[]): { type: 'text' | 'styled' | 'value', value: any, style?: string }[] {
    const result: { type: 'text' | 'styled' | 'value', value: any, style?: string }[] = [];
    let i = 0;

    while (i < args.length) {
        const arg = args[i];

        // Check if this is a string with %c directives
        if (typeof arg === 'string' && arg.includes('%c')) {
            const parts = arg.split('%c');
            let styleIndex = i + 1;

            // First part has no style
            if (parts[0]) {
                result.push({ type: 'text', value: parts[0] });
            }

            // Process each %c part with its corresponding style
            for (let j = 1; j < parts.length; j++) {
                const text = parts[j];
                const style = styleIndex < args.length && typeof args[styleIndex] === 'string'
                    ? args[styleIndex]
                    : '';

                if (text) {
                    result.push({ type: 'styled', value: text, style: style });
                }

                if (style) {
                    styleIndex++;
                }
            }

            // Skip the style arguments we've consumed
            i = styleIndex;
        } else {
            // Regular argument, not a styled string
            result.push({ type: 'value', value: arg });
            i++;
        }
    }

    return result;
}

/**
 * Adds a log entry
 */
const LOG_ICONS: Partial<Record<LogType, IconName>> = {
    command: 'prompt',
    result: 'result',
    error: 'error',
    warn: 'warning'
};

export function addLog(args: any[], type: LogType = 'info') {
    if (!logsContainer) return;

    const entry = document.createElement('div');
    entry.className = `virtual-console-log-entry virtual-console-log-${type}`;

    const icon = LOG_ICONS[type];
    if (icon) {
        entry.appendChild(createIcon(icon, 'virtual-console-log-icon'));
    }

    const timestamp = document.createElement('span');
    timestamp.className = 'virtual-console-timestamp';
    timestamp.textContent = `[${getTimestamp()}]`;

    const content = document.createElement('div');
    content.className = 'virtual-console-content';

    if (type === 'command' && typeof args[0] === 'string') {
        // The echoed REPL command is source code, not a logged string value -
        // render it with the same tokenizer the live input uses instead of
        // createObjectViewer(), which would just quote it like any other string.
        content.innerHTML = highlightCode(args[0]);
    } else {
        // Process arguments for %c styling
        const processedArgs = processStyledArgs(args);

        processedArgs.forEach((item) => {
            if (item.type === 'styled') {
                // Styled text
                const styledEl = createStyledElement(item.value, item.style || '');
                content.appendChild(styledEl);
            } else if (item.type === 'text') {
                // Plain text from split
                const textSpan = document.createElement('span');
                textSpan.textContent = item.value;
                content.appendChild(textSpan);
            } else {
                // Regular value - use object viewer
                const viewer = createObjectViewer(item.value);
                content.appendChild(viewer);
            }
        });
    }

    entry.appendChild(timestamp);
    entry.appendChild(content);

    // Insert before REPL if it exists
    const replElement = logsContainer.querySelector('.virtual-console-repl');
    if (replElement) {
        logsContainer.insertBefore(entry, replElement);
    } else {
        logsContainer.appendChild(entry);
    }

    // Limit log count (excluding REPL)
    const maxLogs = getConfig().maxLogs;
    // Count only log entries
    const logEntries = logsContainer.querySelectorAll('.virtual-console-log-entry');
    if (logEntries.length > maxLogs) {
        // Remove the first one
        if (logEntries[0]) {
            logsContainer.removeChild(logEntries[0]);
        }
    }

    // Auto-scroll
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function applyDockPosition() {
    if (!container) return;
    
    container.classList.remove('dock-top', 'dock-bottom', 'dock-left', 'dock-right');
    container.classList.add(`dock-${dockPosition}`);
    
    // Reset dimensions
    container.style.width = '';
    container.style.height = '';
    
    if (dockPosition === 'bottom' || dockPosition === 'top') {
        container.style.height = `${consoleHeight}px`;
        container.style.width = '100%';
    } else {
        container.style.width = `${consoleWidth}px`;
        container.style.height = '100%';
    }
}

function setupDockMenu(btn: HTMLElement) {
    const menu = document.createElement('div');
    menu.className = 'vc-dock-menu';
    menu.style.display = 'none';

    // SVG Icons mimicking dock targets
    const createBtn = (dir: DockPosition, svgParams: string) => {
        const dBtn = document.createElement('button');
        dBtn.className = `vc-dock-menu-btn vc-dock-btn-${dir}`;
        dBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgParams}</svg>`;
        dBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dockPosition = dir;
            setStorageItem(STORAGE_KEYS.dockPosition, dockPosition);
            applyDockPosition();
            menu.style.display = 'none';
        });
        return dBtn;
    };

    // Up Icon
    menu.appendChild(createBtn('top', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="3" y="3" width="18" height="6" rx="2" ry="2" fill="currentColor" fill-opacity="0.3"></rect>'));
    // Down Icon
    menu.appendChild(createBtn('bottom', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="3" y="15" width="18" height="6" rx="2" ry="2" fill="currentColor" fill-opacity="0.3"></rect>'));
    // Left Icon
    menu.appendChild(createBtn('left', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="3" y="3" width="6" height="18" rx="2" ry="2" fill="currentColor" fill-opacity="0.3"></rect>'));
    // Right Icon
    menu.appendChild(createBtn('right', '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="15" y="3" width="6" height="18" rx="2" ry="2" fill="currentColor" fill-opacity="0.3"></rect>'));

    btn.appendChild(menu);
    btn.style.position = 'relative';

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'grid' : 'none';
    });

    const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node) && e.target !== btn && !btn.contains(e.target as Node)) {
            menu.style.display = 'none';
        }
    };

    document.addEventListener('click', closeMenu);
    addTeardown(() => document.removeEventListener('click', closeMenu));
}

function setupDragAndDrop(header: HTMLElement) {
    let isDragging = false;
    let overlay: HTMLElement | null = null;
    let currentDropZone: DockPosition | null = null;

    function startDrag(e: MouseEvent | TouchEvent) {
        // Prevent drag on buttons
        if ((e.target as HTMLElement).closest('.virtual-console-button')) return;
        
        isDragging = true;
        document.body.style.userSelect = 'none';
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'vc-drag-overlay';
            document.body.appendChild(overlay);
        }
    }

    function drag(e: MouseEvent | TouchEvent) {
        if (!isDragging || !overlay) return;
        
        const clientX = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Calculate distances to edges to snap
        const distTop = clientY;
        const distBottom = h - clientY;
        const distLeft = clientX;
        const distRight = w - clientX;
        
        const minDist = Math.min(distTop, distBottom, distLeft, distRight);
        
        overlay.style.display = 'block';
        
        if (minDist === distTop) {
            currentDropZone = 'top';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '20vh';
        } else if (minDist === distBottom) {
            currentDropZone = 'bottom';
            overlay.style.top = '80vh';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '20vh';
        } else if (minDist === distLeft) {
            currentDropZone = 'left';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '20vw';
            overlay.style.height = '100vh';
        } else if (minDist === distRight) {
            currentDropZone = 'right';
            overlay.style.top = '0';
            overlay.style.left = '80vw';
            overlay.style.width = '20vw';
            overlay.style.height = '100vh';
        }
    }

    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        
        if (overlay) {
            overlay.style.display = 'none';
        }

        if (currentDropZone && currentDropZone !== dockPosition) {
            dockPosition = currentDropZone;
            setStorageItem(STORAGE_KEYS.dockPosition, dockPosition);
            applyDockPosition();
        }
    }

    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);

    addTeardown(() => {
        header.removeEventListener('mousedown', startDrag);
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        header.removeEventListener('touchstart', startDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
        overlay?.remove();
        document.body.style.userSelect = '';
    });
}

/**
 * Sets up resize
 */
function setupResize(handle: HTMLElement) {
    let startX = 0, startY = 0;
    let startWidth = 0, startHeight = 0;
    let isResizing = false;

    function startResize(e: MouseEvent | TouchEvent) {
        isResizing = true;
        startX = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        startY = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        startWidth = consoleWidth;
        startHeight = consoleHeight;
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }

    function resize(e: MouseEvent | TouchEvent) {
        if (!isResizing) return;
        const currentX = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const currentY = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        const config = getConfig();

        if (dockPosition === 'bottom') {
            const deltaY = startY - currentY;
            consoleHeight = Math.max(config.minHeight, Math.min(config.maxHeight, startHeight + deltaY));
            if (container) container.style.height = `${consoleHeight}px`;
            setStorageItem(STORAGE_KEYS.dockHeight, consoleHeight.toString());
        } else if (dockPosition === 'top') {
            const deltaY = currentY - startY;
            consoleHeight = Math.max(config.minHeight, Math.min(config.maxHeight, startHeight + deltaY));
            if (container) container.style.height = `${consoleHeight}px`;
            setStorageItem(STORAGE_KEYS.dockHeight, consoleHeight.toString());
        } else if (dockPosition === 'left') {
            const deltaX = currentX - startX;
            consoleWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + deltaX));
            if (container) container.style.width = `${consoleWidth}px`;
            setStorageItem(STORAGE_KEYS.dockWidth, consoleWidth.toString());
        } else if (dockPosition === 'right') {
            const deltaX = startX - currentX;
            consoleWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + deltaX));
            if (container) container.style.width = `${consoleWidth}px`;
            setStorageItem(STORAGE_KEYS.dockWidth, consoleWidth.toString());
        }
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.userSelect = '';
    }

    handle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
    handle.addEventListener('touchstart', startResize, { passive: false });
    document.addEventListener('touchmove', resize, { passive: false });
    document.addEventListener('touchend', stopResize);

    addTeardown(() => {
        handle.removeEventListener('mousedown', startResize);
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        handle.removeEventListener('touchstart', startResize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stopResize);
        document.body.style.userSelect = '';
    });
}

/**
 * Creates console DOM
 */
export function createConsole() {
    destroyConsole();
    container = document.createElement('div');
    const config = getConfig();

    ensureIconSprite(container);

    // Load saved theme or use default
    const initialTheme = initThemeIndex();

    container.className = `virtual-console-container theme-${initialTheme}`;
    applyDockPosition();

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'virtual-console-resize-handle';

    const header = document.createElement('div');
    header.className = 'virtual-console-header';

    const title = document.createElement('div');
    title.className = 'virtual-console-title';
    title.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Debug Console';

    const controls = document.createElement('div');
    controls.className = 'virtual-console-controls';

    if (getThemeConfig().availableThemes.length > 1) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'virtual-console-button';
        themeBtn.title = 'Cycle Theme';
        themeBtn.setAttribute('aria-label', 'Cycle Theme');
        themeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>';
        themeBtn.addEventListener('click', () => container && cycleTheme(container));
        controls.appendChild(themeBtn);
    }

    const dockBtn = document.createElement('button');
    dockBtn.className = 'virtual-console-button';
    dockBtn.title = 'Dock Position';
    dockBtn.setAttribute('aria-label', 'Dock Position');
    dockBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="3" y="15" width="18" height="6" rx="2" ry="2"></rect></svg>';
    setupDockMenu(dockBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'virtual-console-button';
    clearBtn.title = 'Clear Logs';
    clearBtn.setAttribute('aria-label', 'Clear Logs');
    clearBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>';
    clearBtn.addEventListener('click', clearLogs);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'virtual-console-button';
    closeBtn.title = 'Close Console';
    closeBtn.setAttribute('aria-label', 'Close Console');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.addEventListener('click', toggleConsole);

    controls.appendChild(dockBtn);
    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    logsContainer = document.createElement('div');
    logsContainer.className = 'virtual-console-logs';

    container.appendChild(resizeHandle);
    container.appendChild(header);
    container.appendChild(logsContainer);

    if (config.replEnabled) {
        // REPL Container
        const replContainer = document.createElement('div');
        replContainer.className = 'virtual-console-repl';

        // Suggestions Popup
        const suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'virtual-console-suggestions';
        suggestionsBox.style.display = 'none';
        replContainer.appendChild(suggestionsBox);

        // Input Wrapper (for ghost text and syntax highlighting)
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'virtual-console-input-wrapper';

        // Highlight Backdrop (renders highlighted code behind the transparent input)
        const highlightBackdrop = document.createElement('div');
        highlightBackdrop.className = 'virtual-console-highlight-backdrop';
        inputWrapper.appendChild(highlightBackdrop);

        // Input Field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'virtual-console-input';
        input.placeholder = 'Run command...';
        input.setAttribute('aria-label', 'Console command input');
        input.spellcheck = false;
        input.autocapitalize = 'off';
        input.autocomplete = 'off';
        inputWrapper.appendChild(input);

        // Prompt icon - a sibling *after* input (not a ::before on the
        // wrapper) so :not(:placeholder-shown) ~ selector below can style it
        // based on whether the input actually has content.
        inputWrapper.appendChild(createIcon('prompt', 'virtual-console-prompt-icon'));

        // Ghost Text (Pre-evaluation result)
        const ghostText = document.createElement('div');
        ghostText.className = 'virtual-console-ghost';
        inputWrapper.appendChild(ghostText);

        // Run Button
        const runBtn = document.createElement('button');
        runBtn.className = 'virtual-console-run-btn';
        runBtn.textContent = 'Run';

        replContainer.appendChild(inputWrapper);
        replContainer.appendChild(runBtn);

        // Append REPL to logs container (as the last item)
        logsContainer.appendChild(replContainer);

        setupREPL(input, runBtn, ghostText, suggestionsBox, replContainer, highlightBackdrop);
    }

    if (config.targetElement) {
        config.targetElement.appendChild(container);

        // A custom target only positions our (position: absolute) container
        // correctly if it establishes its own positioning context. Rather
        // than requiring every consumer to remember to set that up, promote
        // a `static` target to `relative` ourselves; leave anything the
        // consumer already positioned (relative/absolute/fixed/sticky) alone.
        if (config.targetElement !== document.body) {
            if (window.getComputedStyle(config.targetElement).position === 'static') {
                config.targetElement.style.position = 'relative';
            }
            container.style.position = 'absolute';
        }
    } else {
        document.body.appendChild(container);
    }

    setupResize(resizeHandle);
    setupDragAndDrop(header);

    const onEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isVisible) {
            toggleConsole();
        }
    };
    container.addEventListener('keydown', onEscape);
    addTeardown(() => container?.removeEventListener('keydown', onEscape));

    addLog(['Debug Console initialized'], 'info');

    return destroyConsole;
}

export function destroyConsole() {
    teardownCallbacks.forEach((callback) => callback());
    teardownCallbacks = [];
    container?.remove();
    container = null;
    logsContainer = null;
    isVisible = false;
}



function setupREPL(
    input: HTMLInputElement,
    runBtn: HTMLButtonElement,
    ghostText: HTMLElement,
    suggestionsBox: HTMLElement,
    replContainer: HTMLElement,
    highlightBackdrop: HTMLElement
) {
    // Focus input when clicking anywhere in the REPL area
    replContainer.addEventListener('click', (e) => {
        // Don't focus if clicking button or suggestions
        if (e.target === replContainer || e.target === replContainer.querySelector('.virtual-console-input-wrapper')) {
            input.focus();
        }
    });

    // Debounced so retyping fast on mobile doesn't re-tokenize on every keystroke
    const updateHighlight = debounce((code: string) => {
        highlightBackdrop.innerHTML = highlightCode(code);
    }, 50);

    const execute = () => {
        const cmd = input.value;
        if (cmd) {
            repl.execute(cmd);
            input.value = '';
            highlightBackdrop.innerHTML = '';
            ghostText.textContent = '';
            suggestionsBox.style.display = 'none';

            // Scroll to bottom to show new log and REPL
            if (logsContainer) {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
        }
    };

    runBtn.addEventListener('click', execute);

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            execute();
        } else if (e.key === 'ArrowUp') {
            const prev = repl.getHistoryPrevious();
            if (prev !== null) {
                input.value = prev;
                input.dispatchEvent(new Event('input'));
                // Move cursor to end
                setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
            }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            const next = repl.getHistoryNext();
            if (next !== null) {
                input.value = next;
                input.dispatchEvent(new Event('input'));
            }
            e.preventDefault();
        } else if (e.key === 'Tab') {
            // Accept first suggestion
            if (suggestionsBox.style.display !== 'none' && suggestionsBox.firstChild) {
                const suggestion = suggestionsBox.firstChild.textContent;
                if (suggestion) {
                    // Replace the last part of input with suggestion
                    const lastDot = input.value.lastIndexOf('.');
                    if (lastDot !== -1) {
                        input.value = input.value.substring(0, lastDot + 1) + suggestion;
                    } else {
                        input.value = suggestion;
                    }
                    suggestionsBox.style.display = 'none';
                    // Trigger input event to update ghost text
                    input.dispatchEvent(new Event('input'));
                }
            }
            e.preventDefault();
        }
    });

    input.addEventListener('input', () => {
        const val = input.value;

        updateHighlight(val);

        // Pre-evaluation preview
        const result = repl.preEvaluate(val);
        if (result !== undefined) {
            ghostText.innerHTML = '';
            ghostText.appendChild(createIcon('result', 'virtual-console-ghost-icon'));
            ghostText.appendChild(createObjectViewer(result));
        } else {
            ghostText.innerHTML = '';
        }

        // Autocompletion
        const suggestions = repl.getSuggestions(val);
        if (suggestions.length > 0) {
            suggestionsBox.innerHTML = '';
            suggestions.forEach(s => {
                const div = document.createElement('div');
                div.className = 'vc-suggestion';
                div.textContent = s;
                div.addEventListener('click', () => {
                    // Replace logic similar to Tab
                    const lastDot = input.value.lastIndexOf('.');
                    if (lastDot !== -1) {
                        input.value = input.value.substring(0, lastDot + 1) + s;
                    } else {
                        input.value = s;
                    }
                    suggestionsBox.style.display = 'none';
                    input.focus();
                    // Trigger input event to update ghost text
                    input.dispatchEvent(new Event('input'));
                });
                suggestionsBox.appendChild(div);
            });
            suggestionsBox.style.display = 'block';

            // Position suggestions above input
            suggestionsBox.style.bottom = '100%';
            // Left is handled by CSS (16px)
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    // Hide suggestions on blur (delayed to allow click)
    input.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsBox.style.display = 'none';
        }, 200);
    });
}
