import { ThemeConfig } from './types';
// import { addLog } from './ui'; // Circular dependency note: ui imports theme, theme imports ui for logging.
// We might need to decouple logging from theme if this becomes an issue.
// For now, we'll pass a logger callback or just use console.log which is intercepted.

export const THEME_CONFIG: ThemeConfig = window.__VIRTUAL_CONSOLE_CONFIG__ || {
    availableThemes: ['vscode'],
    defaultTheme: 'vscode'
};

let currentThemeIndex = 0;

export function loadSavedTheme(): string {
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

export function cycleTheme(container: HTMLElement) {
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

    // We use console.log here which will be intercepted
    console.info(`Theme changed to: ${capitalizedTheme}`);
}

export function initThemeIndex() {
    const savedTheme = loadSavedTheme();
    currentThemeIndex = THEME_CONFIG.availableThemes.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    return THEME_CONFIG.availableThemes[currentThemeIndex];
}
