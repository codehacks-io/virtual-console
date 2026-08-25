import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { HtmlTagDescriptor, Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { THEMES, type ThemeName } from '../../runtime/themes';
import type { VirtualConsoleConfig } from '../../runtime/types';
import {
    virtualConsoleBuildClientPath,
    virtualConsoleClientPackageId,
    virtualConsoleDevClientPath,
    virtualConsoleOptionsElementId
} from './constants';

/**
 * Available theme names for the virtual console.
 * Re-exported from the runtime's canonical theme list so plugin consumers
 * get the same type without importing from `runtime/themes` directly.
 */
export type VirtualConsoleTheme = ThemeName;

/**
 * All available themes - used for validation
 */
const AVAILABLE_THEMES: readonly VirtualConsoleTheme[] = THEMES;

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

function serializeJson(value: unknown) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

async function serveVirtualClient(server: ViteDevServer) {
    const result = await server.transformRequest(virtualConsoleClientPackageId);
    return result?.code;
}

function getRuntimeStylesDir() {
    const distRuntimeDir = resolve(__dirname, '../runtime');
    const distStylesDir = resolve(distRuntimeDir, 'styles');

    if (existsSync(resolve(distStylesDir, 'base.css'))) {
        return distStylesDir;
    }

    return resolve(__dirname, '../../../src/runtime/styles');
}

function readSelectedCss(themes: VirtualConsoleTheme[]) {
    const stylesDir = getRuntimeStylesDir();
    const baseCss = readFileSync(resolve(stylesDir, 'base.css'), 'utf-8');
    const themeCssArray = themes.map(theme => {
        const themePath = resolve(stylesDir, `themes/${theme}.css`);

        if (!existsSync(themePath)) {
            throw new Error(`Theme CSS file not found: ${themePath}`);
        }

        return readFileSync(themePath, 'utf-8');
    });

    return [baseCss, ...themeCssArray].join('\n\n');
}

/**
 * Vite plugin to inject the virtual console into index.html
 * Injects base CSS, all selected theme CSS files, and the console JavaScript
 */
export function virtualConsoleVitePlugin(options: InjectVirtualConsoleOptions): Plugin {
    // Validate themes early (at config time)
    validateThemes(options.themes);
    let config: ResolvedConfig;

    return {
        name: 'virtual-console:vite',
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        configureServer(server) {
            server.middlewares.use(virtualConsoleDevClientPath, async (_request, response, next) => {
                const code = await serveVirtualClient(server);

                if (!code) {
                    next();
                    return;
                }

                response.setHeader('Content-Type', 'application/javascript');
                response.end(code);
            });
        },
        buildStart() {
            if (config.command === 'build') {
                this.emitFile({
                    type: 'chunk',
                    id: virtualConsoleClientPackageId,
                    fileName: virtualConsoleBuildClientPath
                });
            }
        },
        transformIndexHtml(): HtmlTagDescriptor[] {
            const theme = {
                availableThemes: options.themes,
                defaultTheme: options.themes[0]
            };

            return [
                {
                    tag: 'style',
                    children: readSelectedCss(options.themes),
                    injectTo: 'head-prepend'
                },
                {
                    tag: 'script',
                    attrs: {
                        id: virtualConsoleOptionsElementId,
                        type: 'application/json'
                    },
                    children: serializeJson({
                        theme,
                        options: options.options || {}
                    }),
                    injectTo: 'head-prepend'
                },
                {
                    tag: 'script',
                    attrs: {
                        type: 'module',
                        src: config.command === 'build'
                            ? `${config.base}${virtualConsoleBuildClientPath}`
                            : virtualConsoleDevClientPath
                    },
                    injectTo: 'head-prepend'
                }
            ];
        }
    };
}
