# Website

The public landing page — [live at virtual-console.codehacks.io](https://virtual-console.codehacks.io/). This is **not** an integration reference; see [`examples/`](../examples) for minimal, copy-pasteable setup for both integration paths.

Standalone project (own `pnpm-workspace.yaml`), same reasoning as `examples/published/*` — see [`examples/README.md`](../examples/README.md): installs `@codehacks/virtual-console` from npm as a real published version, not local workspace source, so the website always shows what a real install gets.

**Unlike `examples/published/*`, this project's `pnpm-lock.yaml` *is* committed.** Deploying the website is decoupled from publishing the package (see below), so nothing re-pins `@codehacks/virtual-console` at deploy time - the lockfile is the deploy's declared input. `website/package.json` also pins it to an exact version rather than a `latest` alias, so the file itself always shows exactly what's running. Picking up a newer package version is a deliberate `pnpm bump:website:latest` (or `:alpha` / `:beta` / `:rc` to preview a pre-release), committed like any other dependency bump. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

```bash
# from the repo root
pnpm dev:website
pnpm build:website

# or directly
cd website
pnpm install
pnpm dev
```

## Deployment

Deployed to GitHub Pages by `.github/workflows/release-website.yml`, independently of the package's own release line - a `website-v{version}` tag deploys the website; a plain `v{version}` tag (the package release) does not. This is its own [vump](https://github.com/okcodes/vump) project (`website` in the root `vump.toml`, tracking this directory's `package.json`), so a site-only change ships with `vump patch --project website --tag --push` and never touches the package's version or npm. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

Picking up a newer `@codehacks/virtual-console` release is a separate, deliberate step: `pnpm bump:website:latest` (or `:alpha` / `:beta` / `:rc`) here, committed like any other dependency bump, then a `website` release to actually deploy it.

Served from the `virtual-console.codehacks.io` custom domain (configured in the repo's Pages settings, not in code - no `CNAME` file needed for a workflow-based deploy). That means the site is always at root - no Vite `base` path config needed or wanted here, unlike a bare `github.io/<repo>/` project page.
