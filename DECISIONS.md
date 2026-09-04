# Design decisions

Durable rationale for choices that aren't obvious from the code alone - so they don't have to get
re-argued or rediscovered in a future session. Add to this file when a decision was debated, has a
non-obvious "why," or intentionally leaves something unsolved.

## Scope: DevTools parity, not a "god-level terminal"

This project's REPL and console UI intentionally track feature-parity with Chrome DevTools' own
console - not a superset of it. If DevTools doesn't have a piece of UX, we don't add it here, even
when it looks like reasonable polish in isolation.

Concretely: an empty-state placeholder ("No logs yet...") was proposed, implemented, and then
**reverted** at the maintainer's explicit request - DevTools has no equivalent, and the reasoning
was "devs already know how to use a console." That's the standing bar for any future console-UX
proposal: if you can't point to DevTools doing the same thing, don't add it, however small.

This does *not* limit visual/theming polish (animations, hover states, icon systems, scrollbar
styling, resize affordances) - only new interaction patterns or explanatory UI aimed at a beginner
audience this project isn't targeting.

## REPL evaluation: reason over tokens, never over raw strings

Deciding what to do with typed REPL input - "is this an object literal or a block statement," "is
this safe to live-preview without side effects" - used to be raw substring checks
(`code.startsWith('{')`, `code.includes('(')`). That was rejected outright as brittle: a `(`
inside a string literal, or a `=>` arrow, defeats a naive `includes` check; `x++` mutates state but
contains neither `(` nor `=`, so it slipped through unnoticed.

The fix was **not** to add more special-cased string checks, and **not** to bring in a full
parser/AST. It was to extract the single-pass scanner that already existed inside the syntax
highlighter into a standalone, reusable lexer - [`src/runtime/tokenizer.ts`](src/runtime/tokenizer.ts)
- and make every REPL decision walk that token stream instead of the raw source string. Both
`syntax-highlighter.ts` (rendering) and `repl.ts` (safety/disambiguation) now consume the same
`tokenize()` output, so they can't drift out of sync with each other.

