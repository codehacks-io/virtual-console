import { defineConfig } from 'tsup';
import pkg from './package.json' with { type: 'json' };

// Commit is supplied by the release workflow (VC_GIT_SHA), not looked up
// here - a build must not depend on ambient VCS state. Anything built
// outside that workflow is identified as 'local'.
const gitSha = process.env.VC_GIT_SHA ?? '';

// Baked into the runtime bundle as compile-time constants - see
// __VC_VERSION__ / __VC_BUILD_ID__ in src/runtime/types.ts.
const versionDefine = {
    __VC_VERSION__: JSON.stringify(pkg.version),
    __VC_BUILD_ID__: JSON.stringify(gitSha ? gitSha.slice(0, 7) : 'local')
};

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
        define: versionDefine,
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
        define: versionDefine,
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
        // No public exports; never imported directly by consumers.
        dts: false,
        clean: false,
        // Must stay external - see the comment on client.ts's import.
        external: ['vite', '@codehacks/virtual-console'],
    },
]);
