import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

// Get the directory of this plugin file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Available theme names for the virtual console
 * Add new themes by creating a new CSS file in themes/ and adding the name here
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
export function injectVirtualConsole(options: InjectVirtualConsoleOptions): Plugin {
  // Validate themes early (at config time)
  validateThemes(options.themes);
  
  console.log(`[inject-virtual-console] Injecting virtual console with themes: ${options.themes.join(', ')}`);
  
  return {
    name: 'inject-virtual-console',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        try {
          // Read base CSS (theme-independent styles)
          const baseCssPath = resolve(__dirname, '../src/console/base.css');
          const baseCss = readFileSync(baseCssPath, 'utf-8');

          // Read all theme CSS files
          const themeCssArray = options.themes.map(theme => {
            const themePath = resolve(__dirname, `../src/console/themes/${theme}.css`);
            
            if (!existsSync(themePath)) {
              throw new Error(`Theme CSS file not found: ${themePath}`);
            }
            
            return readFileSync(themePath, 'utf-8');
          });

          // Combine all CSS
          const allCss = [baseCss, ...themeCssArray].join('\n\n');

          // Read JavaScript
          const jsPath = resolve(__dirname, '../src/console/virtual-console.js');
          const js = readFileSync(jsPath, 'utf-8');

          // Create a config object to pass available themes to the console
          const themeConfig = `
            window.__VIRTUAL_CONSOLE_CONFIG__ = {
              availableThemes: ${JSON.stringify(options.themes)},
              defaultTheme: '${options.themes[0]}'
            };
          `;

          // Inject CSS in <head> and JS + config in <body>
          return html
            .replace('</head>', `<style>${allCss}</style></head>`)
            .replace('</body>', `<script>${themeConfig}</script><script>${js}</script></body>`);
        } catch (error) {
          throw new Error(`[inject-virtual-console] Failed to inject console: ${error}`);
        }
      }
    }
  };
}