**Why a lexer and not a full parser:** a real parser (Acorn-class dependency, or a hand-rolled
grammar) would let us ask "is this valid JS" and build a real AST, but the actual bugs we kept
hitting were never "we lack a grammar" - they were blunt heuristics conflating *syntax* with
*semantics* (a `(` character isn't automatically a call; a keyword-shaped word isn't automatically
a keyword when it follows `.`). A token-position check ("a `(` only signals a call when the
preceding token is an identifier, `)`, `]`, or `?.`") solves that class of problem completely
without the bundle-size cost of a real parser in a runtime meant to be embedded in a WebView. If a
future feature genuinely needs AST-level understanding (auto-formatting, real static analysis),
that's the trigger to revisit this - not another REPL safety heuristic.

**Two related bugs already surfaced from getting this wrong once** (fixed in the same PR that
introduced the tokenizer, via self-review - see `feat/ui-polish-expensive-look` PR #14 commit
`5cc36d4`):

- `preEvaluate()`'s keyword check was a *blocklist*. `while (true) {}` has no call, no assignment,
  no mutation - so it slipped through and was live-`eval`'d on a keystroke, hanging the page before
  Enter was ever pressed. Fixed by inverting to an **allowlist** of expression-safe keywords
  (`typeof`, `void`, `this`, `in`, `instanceof`) - any keyword not on that list fails closed, so a
  future keyword doesn't silently become previewable.
- Reserved words used as property names (`gen.return()`, `mod.default`) were tokenized as
  `keyword`, which hid the call from the "is the token before `(` callable" check and let a real
  method call run mid-typing. Fixed in the tokenizer: a word directly after `.` / `?.` is always a
  property name, never a keyword.

## Object-literal disambiguation matches Chrome's own trick

`{a: 1}` is ambiguous in JS: at the top of a statement it parses as a block (with `a:` read as a
label), not an object literal, so plain `eval` throws `Unexpected token ':'`. Chrome's own console
works around this by wrapping such input in parentheses to force expression context. We do the
same: if the first significant token (skipping leading comments/whitespace) is `{`, try
`eval('(\n' + code + '\n)')` first, and fall back to evaluating the raw source if that specifically
throws a `SyntaxError` (a genuine block statement). The wrap is newline-padded so a trailing line
comment (`{a: 1} // note`) can't comment out the closing paren.

A **runtime** error thrown while building the object literal (e.g. a getter that throws) is
re-thrown as-is rather than triggering the fallback - only a `SyntaxError` from the wrap attempt
falls back, so a real error from inside the literal is never silently re-executed a second time.

## Known, accepted limitations (not bugs - don't "fix" these)

Some things are unsolvable by *any* static approach, including Chrome's own - these are documented
so nobody spends time trying to close them:

- **A getter invoked via plain property access can't be distinguished from a plain property read**
  without actually running it. `preEvaluate('foo.expensiveGetter')` will trigger that getter's side
  effects while the user is still typing, exactly like typing the same thing into Chrome's console
  does. There is no static analysis that solves this - the syntax is identical either way.
- **Tagged template calls** (`` tag`hello` ``) aren't flagged as unsafe by `isSafeToPreEvaluate()`,
  since they involve no `(` character at all. Rare enough in typical REPL usage not to be worth the
  added tokenizer/safety-check complexity.
- **Multi-line REPL input** (`src/runtime/ui.ts`, the `<textarea>` REPL input) uses `Shift+Enter`
  for a newline and plain `Enter` to run, mirroring Chrome. Arrow-key history recall is line-aware:
  `ArrowUp`/`ArrowDown` only step through history when the caret is on the first/last line, so they
  move the cursor normally everywhere else in a multi-line command.

## The public demo (`demo/`) is not one of the integration examples

`demo/` is a separate app from `examples/*` on purpose. The `examples/*` apps exist to prove each
integration path works and stay minimal by design; a public-facing "why should I care" landing
page has different goals (visual polish, a hero pitch, a live interactive demo area) and would
have compromised the examples' minimalism if bolted onto one of them. It still uses the Vite
plugin's early-injection method under the hood - that's the strongest proof of the project's core
"survives your app crashing" pitch - and, like `examples/published/*`, installs the real npm
package rather than local workspace source.

**Two independently-versioned projects: the package and the demo site.** Deploying the demo used
to be a side effect of publishing the package (`deploy-demo` ran `needs: publish` in `release.yml`,
gated to stable tags). That meant a one-line copy fix on the site had no way to ship without also
cutting a new package version - which is a false signal to npm consumers ("a new release landed")
for a change that never touched the package at all.

Fixed by giving the demo its own release line via [vump](https://github.com/okcodes/vump)'s
multi-project support - `vump.toml` now declares two `[[project]]` entries, `main` (tracking the
root `package.json`, tagged `v{version}`, unchanged) and `web` (tracking `demo/package.json`,
tagged `web-v{version}`). Each tag shape triggers its own workflow: `release.yml` still
publishes `main` to npm on a `v*` tag; the new `release-web.yml` deploys the demo to Pages on a
`web-v*` tag and nothing else. `okcodes/vump/.github/actions/check` reads the pushed tag and
infers which project it belongs to from its shape, so neither workflow has to say `--project`
explicitly. Shipping a site-only change is now `vump patch --project web --tag --push` - no
package version, no npm publish, no changelog entry.

One consequence: a stable package release no longer auto-redeploys the demo, so the version badge
in its header can lag one release behind until the demo is deployed again. That's a deliberate
trade for dropping the second trigger path entirely, rather than keeping both wired into one
shared deploy job.

**No more pinning-with-retry.** The old job pinned the demo's dependency to the exact version its
own run had *just* published (`pnpm add @codehacks/virtual-console@<version>`), retried because
the registry hadn't necessarily propagated it yet. That race only existed because publish and
deploy happened in the same run. Now they never do: `release-web.yml` just runs
`pnpm install --frozen-lockfile` - the committed `demo/pnpm-lock.yaml` is the declared input, not
something the deploy job discovers or pins live. Same
["Build inputs are declared, never discovered"](CLAUDE.md#build-inputs-are-declared-never-discovered)
principle as before, just resolved by removing the race instead of retrying around it.

**`pnpm-lock.yaml` is committed here, unlike `examples/published/*`.** That precedent's whole
justification for an uncommitted lockfile is "float on `@latest`" for the one dependency that
matters. `demo/` doesn't want that anymore - deploying is now decoupled from publishing (above),
so nothing re-pins `@codehacks/virtual-console` at deploy time. An uncommitted lockfile would just
let every dependency (that one included) drift unreproducibly on every install, local or CI.
Picking up a newer `@codehacks/virtual-console` is a deliberate, out-of-band step -
`cd demo && pnpm update @codehacks/virtual-console`, committed like any other dependency bump,
then a `web` release to actually deploy it - not something either workflow does on its own.

**Requires the repo to be public.** GitHub Pages is unavailable for private repos below a paid
org plan, and an anonymous visitor can't open a private repo in StackBlitz either - there's no way
to satisfy "one-click demo, no install" while the source stays private. The repo was made public
for this reason (2026-08-26), which also required an org-level `members_can_create_pages` policy
to be enabled - a broader-scoped, org-wide change that was called out and confirmed separately
before touching it, since it wasn't implied by "make this one repo public."

## Where to find the rest

- [README.md](README.md) - installation, configuration, and the `replEnabled: false` escape hatch
  for shipping a zero-`eval` build.
- [examples/README.md](examples/README.md) - local workspace examples vs. standalone
  published-package examples.
- [demo/README.md](demo/README.md) - the public demo site and how its deploy works.
