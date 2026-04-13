import { getConfig } from './config';
import { getTimestamp } from './utils';
import { createObjectViewer } from './object-viewer';
import { repl } from './repl';
import { THEME_CONFIG, cycleTheme, initThemeIndex } from './theme';
import { LogType } from './types';

let container: HTMLElement | null = null;
let logsContainer: HTMLElement | null = null;
let isVisible = false;

type DockPosition = 'bottom' | 'top' | 'left' | 'right';
let dockPosition: DockPosition = (localStorage.getItem('vc_dock_pos') as DockPosition) || 'bottom';
let consoleWidth = parseInt(localStorage.getItem('vc_dock_width') || '400', 10);
let consoleHeight = parseInt(localStorage.getItem('vc_dock_height') || getConfig().defaultHeight.toString(), 10);


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
    const repl = logsContainer.querySelector('.virtual-console-repl');
    logsContainer.innerHTML = '';
    if (repl) {
        logsContainer.appendChild(repl);
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
export function addLog(args: any[], type: LogType = 'info') {
    if (!logsContainer) return;

    const entry = document.createElement('div');
    entry.className = `virtual-console-log-entry virtual-console-log-${type}`;

    const timestamp = document.createElement('span');
    timestamp.className = 'virtual-console-timestamp';
    timestamp.textContent = `[${getTimestamp()}]`;

    const content = document.createElement('div');
    content.className = 'virtual-console-content';

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

    entry.appendChild(timestamp);
    entry.appendChild(content);

    // Insert before REPL if it exists
    const repl = logsContainer.querySelector('.virtual-console-repl');
    if (repl) {
        logsContainer.insertBefore(entry, repl);
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
            localStorage.setItem('vc_dock_pos', dockPosition);
            applyDockPosition();
        }
    }

    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    header.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
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
            localStorage.setItem('vc_dock_height', consoleHeight.toString());
        } else if (dockPosition === 'top') {
            const deltaY = currentY - startY;
            consoleHeight = Math.max(config.minHeight, Math.min(config.maxHeight, startHeight + deltaY));
            if (container) container.style.height = `${consoleHeight}px`;
            localStorage.setItem('vc_dock_height', consoleHeight.toString());
        } else if (dockPosition === 'left') {
            const deltaX = currentX - startX;
            consoleWidth = Math.max(200, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
            if (container) container.style.width = `${consoleWidth}px`;
            localStorage.setItem('vc_dock_width', consoleWidth.toString());
        } else if (dockPosition === 'right') {
            const deltaX = startX - currentX;
            consoleWidth = Math.max(200, Math.min(window.innerWidth * 0.8, startWidth + deltaX));
            if (container) container.style.width = `${consoleWidth}px`;
            localStorage.setItem('vc_dock_width', consoleWidth.toString());
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
}

/**
 * Creates console DOM
 */
export function createConsole() {
    container = document.createElement('div');

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

    if (THEME_CONFIG.availableThemes.length > 1) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'virtual-console-button';
        themeBtn.title = 'Cycle Theme';
        themeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>';
        themeBtn.onclick = () => container && cycleTheme(container);
        controls.appendChild(themeBtn);
    }

    const clearBtn = document.createElement('button');
    clearBtn.className = 'virtual-console-button';
    clearBtn.title = 'Clear Logs';
    clearBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>';
    clearBtn.onclick = clearLogs;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'virtual-console-button';
    closeBtn.title = 'Close Console';
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.onclick = toggleConsole;

    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    logsContainer = document.createElement('div');
    logsContainer.className = 'virtual-console-logs';

    container.appendChild(resizeHandle);
    container.appendChild(header);
    container.appendChild(logsContainer);

    // REPL Container
    const replContainer = document.createElement('div');
    replContainer.className = 'virtual-console-repl';

    // Suggestions Popup
    const suggestionsBox = document.createElement('div');
    suggestionsBox.className = 'virtual-console-suggestions';
    suggestionsBox.style.display = 'none';
    replContainer.appendChild(suggestionsBox);

    // Input Wrapper (for ghost text)
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'virtual-console-input-wrapper';

    // Input Field
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'virtual-console-input';
    input.placeholder = 'Run command...';
    input.spellcheck = false;
    input.autocapitalize = 'off';
    input.autocomplete = 'off';
    inputWrapper.appendChild(input);

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

    container.appendChild(resizeHandle);
    container.appendChild(header);
    container.appendChild(logsContainer);

    const config = getConfig();
    if (config.targetElement) {
        config.targetElement.appendChild(container);
        // If mounting to a custom element, we might want absolute positioning relative to it
        // But for now, we keep the default styles (fixed) unless overridden by CSS
        // Actually, if it's a custom container, 'absolute' is usually better if the container is relative
        // Let's force absolute if target is not body?
        if (config.targetElement !== document.body) {
            container.style.position = 'absolute';
        }
    } else {
        document.body.appendChild(container);
    }

    setupResize(resizeHandle);
    setupDragAndDrop(header);
    setupREPL(input, runBtn, ghostText, suggestionsBox, replContainer);

    addLog(['Debug Console initialized'], 'info');
}



function setupREPL(
    input: HTMLInputElement,
    runBtn: HTMLButtonElement,
    ghostText: HTMLElement,
    suggestionsBox: HTMLElement,
    replContainer: HTMLElement
) {
    // Focus input when clicking anywhere in the REPL area
    replContainer.addEventListener('click', (e) => {
        // Don't focus if clicking button or suggestions
        if (e.target === replContainer || e.target === replContainer.querySelector('.virtual-console-input-wrapper')) {
            input.focus();
        }
    });

    const execute = () => {
        const cmd = input.value;
        if (cmd) {
            repl.execute(cmd);
            input.value = '';
            ghostText.textContent = '';
            suggestionsBox.style.display = 'none';

            // Scroll to bottom to show new log and REPL
            if (logsContainer) {
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }
        }
    };

    runBtn.onclick = execute;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            execute();
        } else if (e.key === 'ArrowUp') {
            const prev = repl.getHistoryPrevious();
            if (prev !== null) {
                input.value = prev;
                // Move cursor to end
                setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
            }
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            const next = repl.getHistoryNext();
            if (next !== null) {
                input.value = next;
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

        // Pre-evaluation
        const result = repl.preEvaluate(val);
        if (result !== undefined) {
            ghostText.innerHTML = '';
            // We want to show the result as a preview. 
            // Reuse createObjectViewer but maybe simplified?
            // Or just text content for simple primitives?
            // createObjectViewer returns an element.
            const viewer = createObjectViewer(result);
            ghostText.appendChild(viewer);
        } else {
            ghostText.textContent = '';
        }

        // Autocompletion
        const suggestions = repl.getSuggestions(val);
        if (suggestions.length > 0) {
            suggestionsBox.innerHTML = '';
            suggestions.forEach(s => {
                const div = document.createElement('div');
                div.className = 'vc-suggestion';
                div.textContent = s;
                div.onclick = () => {
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
                };
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
