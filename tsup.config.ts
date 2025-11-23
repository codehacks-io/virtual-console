import { defineConfig } from 'tsup';

export default defineConfig([
    // Build the runtime IIFE (injected script)
    {
        entry: ['src/runtime/core.ts'],
        format: ['iife'],
        outDir: 'dist',
        name: 'VirtualConsole', // Global variable name for IIFE
        globalName: 'VirtualConsole',
        minify: true,
        dts: false,
        outExtension: () => ({ js: '.iife.js' }),
        clean: true,
    },
    // Build the Vite plugin
    {
        entry: ['src/plugins/vite/index.ts'],
        format: ['esm', 'cjs'],
        outDir: 'dist',
        name: 'vite',
        dts: true,
        clean: false, // Don't clean, or we delete the IIFE built above
        external: ['vite', 'fs', 'path', 'url'],
    },
]);
