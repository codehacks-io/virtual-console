# Website

The public landing page — [live at virtual-console.codehacks.io](https://virtual-console.codehacks.io/). This is **not** an integration reference; see [`examples/`](../examples) for minimal, copy-pasteable setup for both integration paths.

Standalone project (own `pnpm-workspace.yaml`), same reasoning as `examples/published/*` — see [`examples/README.md`](../examples/README.md): installs `@codehacks/virtual-console` from npm as a real published version, not local workspace source, so the website always shows what a real install gets.

**Unlike `examples/published/*`, this project's `pnpm-lock.yaml` *is* committed.** Deploying the website is decoupled from publishing the package (see below), so nothing re-pins `@codehacks/virtual-console` at deploy time - the lockfile is the deploy's declared input. `website/package.json` also pins it to an exact version rather than a `latest` alias, so the file itself always shows exactly what's running. Picking up a newer package version is a deliberate `pnpm bump:website:latest` (or `:alpha` / `:beta` / `:rc` to preview a pre-release), committed like any other dependency bump. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

```bash
# from the repo root
pnpm dev:website
pnpm build:website
pnpm preview:website         # build once, then serve the real static output (dist/)
pnpm preview:website:watch   # same, but rebuilds on every save - refresh the browser yourself

# or directly
cd website
pnpm install
pnpm dev
pnpm build && pnpm preview
pnpm preview:watch
```

`pnpm dev` (Vite's dev server) never runs the prerender step - `index.html`'s `#root` starts empty
there and `main.tsx` client-renders into it (see [DECISIONS.md](../DECISIONS.md)). To see and debug
the actual prerendered HTML a no-JS client or crawler would get - or to check something that only
happens in the production build - use one of the `preview*` commands instead, which build (prerender
step included) and serve the real `dist/` output. `preview:website` is a one-shot build-then-serve;
`preview:website:watch` (`scripts/watch-preview.mjs`) rebuilds automatically on every change under
`src/` or `index.html` and leaves `vite preview` running, so you just refresh the browser after each
rebuild finishes. No hot reload/HMR - a rebuild here is `tsc` + two `vite build` passes + the
prerender script, not a single Vite module reload, so wiring up HMR on top of it isn't worth the
complexity for a workflow you reach for to debug something prerender-specific, not one you'd keep
open all day like `pnpm dev`. The watcher itself is a plain `node:fs` recursive watch with no new
dependencies - deliberately, since a debounced full-rebuild loop this small doesn't need a `chokidar`
or `concurrently` pulled in for it.

## Deployment

Deployed to GitHub Pages by `.github/workflows/release-website.yml`, independently of the package's own release line - a `website-v{version}` tag deploys the website; a plain `v{version}` tag (the package release) does not. This is its own [vump](https://github.com/okcodes/vump) project (`website` in the root `vump.toml`, tracking this directory's `package.json`), so a site-only change ships with `vump patch --project website --tag --push` and never touches the package's version or npm. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

Picking up a newer `@codehacks/virtual-console` release is a separate, deliberate step: `pnpm bump:website:latest` (or `:alpha` / `:beta` / `:rc`) here, committed like any other dependency bump, then a `website` release to actually deploy it.

Served from the `virtual-console.codehacks.io` custom domain (configured in the repo's Pages settings, not in code - no `CNAME` file needed for a workflow-based deploy). That means the site is always at root - no Vite `base` path config needed or wanted here, unlike a bare `github.io/<repo>/` project page.
