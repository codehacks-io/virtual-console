import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { virtualConsoleVitePlugin } from '@codehacks/virtual-console/plugins/vite';

// GitHub Pages serves a project site under /<repo>/, not /. Set only by the
// deploy workflow (see .github/workflows/release.yml) - local dev and
// `vite preview` are unaffected.
const base = process.env.GITHUB_PAGES_BASE || '/';

export default defineConfig({
    base,
    server: { port: 5180 },
    plugins: [
        virtualConsoleVitePlugin({
            options: { maxLogs: 50 },
            themes: ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo']
        }),
        react(),
        tailwindcss()
    ]
});
