import { defineConfig } from 'tsup';

export default defineConfig([
    // Build the runtime IIFE (injected script)
    {
        entry: ['src/runtime/core.ts'],
        format: ['iife'],
        outDir: 'dist/runtime',
        name: 'VirtualConsole', // Global variable name for IIFE
        globalName: 'VirtualConsole',
        minify: true,
        dts: true, // Generate d.ts for runtime
        outExtension: () => ({ js: '.iife.js' }),
        clean: true,
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
