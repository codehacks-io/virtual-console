import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { virtualConsoleVitePlugin } from '@codehacks/virtual-console/plugins/vite';

export default defineConfig({
    // Served from the virtual-console.codehacks.io custom domain, at root -
    // no base path needed. (A bare github.io project page would need one,
    // at /<repo>/, but that's not this site's URL.)
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
