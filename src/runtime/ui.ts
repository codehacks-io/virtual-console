import { CONFIG } from './config';
import { getTimestamp } from './utils';
import { createObjectViewer } from './object-viewer';
import { THEME_CONFIG, cycleTheme, initThemeIndex } from './theme';
import { LogType } from './types';
import { createRepl } from './repl';

let container: HTMLElement | null = null;
let logsContainer: HTMLElement | null = null;
let isVisible = false;
let consoleHeight = CONFIG.defaultHeight;

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
    logsContainer.innerHTML = '';
    addLog(['Console cleared'], 'info');
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
    logsContainer.appendChild(entry);

    // Limit log count
    while (logsContainer.children.length > CONFIG.maxLogs) {
        if (logsContainer.firstChild) {
            logsContainer.removeChild(logsContainer.firstChild);
        }
    }

    // Auto-scroll
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

/**
 * Sets up resize
 */
function setupResize(handle: HTMLElement) {
    let startY = 0;
    let startHeight = 0;
    let isResizing = false;

    function startResize(e: MouseEvent | TouchEvent) {
        isResizing = true;
        startY = e.type === 'touchstart' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        startHeight = consoleHeight;
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }

    function resize(e: MouseEvent | TouchEvent) {
        if (!isResizing) return;
        const currentY = e.type === 'touchmove' ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        const deltaY = startY - currentY;
        const newHeight = Math.max(
            CONFIG.minHeight,
            Math.min(CONFIG.maxHeight, startHeight + deltaY)
        );
        consoleHeight = newHeight;
        if (container) {
            container.style.height = `${newHeight}px`;
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
    container.style.height = `${consoleHeight}px`;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'virtual-console-resize-handle';

    const header = document.createElement('div');
    header.className = 'virtual-console-header';

    const title = document.createElement('div');
    title.className = 'virtual-console-title';
    title.textContent = '🔍 Debug Console';

    const controls = document.createElement('div');
    controls.className = 'virtual-console-controls';

    // Add theme button if multiple themes are available
    if (THEME_CONFIG.availableThemes.length > 1) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'virtual-console-button';
        themeBtn.textContent = '🎨 Theme';
        themeBtn.title = 'Cycle through available themes';
        themeBtn.onclick = () => container && cycleTheme(container);
        controls.appendChild(themeBtn);
    }

    const clearBtn = document.createElement('button');
    clearBtn.className = 'virtual-console-button';
    clearBtn.textContent = 'Clear';
    clearBtn.onclick = clearLogs;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'virtual-console-button';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = toggleConsole;

    controls.appendChild(clearBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);

    logsContainer = document.createElement('div');
    logsContainer.className = 'virtual-console-logs';

    // Create REPL
    const replElement = createRepl();

    container.appendChild(resizeHandle);
    container.appendChild(header);
    container.appendChild(logsContainer);
    container.appendChild(replElement);
    document.body.appendChild(container);

    setupResize(resizeHandle);

    addLog(['Debug Console initialized'], 'info'); // Changed from success to info as success isn't a standard log type
}
