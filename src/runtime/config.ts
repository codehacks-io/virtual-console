import { VirtualConsoleConfig } from './types';

export const CONFIG: VirtualConsoleConfig = {
    maxLogs: 100,
    minHeight: 100,
    maxHeight: window.innerHeight * 0.8,
    defaultHeight: 200,
    keyboardShortcut: 'KeyC', // Shift+C to toggle
    longPressFingers: 2, // amount of fingers long press to toggle
    longPressDuration: 500 // milliseconds to hold fingers to toggle
};
