// Runs after the client and SSR builds: renders the app to an HTML string
// and inlines it into dist/index.html's #root, so the page has real content
// before any JS runs (crawlers, AI agents, no-JS clients). See DECISIONS.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(websiteDir, 'dist');
const ssrDir = path.join(websiteDir, 'dist-ssr');

const { render } = await import(path.join(ssrDir, 'entry-server.js'));
const appHtml = render();

const indexPath = path.join(distDir, 'index.html');
const template = fs.readFileSync(indexPath, 'utf-8');
const withMarkup = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

if (withMarkup === template) {
    throw new Error(`prerender: did not find '<div id="root"></div>' placeholder in ${indexPath}`);
}

fs.writeFileSync(indexPath, withMarkup);
fs.rmSync(ssrDir, { recursive: true, force: true });
