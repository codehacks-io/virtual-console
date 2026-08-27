## What this changes

<!-- What the change does, and why. If it fixes an issue, link it: Fixes #123 -->

## How it was verified

<!-- Beyond CI: what did you actually run, and where? -->

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass
- [ ] Exercised the explicit-import path (`pnpm dev:import:local`)
- [ ] Exercised the Vite plugin path (`pnpm dev:vite-plugin:local`)
- [ ] Tested on a real mobile device or emulator (only if this touches touch, dock sizing, or viewport behaviour)

## Checklist

- [ ] If this touches REPL evaluation, DevTools-parity scope, or a known accepted limitation, I've read the relevant section of [DECISIONS.md](../blob/main/DECISIONS.md) and argued against its reasoning rather than around it
- [ ] Any new non-obvious decision is recorded in DECISIONS.md, not in a code comment
- [ ] Public API changes are reflected in the README

## Breaking change?

<!-- Config fields renamed or removed, exports moved, theme names changed, default behaviour
     altered. If yes, say what breaks and what users need to do. If no, delete this section. -->
