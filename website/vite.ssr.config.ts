import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Separate from vite.config.ts because virtualConsoleVitePlugin only makes
// sense for the client build (it injects a script/style into index.html and
// emits its own client chunk) - pointing --ssr at that config makes Vite
// try to bundle its virtual client module as an entry, which fails. This
// build's only output is entry-server.tsx's renderToString, so it needs
// nothing but the JSX transform. See scripts/prerender.mjs.
export default defineConfig({
    plugins: [react()]
});
