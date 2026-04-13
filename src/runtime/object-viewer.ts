import { getType, getSize } from './utils';

/**
 * Creates an expandable object viewer element
 */
export function createObjectViewer(value: any, seen = new WeakSet<object>()): HTMLElement {
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

    // Handle Error objects
    if (value instanceof Error) {
        container.className += ' vc-error';
        container.style.color = 'var(--vc-log-error)';

        // Header for expand/collapse
        const header = document.createElement('div');
        header.className = 'vc-object-header';

        // Expand icon
        const expandIcon = document.createElement('span');
        expandIcon.className = 'vc-expand-icon';

        // Main error message
        const messageSpan = document.createElement('span');
        messageSpan.style.fontWeight = 'bold';
        messageSpan.textContent = `${value.name}: ${value.message}`;

        header.appendChild(expandIcon);
        header.appendChild(messageSpan);
        container.appendChild(header);

        // Stack trace (if available)
        if (value.stack) {
            const stackDiv = document.createElement('div');
            stackDiv.className = 'vc-error-stack';
            stackDiv.style.display = 'none'; // Hidden by default

            // Remove the first line if it duplicates the message
            const stackLines = value.stack.split('\n');
            if (stackLines[0].includes(value.message)) {
                stackLines.shift();
            }
            stackDiv.textContent = stackLines.join('\n');
            container.appendChild(stackDiv);

            // Toggle logic
            let isExpanded = false;
            header.onclick = (e) => {
                e.stopPropagation();
                isExpanded = !isExpanded;
                expandIcon.classList.toggle('expanded', isExpanded);
                stackDiv.style.display = isExpanded ? 'block' : 'none';
            };
        } else {
            expandIcon.style.visibility = 'hidden';
            header.style.cursor = 'default';
        }
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
function loadProperties(value: any, container: HTMLElement, seen: WeakSet<object>) {
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
            lengthValue.textContent = String(value.length);

            lengthDiv.appendChild(lengthKey);
            lengthDiv.appendChild(separator);
            lengthDiv.appendChild(lengthValue);
            container.appendChild(lengthDiv);

            return;
        }

        // Handle Map
        if (value instanceof Map) {
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
                    } catch (err: any) {
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
    } catch (error: any) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'vc-property';
        errorDiv.style.color = '#f00';
        errorDiv.textContent = `Error loading properties: ${error.message}`;
        container.appendChild(errorDiv);
    }
}
