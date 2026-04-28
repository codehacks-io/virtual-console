import { defineConfig } from 'tsup';

export default defineConfig([
    // Build the runtime IIFE for direct script usage.
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
            index: 'src/runtime/index.ts',
        },
        format: ['esm', 'cjs'],
        outDir: 'dist/runtime',
        dts: true,
        clean: false,
    },
    // Build the Vite plugin
    {
        entry: {
            index: 'src/plugins/vite/index.ts',
        },
        format: ['esm', 'cjs'],
        outDir: 'dist/plugin',
        dts: true,
        clean: false,
        shims: true,
        external: ['vite', 'fs', 'path', 'url'],
    },
    // Build the browser-only Vite client.
    {
        entry: {
            client: 'src/plugins/vite/client.ts',
        },
        format: ['esm'],
        outDir: 'dist/plugin',
        dts: true,
        clean: false,
        external: ['vite'],
    },
]);
