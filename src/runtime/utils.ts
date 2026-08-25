/**
 * Formats a timestamp
 */
export function getTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Gets the constructor name or type of a value
 */
export function getType(value: any): string {
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
export function getSize(value: any): number | null {
    if (Array.isArray(value)) return value.length;
    if (value instanceof Map || value instanceof Set) return value.size;
    if (typeof value === 'object' && value !== null) {
        return Object.keys(value).length;
    }
    return null;
}

/**
 * Debounces a function, delaying invocation until `wait` ms after the last call
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
