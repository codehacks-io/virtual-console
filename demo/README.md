# Demo site

The public landing/demo page — [live at virtual-console.codehacks.io](https://virtual-console.codehacks.io/). This is **not** an integration reference; see [`examples/`](../examples) for minimal, copy-pasteable setup for both integration paths.

Standalone project (own `pnpm-workspace.yaml`), same reasoning as `examples/published/*` — see [`examples/README.md`](../examples/README.md): installs `@codehacks/virtual-console@latest` from npm, not local workspace source, so the demo always shows what a real install gets.

**Unlike `examples/published/*`, this project's `pnpm-lock.yaml` *is* committed.** The deploy workflow already re-pins `@codehacks/virtual-console` to an exact version regardless of what's locked (see below), so an uncommitted lockfile here wouldn't be protecting that dependency's freshness - it would just leave every *other* dependency (React, Vite, Tailwind, ...) free to drift, unreproducibly, between installs. See [DECISIONS.md](../DECISIONS.md) for the full reasoning.

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

Redeployed automatically to GitHub Pages by `.github/workflows/release.yml`'s `deploy-demo` job, on every **stable** release tag (alpha/beta/rc are skipped, so a first-time visitor never lands on untested pre-release behavior). That job pins the demo to the exact version it just published (`pnpm add @codehacks/virtual-console@<version>`) rather than trusting `latest` to have propagated yet, then installs everything else with `--frozen-lockfile`.

Served from the `virtual-console.codehacks.io` custom domain (configured in the repo's Pages settings, not in code - no `CNAME` file needed for a workflow-based deploy). That means the site is always at root - no Vite `base` path config needed or wanted here, unlike a bare `github.io/<repo>/` project page.
