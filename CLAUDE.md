# Engineering standards

Ground rules for anyone — human or AI — working in this repo. Git-tracked so they survive across
machines and apply to the whole team, not just one person's local AI memory.

## Push back before implementing

If a request would introduce a poor engineering, architectural, or DevOps decision, say so
*before* writing the code — even if it was requested exactly that way. A design smell is worth
flagging on its own, whether or not it happens to cause a live bug.

Watch for:
- A build/artifact depending on ambient state (current machine, VCS status, wall clock, network)
  instead of explicitly declared inputs.
- An assumption baked in about one distribution channel, registry, CI provider, or OS that isn't
  actually guaranteed.
- Config/build scripts shelling out to discover something that should be passed in instead.

## Build inputs are declared, never discovered

A build artifact must be a pure function of its declared inputs (config, env vars passed in by
the pipeline) — never something the build script goes looking for itself (`git status`,
`git rev-parse`, hostname, etc.). Example: CI passes `VC_GIT_SHA` to the release workflow;
`tsup.config.ts` only reads it, never calls `git`. See [DECISIONS.md](DECISIONS.md) for why.

## Comments document the code, not its history

A comment explains the *code as it stands*, never the conversation, PR, or rejected approaches
that produced it. That belongs in a commit message or DECISIONS.md.

- Default to no comment. Add one only when the *why* is genuinely non-obvious.
- Don't restate *what* the code does if a reader can already see that.
- One line beats a paragraph.

## Relative links between repo files are verified, not eyeballed

This repo cross-links docs from several different directory depths (root, `demo/`, `examples/`,
`.github/`, `.github/ISSUE_TEMPLATE/`), and GitHub only renders issue/PR templates inside the "new
issue"/"new PR" flow — never on a normal repo browse — so a broken link there is easy to ship
unnoticed.

Before committing a new or edited `[text](relative/path)` link, resolve it from the *linking
file's* directory and confirm the target exists — don't hand-derive it, and don't trim a GitHub web
URL (`.../blob/main/...`) into a relative path by eye; `blob/main/` is a GitHub rendering artifact,
not a real path segment:

```bash
python3 -c "import os; print(os.path.exists(os.path.join(os.path.dirname('FILE'), 'LINK')))"
```

## Elsewhere

- [DECISIONS.md](DECISIONS.md) — why, for the non-obvious technical choices in this codebase.
- [README.md](README.md) — install, config, usage.
