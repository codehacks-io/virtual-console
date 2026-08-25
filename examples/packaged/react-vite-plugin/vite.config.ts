import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { virtualConsoleVitePlugin } from '@codehacks/virtual-console/plugins/vite';

export default defineConfig({
    plugins: [
        virtualConsoleVitePlugin({
            options: { maxLogs: 50 },
            themes: ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo']
        }),
        react()
    ],
    server: {
        host: true
    }
});
