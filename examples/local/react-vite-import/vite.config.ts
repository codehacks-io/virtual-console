import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const linkedLibrary = '@codehacks/virtual-console';

export default defineConfig({
    plugins: [react()],
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
