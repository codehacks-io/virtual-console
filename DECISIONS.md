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

## Where to find the rest

- [README.md](README.md) - installation, configuration, and the `replEnabled: false` escape hatch
  for shipping a zero-`eval` build.
- [examples/README.md](examples/README.md) - local workspace examples vs. standalone
  published-package examples.
