/**
 * Canonical list of built-in themes. This is the single source of truth for
 * theme names, consumed by both the runtime (`theme.ts`) and the Vite plugin
 * (`plugins/vite/index.ts`) so the two can't drift out of sync.
 *
 * Each entry must still have a matching CSS file at
 * `src/runtime/styles/themes/<name>.css` - that mapping is validated at
 * build/runtime by reading the file itself, not duplicated here.
 */
export const THEMES = ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo'] as const;

export type ThemeName = (typeof THEMES)[number];
