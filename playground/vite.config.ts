import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { virtualConsoleVitePlugin } from '../src/plugins/vite/index';

export default defineConfig({
    plugins: [
        react(),
        virtualConsoleVitePlugin({
            themes: ['vscode', 'chrome-light', 'dracula', 'nord', 'tokyo']
        })
    ],
});
