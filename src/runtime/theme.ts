import { THEMES } from './themes';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from './storage';
import type { ThemeConfig } from './types';

const DEFAULT_THEME_CONFIG: ThemeConfig = {
    availableThemes: [...THEMES],
    defaultTheme: THEMES[0]
};

let themeConfig: ThemeConfig = typeof window === 'undefined'
    ? DEFAULT_THEME_CONFIG
    : window.__VIRTUAL_CONSOLE_GLOBAL__?.theme || DEFAULT_THEME_CONFIG;

let currentThemeIndex = 0;

export function getThemeConfig(): ThemeConfig {
    return themeConfig;
}

export function setThemeConfig(config?: ThemeConfig) {
    themeConfig = config || DEFAULT_THEME_CONFIG;
    currentThemeIndex = 0;
}

export function loadSavedTheme(): string {
    const saved = getStorageItem(STORAGE_KEYS.theme);
    if (saved && themeConfig.availableThemes.includes(saved)) {
        return saved;
    }
    return themeConfig.defaultTheme;
}

export function cycleTheme(container: HTMLElement) {
    if (!container || themeConfig.availableThemes.length <= 1) return;

    // Remove current theme class
    const currentTheme = themeConfig.availableThemes[currentThemeIndex];
    container.classList.remove(`theme-${currentTheme}`);

    // Move to next theme
    currentThemeIndex = (currentThemeIndex + 1) % themeConfig.availableThemes.length;
    const newTheme = themeConfig.availableThemes[currentThemeIndex];

    // Add new theme class
    container.classList.add(`theme-${newTheme}`);

    // Save preference
    setStorageItem(STORAGE_KEYS.theme, newTheme);

    // Log theme change
    const capitalizedTheme = newTheme.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // We use console.log here which will be intercepted
    console.info(`Theme changed to: ${capitalizedTheme}`);
}

export function initThemeIndex() {
    const savedTheme = loadSavedTheme();
    currentThemeIndex = themeConfig.availableThemes.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    return themeConfig.availableThemes[currentThemeIndex];
}
