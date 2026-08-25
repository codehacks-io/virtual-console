import { defineConfig } from 'vitest/config';

// Node's own experimental global localStorage (see NODE_OPTIONS in the "test" script)
// otherwise shadows jsdom's window.localStorage and breaks anything that reads it.
export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts']
    }
});
