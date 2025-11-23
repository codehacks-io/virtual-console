
/**
 * Virtual Debug Console with Interactive Object Viewer
 * Chrome DevTools-like expandable object inspection
 */
(function () {
    'use strict';
    console.log("injecting virtual console")

    // Configuration
    const CONFIG = {
        maxLogs: 100,
        minHeight: 100,
        maxHeight: window.innerHeight * 0.8,
        defaultHeight: 200,
        keyboardShortcut: 'KeyC', // Shift+C to toggle
        longPressFingers: 2, // amount of fingers long press to toggle
        longPressDuration: 500 // milliseconds to hold fingers to toggle
    };

    // Theme configuration from Vite plugin
    const THEME_CONFIG = window.__VIRTUAL_CONSOLE_CONFIG__ || {
        availableThemes: ['vscode'],
        defaultTheme: 'vscode'
    };

    // State
    let isVisible = false;
    let consoleHeight = CONFIG.defaultHeight;
    let currentThemeIndex = 0;
    let longPressTimer = null;
    let currentTouchCount = 0;

    // DOM elements
    let container = null;
    let logsContainer = null;

    /**
     * Gets the constructor name or type of a value
     */
    function getType(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'Array';
        if (value instanceof Map) return 'Map';
        if (value instanceof Set) return 'Set';
        if (value instanceof Date) return 'Date';
        if (value instanceof RegExp) return 'RegExp';
        if (value instanceof Error) return 'Error';
        if (typeof value === 'object') {
            return value.constructor ? value.constructor.name : 'Object';
        }
        return typeof value;
    }

    /**
     * Gets the size/length of a collection
     */
    function getSize(value) {
        if (Array.isArray(value)) return value.length;
        if (value instanceof Map || value instanceof Set) return value.size;
        if (typeof value === 'object' && value !== null) {
            return Object.keys(value).length;
        }
        return null;
    }

    /**
     * Creates an expandable object viewer element
     */
    function createObjectViewer(value, seen = new WeakSet()) {
        const container = document.createElement('span');
        container.className = 'vc-value';

        // Handle primitives
        if (value === null) {
            container.className += ' vc-null';
            container.textContent = 'null';
            return container;
        }

        if (value === undefined) {
            container.className += ' vc-undefined';
            container.textContent = 'undefined';
            return container;
        }

        if (typeof value === 'string') {
            container.className += ' vc-string';
            container.textContent = `"${value}"`;
            return container;
        }

        if (typeof value === 'number') {
            container.className += ' vc-number';
            container.textContent = String(value);
            return container;
        }

        if (typeof value === 'boolean') {
            container.className += ' vc-boolean';
            container.textContent = String(value);
            return container;
        }

        if (typeof value === 'function') {
            container.className += ' vc-function';
            const name = value.name || 'anonymous';
            container.textContent = `ƒ ${name}()`;
            return container;
        }

        if (typeof value === 'symbol') {
            container.className += ' vc-symbol';
            container.textContent = value.toString();
            return container;
        }

        // Handle objects and arrays
        if (typeof value === 'object') {
            // Check for circular reference
            if (seen.has(value)) {
                container.className += ' vc-circular';
                container.textContent = '[Circular Reference]';
                return container;
            }

            seen.add(value);

            const objContainer = document.createElement('div');
            objContainer.className = 'vc-object-container';

            const header = document.createElement('div');
            header.className = 'vc-object-header';

            const expandIcon = document.createElement('span');
            expandIcon.className = 'vc-expand-icon';

            const typeSpan = document.createElement('span');
            typeSpan.className = 'vc-object-type';
            const type = getType(value);
            const size = getSize(value);
            typeSpan.textContent = size !== null ? `${type}(${size})` : type;

            const preview = document.createElement('span');
            preview.className = 'vc-object-preview';

            // Create preview text
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    preview.textContent = ' []';
                } else {
                    const previewItems = value.slice(0, 3).map(item => {
                        if (typeof item === 'object' && item !== null) {
                            return '{...}';
                        }
                        return JSON.stringify(item);
                    }).join(', ');
                    preview.textContent = ` [${previewItems}${value.length > 3 ? ', ...' : ''}]`;
                }
            } else if (value instanceof Map) {
                preview.textContent = value.size === 0 ? ' {}' : ' {...}';
            } else if (value instanceof Set) {
                preview.textContent = value.size === 0 ? ' {}' : ' {...}';
            } else {
                const keys = Object.keys(value);
                if (keys.length === 0) {
                    preview.textContent = ' {}';
                } else {
                    const previewKeys = keys.slice(0, 3).join(', ');
                    preview.textContent = ` {${previewKeys}${keys.length > 3 ? ', ...' : ''}}`;
                }
            }

            header.appendChild(expandIcon);
            header.appendChild(typeSpan);
            header.appendChild(preview);

            const propertiesContainer = document.createElement('div');
            propertiesContainer.className = 'vc-object-properties';

            // Toggle expand/collapse
            let isExpanded = false;
            header.onclick = (e) => {
                e.stopPropagation();
                isExpanded = !isExpanded;
                expandIcon.classList.toggle('expanded', isExpanded);
                propertiesContainer.classList.toggle('expanded', isExpanded);

                // Lazy load properties on first expand
                if (isExpanded && propertiesContainer.children.length === 0) {
                    loadProperties(value, propertiesContainer, seen);
                }
            };

            objContainer.appendChild(header);
            objContainer.appendChild(propertiesContainer);
            container.appendChild(objContainer);
        }

        return container;
    }

    /**
     * Loads properties into the expandable container
     */
    function loadProperties(value, container, seen) {
        try {
            // Handle arrays
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    const propDiv = document.createElement('div');
                    propDiv.className = 'vc-property';

                    const indexSpan = document.createElement('span');
                    indexSpan.className = 'vc-array-index';
                    indexSpan.textContent = `${index}:`;

                    propDiv.appendChild(indexSpan);
                    propDiv.appendChild(createObjectViewer(item, seen));
                    container.appendChild(propDiv);
                });

                // Add length pseudo-property
                const lengthDiv = document.createElement('div');
                lengthDiv.className = 'vc-property';

                const lengthKey = document.createElement('span');
                lengthKey.className = 'vc-property-key vc-pseudo-property';
                lengthKey.textContent = 'length';

                const separator = document.createElement('span');
                separator.className = 'vc-property-separator';
                separator.textContent = ':';

                const lengthValue = document.createElement('span');
                lengthValue.className = 'vc-number';
                lengthValue.textContent = value.length;

                lengthDiv.appendChild(lengthKey);
                lengthDiv.appendChild(separator);
                lengthDiv.appendChild(lengthValue);
                container.appendChild(lengthDiv);

                return;
            }

            // Handle Map
            if (value instanceof Map) {
                let index = 0;
                value.forEach((val, key) => {
                    const propDiv = document.createElement('div');
                    propDiv.className = 'vc-property';

                    const keySpan = document.createElement('span');
                    keySpan.className = 'vc-property-key';
                    keySpan.textContent = typeof key === 'string' ? `"${key}"` : String(key);

                    const separator = document.createElement('span');
                    separator.className = 'vc-property-separator';
                    separator.textContent = '=>';

                    propDiv.appendChild(keySpan);
                    propDiv.appendChild(separator);
                    propDiv.appendChild(createObjectViewer(val, seen));
                    container.appendChild(propDiv);
                });
                return;
            }

            // Handle Set
            if (value instanceof Set) {
                let index = 0;
                value.forEach((item) => {
                    const propDiv = document.createElement('div');
                    propDiv.className = 'vc-property';

                    const indexSpan = document.createElement('span');
                    indexSpan.className = 'vc-array-index';
                    indexSpan.textContent = `${index}:`;

                    propDiv.appendChild(indexSpan);
                    propDiv.appendChild(createObjectViewer(item, seen));
                    container.appendChild(propDiv);
                    index++;
                });
                return;
            }

            // Handle regular objects
            const keys = Object.keys(value);
            const descriptors = Object.getOwnPropertyDescriptors(value);

            keys.forEach(key => {
                const propDiv = document.createElement('div');
                propDiv.className = 'vc-property';

                const keySpan = document.createElement('span');
                keySpan.className = 'vc-property-key';
                keySpan.textContent = key;

                const separator = document.createElement('span');
                separator.className = 'vc-property-separator';
                separator.textContent = ':';

                propDiv.appendChild(keySpan);
                propDiv.appendChild(separator);

                // Check if it's a getter
                const descriptor = descriptors[key];
                if (descriptor && descriptor.get) {
                    const getter = document.createElement('span');
                    getter.className = 'vc-getter';
                    getter.textContent = '(...)';
                    getter.title = 'Click to invoke getter';
                    getter.onclick = (e) => {
                        e.stopPropagation();
                        try {
                            const result = value[key];
                            getter.replaceWith(createObjectViewer(result, seen));
                        } catch (err) {
                            getter.textContent = `Error: ${err.message}`;
                            getter.style.color = '#f00';
                        }
                    };
                    propDiv.appendChild(getter);
                } else {
                    propDiv.appendChild(createObjectViewer(value[key], seen));
                }

                container.appendChild(propDiv);
            });

            // Add prototype info if available
            const proto = Object.getPrototypeOf(value);
            if (proto && proto !== Object.prototype && proto !== Array.prototype) {
                const propDiv = document.createElement('div');
                propDiv.className = 'vc-property';

                const keySpan = document.createElement('span');
                keySpan.className = 'vc-property-key';
                keySpan.textContent = '__proto__';
                keySpan.style.fontStyle = 'italic';

                const separator = document.createElement('span');
                separator.className = 'vc-property-separator';
                separator.textContent = ':';

                propDiv.appendChild(keySpan);
                propDiv.appendChild(separator);
                propDiv.appendChild(createObjectViewer(proto, seen));
                container.appendChild(propDiv);
            }
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'vc-property';
            errorDiv.style.color = '#f00';
            errorDiv.textContent = `Error loading properties: ${error.message}`;
            container.appendChild(errorDiv);
        }
    }

    /**
     * Formats a timestamp
     */
    function getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Processes Chrome console %c styling syntax
     * Example: console.log('%cHello', 'color: red; font-weight: bold')
     */
    function processStyledArgs(args) {
        const result = [];
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
     * Creates a styled text element from CSS string
     */
    function createStyledElement(text, cssText) {
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
                    const value = temp.style[prop.replace(/-./g, x => x[1].toUpperCase())];
                    if (value) {
                        span.style[prop.replace(/-./g, x => x[1].toUpperCase())] = value;
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
     * Adds a log entry
     */
    function addLog(args, type = 'info') {
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

        processedArgs.forEach((item, index) => {
            if (item.type === 'styled') {
                // Styled text
                const styledEl = createStyledElement(item.value, item.style);
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
            logsContainer.removeChild(logsContainer.firstChild);
        }

        // Auto-scroll
        logsContainer.scrollTop = logsContainer.scrollHeight;
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
     * Toggles console visibility
     */
    function toggleConsole() {
        if (!container) return;
        isVisible = !isVisible;
        container.classList.toggle('virtual-console-visible', isVisible);
    }

    /**
     * Cycles to the next theme
     */
    function cycleTheme() {
        if (!container || THEME_CONFIG.availableThemes.length <= 1) return;
        
        // Remove current theme class
        const currentTheme = THEME_CONFIG.availableThemes[currentThemeIndex];
        container.classList.remove(`theme-${currentTheme}`);
        
        // Move to next theme
        currentThemeIndex = (currentThemeIndex + 1) % THEME_CONFIG.availableThemes.length;
        const newTheme = THEME_CONFIG.availableThemes[currentThemeIndex];
        
        // Add new theme class
        container.classList.add(`theme-${newTheme}`);
        
        // Save preference
        try {
            localStorage.setItem('virtual-console-theme', newTheme);
        } catch (e) {
            // localStorage might not be available
        }
        
        // Log theme change
        const capitalizedTheme = newTheme.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        addLog([`Theme changed to: ${capitalizedTheme}`], 'info');
    }

    /**
     * Loads the saved theme or returns default
     */
    function loadSavedTheme() {
        try {
            const saved = localStorage.getItem('virtual-console-theme');
            if (saved && THEME_CONFIG.availableThemes.includes(saved)) {
                return saved;
            }
        } catch (e) {
            // localStorage might not be available
        }
        return THEME_CONFIG.defaultTheme;
    }

    /**
     * Creates console DOM
     */
    function createConsole() {
        container = document.createElement('div');

        // ============================================================
        // THEME CONFIGURATION
        // ============================================================
        // Themes are configured at build time via the Vite plugin.
        // The active theme is loaded from localStorage or uses the default.
        // If multiple themes are available, a "Theme" button will appear
        // in the console header to cycle through them.
        // ============================================================
        
        // Load saved theme or use default
        const savedTheme = loadSavedTheme();
        currentThemeIndex = THEME_CONFIG.availableThemes.indexOf(savedTheme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;
        
        container.className = `virtual-console-container theme-${THEME_CONFIG.availableThemes[currentThemeIndex]}`;
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
            themeBtn.onclick = cycleTheme;
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

        container.appendChild(resizeHandle);
        container.appendChild(header);
        container.appendChild(logsContainer);
        document.body.appendChild(container);

        setupResize(resizeHandle);

        addLog(['Debug Console initialized'], 'success');
    }

    /**
     * Sets up resize
     */
    function setupResize(handle) {
        let startY = 0;
        let startHeight = 0;
        let isResizing = false;

        function startResize(e) {
            isResizing = true;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            startHeight = consoleHeight;
            document.body.style.userSelect = 'none';
            e.preventDefault();
        }

        function resize(e) {
            if (!isResizing) return;
            const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const deltaY = startY - currentY;
            const newHeight = Math.max(
                CONFIG.minHeight,
                Math.min(CONFIG.maxHeight, startHeight + deltaY)
            );
            consoleHeight = newHeight;
            container.style.height = `${newHeight}px`;
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
     * Sets up activation gestures
     */
    function setupActivation() {
        // Keyboard shortcut: Shift+C
        document.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.code === CONFIG.keyboardShortcut) {
                e.preventDefault();
                toggleConsole();
            }
        });

        // Multi-finger long press
        document.addEventListener('touchstart', (e) => {
            currentTouchCount = e.touches.length;
            
            // Clear existing timer when touch count changes
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // Start timer if we have the required finger count
            if (currentTouchCount === CONFIG.longPressFingers) {
                longPressTimer = setTimeout(() => {
                    // Verify we still have the correct finger count
                    if (currentTouchCount === CONFIG.longPressFingers) {
                        toggleConsole();
                    }
                    longPressTimer = null;
                }, CONFIG.longPressDuration);
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            currentTouchCount = e.touches.length;
            
            // Cancel timer when any finger lifts
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            // Reset touch count when all fingers lift
            if (currentTouchCount === 0) {
                currentTouchCount = 0;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            currentTouchCount = e.touches.length;
            
            // Cancel timer if fingers move
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });
    }

    /**
     * Intercepts console methods
     */
    function interceptConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        console.log = function (...args) {
            originalLog.apply(console, args);
            addLog(args, 'info');
        };

        console.error = function (...args) {
            originalError.apply(console, args);
            addLog(args, 'error');
        };

        console.warn = function (...args) {
            originalWarn.apply(console, args);
            addLog(args, 'warn');
        };

        console.info = function (...args) {
            originalInfo.apply(console, args);
            addLog(args, 'info');
        };
    }

    /**
     * Sets up error listeners
     */
    function setupErrorListeners() {
        window.addEventListener('error', (e) => {
            const message = e.filename
                ? `Error in ${e.filename}:${e.lineno}:${e.colno} - ${e.message}`
                : `Error: ${e.message}`;
            addLog([message], 'error');
        }, true);

        window.addEventListener('unhandledrejection', (e) => {
            addLog([`Unhandled Promise Rejection:`, e.reason], 'error');
        });
    }

    /**
     * Initialize
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        createConsole();
        interceptConsole();
        setupErrorListeners();
        setupActivation();

        const themeInfo = THEME_CONFIG.availableThemes.length > 1 
            ? ` (${THEME_CONFIG.availableThemes.length} themes)` 
            : '';
        console.log(`🔍 Virtual Debug Console Ready${themeInfo}`);
        console.log(`⌨️  Shift+C  |  🖐️  Long press with ${CONFIG.longPressFingers} fingers (1s)`);
    }

    init();
})();
