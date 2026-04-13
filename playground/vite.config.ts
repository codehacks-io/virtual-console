import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { virtualConsoleVitePlugin } from '../src/plugins/vite/index';
// To test the published package, uncomment the line below and comment the one above:
// import { virtualConsoleVitePlugin } from '@codehacks/virtual-console/plugins/vite';

export default defineConfig({
    plugins: [
        react(),
        virtualConsoleVitePlugin({
            options: { maxLogs: 5 },
            themes: ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo']
        })
    ],
});
