import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { virtualConsoleVitePlugin } from '@codehacks/virtual-console/plugins/vite';

const linkedLibrary = '@codehacks/virtual-console';

export default defineConfig({
    plugins: [
        virtualConsoleVitePlugin({
            options: { maxLogs: 50 },
            themes: ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo']
        }),
        react()
    ],
    optimizeDeps: {
        exclude: [linkedLibrary]
    },
    server: {
        host: true,
        watch: {
            ignored: [`!**/node_modules/${linkedLibrary}/**`]
        }
    }
});
