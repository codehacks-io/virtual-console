# Examples

Four demo apps, covering both integration paths ([explicit import](../README.md#explicit-import) vs. [Vite plugin](../README.md#vite-plugin)) against two different sources of the library:

```
examples/
  local/                    # pnpm workspace members — use the library's local source
    react-vite-import/      # explicit `installVirtualConsole()` import
    react-vite-plugin/      # `virtualConsoleVitePlugin()` injected before the app mounts
  packaged/                 # standalone projects — install @codehacks/virtual-console@latest from npm
    react-vite-import/      # explicit import, against the real published package
    react-vite-plugin/      # Vite plugin, against the real published package
```

## `local/*` — workspace members

Listed in the root `pnpm-workspace.yaml` (`examples/local/*`), so `@codehacks/virtual-console` resolves to this repo's own `src` via `workspace:*`. Use these while developing the library itself — changes to `src` are picked up immediately.

```bash
pnpm dev:local-import
pnpm dev:local-plugin
pnpm build:examples
```

## `packaged/*` — standalone, real npm install

**Not** pnpm workspace members — each has its own `pnpm-workspace.yaml` (so pnpm treats it as an independent single-package project instead of walking up to this repo's workspace) and its own `pnpm-lock.yaml` (gitignored, since it's meant to float to whatever `latest` currently is on npm, not be pinned). They exist to smoke-test the package a real consumer would install, separate from the local workspace-linked build.

```bash
pnpm install:packaged-examples   # installs both from the npm registry
pnpm dev:packaged-import
pnpm dev:packaged-plugin
pnpm build:packaged-examples
```

**Expect these to occasionally fail to build between a merge and the next npm release.** Their source intentionally mirrors the `local/*` examples (same APIs, same code shape) so they stay meaningful smoke tests — but that means if a PR adds or renames an export, the `packaged/*` examples reference it before it's actually published, and `tsc` will correctly fail with a "no exported member" error until the next version ships. That's real drift, not a workspace bug — check the error message before assuming something's broken. This is also why `build:packaged-examples` is intentionally left out of `ci.yml` (only `build:examples`, the `local/*` ones, run there); run it manually after cutting a release to confirm the published package works.
