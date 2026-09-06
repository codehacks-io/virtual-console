// Rebuilds on every source change and serves the result, for debugging the
// prerendered/SSR output without a manual build+preview cycle each time. No
// hot reload: `vite preview` reads dist/ from disk per request, so a
// browser refresh after each rebuild is enough - see website/README.md for
// why this doesn't try to preserve HMR too.
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd: websiteDir, stdio: 'inherit', shell: true });
        child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))));
    });
}

let building = false;
let rebuildQueued = false;

async function rebuild() {
    if (building) {
        rebuildQueued = true;
        return;
    }

    building = true;
    console.log('\n[watch] building...');

    try {
        await run('pnpm', ['run', 'build']);
        console.log('[watch] build done - refresh your browser');
    } catch (error) {
        console.error('[watch] build failed:', error.message);
    }

    building = false;

    if (rebuildQueued) {
        rebuildQueued = false;
        await rebuild();
    }
}

await rebuild();

spawn('pnpm', ['run', 'preview'], { cwd: websiteDir, stdio: 'inherit', shell: true });

watch(path.join(websiteDir, 'src'), { recursive: true }, () => rebuild());
watch(path.join(websiteDir, 'index.html'), () => rebuild());
