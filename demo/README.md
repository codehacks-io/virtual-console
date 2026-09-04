# Demo site

The public landing/demo page — [live at virtual-console.codehacks.io](https://virtual-console.codehacks.io/). This is **not** an integration reference; see [`examples/`](../examples) for minimal, copy-pasteable setup for both integration paths.

Standalone project (own `pnpm-workspace.yaml`), same reasoning as `examples/published/*` — see [`examples/README.md`](../examples/README.md): installs `@codehacks/virtual-console@latest` from npm, not local workspace source, so the demo always shows what a real install gets.

**Unlike `examples/published/*`, this project's `pnpm-lock.yaml` *is* committed.** Deploying the demo is decoupled from publishing the package (see below), so nothing re-pins `@codehacks/virtual-console` at deploy time - the lockfile is the deploy's declared input. Picking up a newer package version is a deliberate `pnpm update @codehacks/virtual-console`, committed like any other dependency bump. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

```bash
# from the repo root
pnpm dev:demo
pnpm build:demo

# or directly
cd demo
pnpm install
pnpm dev
```

## Deployment

Deployed to GitHub Pages by `.github/workflows/release-web.yml`, independently of the package's own release line - a `web-v{version}` tag deploys the demo; a plain `v{version}` tag (the package release) does not. This is its own [vump](https://github.com/okcodes/vump) project (`web` in the root `vump.toml`, tracking this directory's `package.json`), so a site-only change ships with `vump patch --project web --tag --push` and never touches the package's version or npm. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

Picking up a newer `@codehacks/virtual-console` release is a separate, deliberate step: `pnpm update @codehacks/virtual-console` here, committed like any other dependency bump, then a `web` release to actually deploy it.

Served from the `virtual-console.codehacks.io` custom domain (configured in the repo's Pages settings, not in code - no `CNAME` file needed for a workflow-based deploy). That means the site is always at root - no Vite `base` path config needed or wanted here, unlike a bare `github.io/<repo>/` project page.
