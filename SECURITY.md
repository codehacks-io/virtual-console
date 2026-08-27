# Security policy

## Reporting a vulnerability

**Please don't open a public issue for a security problem.**

Use GitHub's private vulnerability reporting instead:
[**Report a vulnerability →**](https://github.com/codehacks-io/virtual-console/security/advisories/new)

That opens a private thread visible only to you and the maintainers. You'll get an acknowledgement
within a few days. If a fix is warranted, it ships in a patch release and the advisory is published
once users have had a chance to upgrade.

This is a small project maintained by one person, so please be patient with response times — and
credit is given in the advisory unless you'd rather stay anonymous.

## Supported versions

Only the latest published version receives fixes. While this project is pre-1.0, there are no
long-term support branches; upgrade to the newest release before reporting.

## Things that are by design, not vulnerabilities

Some behaviour that might look alarming is documented and intentional. Please read
[DECISIONS.md](DECISIONS.md) before reporting these:

### The REPL evaluates code with `eval`

This is the entire purpose of the REPL — it's a developer tool for inspecting a running page, and
evaluating what you type is what it's for. The code it evaluates comes from whoever is typing into
the console on their own device. It is not a sandbox, and it is not trying to be one.

**If you ship this to production and consider that a risk, disable it:**

```typescript
installVirtualConsole({ replEnabled: false });
```

That removes the eval surface entirely, leaving a read-only log viewer.

### The console reads and writes `localStorage`

Theme choice, dock position and size, and REPL history are persisted under keys prefixed
`virtual-console:` on the page it's installed on. Nothing else is stored, and nothing is
transmitted — see the Privacy section of the [README](README.md#privacy).

### The console renders your application's data

The whole point is to display what your app logs, including objects you pass to `console.log`. If
your app logs secrets, the console will show them to whoever is holding the device. That's your
app's logging to fix, not the console's rendering.

## What *is* worth reporting

- A way for **page content your app didn't log** to execute code through the console — for example,
  a crafted object or string that escapes the log renderer and runs as script when displayed.
- Any outbound network request originating from this library. It should make none, ever.
- A way to reach the REPL's evaluation when `replEnabled: false` is set.
- The Vite plugin leaking the console into a production build in a configuration where the
  documented behaviour says it shouldn't.
- Anything that lets one page's stored console data be read by a different origin.
