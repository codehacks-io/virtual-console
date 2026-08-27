# Contributing

Thanks for taking an interest. This is a small, opinionated project — the notes below exist so
your time isn't spent on a change that was never going to be merged.

## Before you open a PR

**Read [DECISIONS.md](DECISIONS.md) first if your change touches REPL evaluation, DevTools-parity
scope, or anything under "Known, accepted limitations".** Those sections document choices that were
made deliberately, with reasoning. A PR that reverses one isn't automatically unwelcome, but it
needs to argue against the reasoning that's already written down, not just assert the opposite.

For anything non-trivial, open an issue first. A short conversation is cheaper than a rejected PR.

## Setup

```bash
pnpm install
pnpm build
```

Node >= 26 and pnpm 10 are expected — see `engines` in [package.json](package.json).

## Verifying a change

All three must pass; CI runs the same commands on every push and PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Testing it for real

Unit tests don't tell you whether the console actually behaves in a browser. There are two
integration paths and a change can easily work in one and break the other, so exercise both:

```bash
pnpm dev:import:local        # explicit runtime import
pnpm dev:vite-plugin:local   # Vite plugin injection
```

See [examples/README.md](examples/README.md) for what each example covers, and the `*:published`
variants that install the real npm package instead of local workspace source.

If your change affects mobile behaviour — the long-press gesture, dock sizing, viewport handling —
test it on an actual phone or a device emulator, not just a narrow desktop window. Touch events and
visual-viewport behaviour differ in ways a resized browser won't reveal.

## Engineering standards

[CLAUDE.md](CLAUDE.md) holds the ground rules for this repo, and they apply to human contributors
just as much as to AI ones. The two that come up most:

- **Build inputs are declared, never discovered.** A build artifact must be a pure function of its
  declared inputs. Build scripts don't shell out to `git`, read the hostname, or consult the clock.
- **Comments document the code, not its history.** A comment explains the code as it stands — not
  the PR, the discussion, or the approach that was rejected. That belongs in a commit message or in
  DECISIONS.md.

## Commits and PRs

Commit messages follow a loose conventional-commit style (`feat:`, `fix:`, `docs:`, `chore:`), with
the *why* in the body when it isn't obvious from the diff.

Keep PRs focused on one thing. A drive-by refactor bundled with a bug fix makes both harder to
review and impossible to revert independently.

## Reporting bugs

Use the issue templates — they ask for the environment details that actually matter here (WebView
vs. browser, which integration path, whether your app itself mounted). A report without them
usually can't be acted on, because the same symptom has very different causes in a `WKWebView`
inside a native shell than it does in desktop Chrome.

For anything security-sensitive, **don't open a public issue** — see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE) that covers this project.
