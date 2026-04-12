import { defineConfig } from 'tsup';

export default defineConfig([
    // Build the runtime IIFE (injected script)
    {
        entry: {
            core: 'src/runtime/iife-entry.ts',
        },
        format: ['iife'],
        outDir: 'dist/runtime',
        name: 'VirtualConsole',
        globalName: 'VirtualConsole',
        minify: true,
        dts: false,
        outExtension: () => ({ js: '.iife.js' }),
        clean: true,
    },
    // Build the runtime Library (ESM/CJS for manual import)
    {
        entry: {
            index: 'src/runtime/core.ts',
        },
        format: ['esm', 'cjs'],
        outDir: 'dist/runtime',
        dts: true,
        clean: false,
    },
    // Build the Vite plugin
    {
        entry: ['src/plugins/vite/index.ts'],
        format: ['esm', 'cjs'],
        outDir: 'dist/plugin',
        name: 'vite',
        dts: true,
        clean: false,
        external: ['vite', 'fs', 'path', 'url'],
    },
]);
