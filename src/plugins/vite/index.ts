import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';
import type { VirtualConsoleConfig } from '../../runtime/types';

// Get the directory of this plugin file
// When built, this file is in dist/plugin.js, so __dirname is dist/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Available theme names for the virtual console
 */
export type VirtualConsoleTheme = 'vscode' | 'chrome-light' | 'dracula' | 'nord' | 'tokyo';

/**
 * All available themes - used for validation
 */
const AVAILABLE_THEMES: readonly VirtualConsoleTheme[] = ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo'];

export interface InjectVirtualConsoleOptions {
    /**
     * Array of theme names to include in the build
     * At least one theme must be specified
     * All themes will be available for runtime switching via the theme button
     */
    themes: VirtualConsoleTheme[];
    /**
     * Optional runtime configuration
     */
    options?: Partial<Omit<VirtualConsoleConfig, 'targetElement'>>;
}

/**
 * Validates that the provided themes are valid
 */
function validateThemes(themes: string[]): asserts themes is VirtualConsoleTheme[] {
    if (!themes || themes.length === 0) {
        throw new Error(
            `[inject-virtual-console] At least one theme must be specified.\n` +
            `Available themes: ${AVAILABLE_THEMES.join(', ')}`
        );
    }

    const invalidThemes = themes.filter(theme => !AVAILABLE_THEMES.includes(theme as VirtualConsoleTheme));

    if (invalidThemes.length > 0) {
        throw new Error(
            `[inject-virtual-console] Invalid theme(s): ${invalidThemes.join(', ')}\n` +
            `Available themes: ${AVAILABLE_THEMES.join(', ')}`
        );
    }
}

/**
 * Vite plugin to inject the virtual console into index.html
 * Injects base CSS, all selected theme CSS files, and the console JavaScript
 */
export function virtualConsoleVitePlugin(options: InjectVirtualConsoleOptions): Plugin {
    // Validate themes early (at config time)
    validateThemes(options.themes);

    return {
        name: 'virtual-console:vite',
        transformIndexHtml: {
            order: 'post',
            handler(html) {
                try {
                    // Paths are relative to dist/plugin/ where this plugin resides after build
                    // We need to go up one level to dist/runtime/
                    const distRuntimeDir = resolve(__dirname, '../runtime');

                    // Logic to handle dev (src) vs prod (dist) paths
                    let realStylesDir = resolve(distRuntimeDir, 'styles');
                    let realJsPath = resolve(distRuntimeDir, 'core.iife.js');

                    // Check if we are running from source (e.g. ts-node/vite dev)
                    // If dist/runtime/styles/base.css doesn't exist, we might be in src
                    if (!existsSync(resolve(realStylesDir, 'base.css'))) {
                        // In source: __dirname is src/plugins/vite
                        // We need to go to src/runtime/styles
                        const srcStylesDir = resolve(__dirname, '../../../src/runtime/styles');

                        if (existsSync(resolve(srcStylesDir, 'base.css'))) {
                            realStylesDir = srcStylesDir;

                            // For JS, we still need the built IIFE because we don't compile on the fly here.
                            // We assume the user has run 'pnpm build' or at least built the runtime.
                            // From src/plugins/vite, dist is ../../../dist
                            const distJsPath = resolve(__dirname, '../../../dist/runtime/core.iife.js');
                            realJsPath = distJsPath;
                        }
                    }

                    const baseCss = readFileSync(resolve(realStylesDir, 'base.css'), 'utf-8');

                    // Read all theme CSS files
                    const themeCssArray = options.themes.map(theme => {
                        const themePath = resolve(realStylesDir, `themes/${theme}.css`);
                        if (!existsSync(themePath)) throw new Error(`Theme CSS file not found: ${themePath}`);
                        return readFileSync(themePath, 'utf-8');
                    });

                    const allCss = [baseCss, ...themeCssArray].join('\n\n');

                    if (!existsSync(realJsPath)) {
                        // If runtime is missing, we can't inject.
                        // In a real dev scenario, we might want to watch the source and rebuild,
                        // but for now we require a build.
                        console.warn(`[inject-virtual-console] Runtime JS not found at ${realJsPath}. Skipping injection.`);
                        return html;
                    }
                    const js = readFileSync(realJsPath, 'utf-8');

                    const themeConfig = `
            window.__VIRTUAL_CONSOLE_GLOBAL__ = {
              theme: {
                availableThemes: ${JSON.stringify(options.themes)},
                defaultTheme: '${options.themes[0]}'
              },
              options: ${JSON.stringify(options.options || {})}
            };
          `;

                    // Inject CSS in head
                    let newHtml = html.replace('</head>', `<style>${allCss}</style></head>`);

                    // Inject JS at the START of body to catch errors immediately
                    if (newHtml.includes('<body')) {
                        newHtml = newHtml.replace(/<body([^>]*)>/, `<body$1><script>${themeConfig}</script><script>${js}</script>`);
                    } else {
                        newHtml += `<script>${themeConfig}</script><script>${js}</script>`;
                    }

                    return newHtml;

                } catch (error) {
                    console.error(`[inject-virtual-console] Failed to inject console:`, error);
                    return html;
                }
            }
        }
    };
}
