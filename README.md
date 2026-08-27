# Virtual Console

DevTools-style console for the places that don't have DevTools — iOS WebViews, Android WebViews, any page where `console.log` goes nowhere. Logs, object inspector, and a REPL that reaches your app's live globals. Injects before your app boots — and runs whether your app boots, crashes, or never starts at all.

Use it through an explicit runtime import, or through the Vite plugin when you want it injected before your app bundle runs.

### Why this exists

A `WKWebView` inside a native app can't be opened in Safari Web Inspector unless the app that hosts it sets [`isInspectable`](https://developer.apple.com/documentation/webkit/wkwebview/isinspectable), which defaults to `false` — so if you don't own the native shell, there is no console to open. Even when you do own it, an inspector you attach after the fact can't show you what already happened during boot. This console is rendered by the page itself, so it's attached from the first line of script, to everyone looking at the screen.

**[Try the live demo →](https://virtual-console.codehacks.io/)** — no install required. Or [open the demo source in StackBlitz](https://stackblitz.com/github/codehacks-io/virtual-console/tree/main/demo) to run and edit it in-browser.

## Features

- 📱 **Mobile Friendly**: Toggle with 2-finger long press or Shift+C.
- 🚀 **Independent of Your App**: Rendered by the page, sharing no lifecycle with your framework — it's there even if your app never mounts.
- 🔍 **Object Inspector**: Interactive viewer for Objects, Arrays, Maps, Sets, and more.
- ⌨️ **Live REPL**: Evaluate expressions against your app's real globals, with a preview of the result as you type.
- 🧯 **Catches What You'd Miss**: Intercepts `console.log`/`error`/`warn`/`info`/`debug`, plus uncaught errors and unhandled promise rejections.
- 🎨 **Themable**: Comes with multiple themes (VSCode, Chrome Light, Dracula, Nord, Tokyo).
- ⚡ **Vite Plugin**: Optional injection before your app bundle runs, so boot-time logs aren't lost.
- 📦 **Zero Runtime Dependencies**: Nothing pulled in at runtime; Vite is an optional peer.
- 🔒 **No Telemetry**: Fully local and self-contained — see [Privacy](#privacy).

### Installation

```bash
pnpm add @codehacks/virtual-console
# or
npm install @codehacks/virtual-console
```

## Usage

### Explicit Import

```typescript
import { installVirtualConsole } from '@codehacks/virtual-console';
import '@codehacks/virtual-console/styles.css';

const virtualConsole = installVirtualConsole({
  maxLogs: 100
});

// Later, from your framework cleanup lifecycle:
virtualConsole.destroy();
```

### Vite Plugin

Add the plugin to your `vite.config.ts` when you want the console injected before your app bundle runs:

```typescript
import { defineConfig } from 'vite';
import { virtualConsoleVitePlugin } from '@codehacks/virtual-console/plugins/vite';

export default defineConfig({
  plugins: [
    virtualConsoleVitePlugin({
      // Specify available themes. The first one will be the default.
      themes: ['vscode', 'chrome-light', 'dracula'],
      options: {
        maxLogs: 100
      }
    })
  ]
});
```

## Configuration

The console supports the following themes:
- `vscode` (Default Dark)
- `chrome-light` (Chrome DevTools Light)
- `dracula`
- `nord`
- `tokyo`

`installVirtualConsole()` accepts a partial `VirtualConsoleConfig`:

```typescript
installVirtualConsole({
  maxLogs: 100,               // logs kept before the oldest is dropped
  minHeight: 100,              // dock bounds when docked top/bottom
  maxHeight: window.innerHeight * 0.8,
  defaultHeight: 200,
  minWidth: 200,                // dock bounds when docked left/right
  maxWidth: window.innerWidth * 0.8,
  defaultWidth: 400,
  keyboardShortcut: { code: 'KeyC', shiftKey: true }, // see below
  longPressFingers: 2,          // mobile activation gesture
  longPressDuration: 500,       // ms
  replEnabled: true,            // set false to remove the eval-based REPL entirely
  replHistoryLimit: 50,         // REPL commands kept in localStorage
  targetElement: undefined      // mount into a specific element instead of <body>
});
```

### Keyboard shortcut

`keyboardShortcut` takes a `KeyboardEvent.code` plus the exact modifiers that must be held - every
modifier not listed is required to be *up*, so the match is exact and won't fire on an unrelated
combination that happens to share a key:

```typescript
// Ctrl+Shift+D instead of the default Shift+C
installVirtualConsole({ keyboardShortcut: { code: 'KeyD', ctrlKey: true, shiftKey: true } });

// Disable the keyboard shortcut entirely (e.g. only use the long-press gesture,
// or wire your own trigger to the exported `toggleConsole()`)
installVirtualConsole({ keyboardShortcut: null });
```

The shortcut is automatically ignored while focus is inside a text input, textarea, select, or
`contenteditable` element (including the console's own REPL input) so it can't hijack a keystroke
the app being debugged relies on.

### Disabling the REPL

The REPL evaluates whatever you type via `eval`. If you want to ship a read-only log viewer with
no eval surface at all (e.g. a build that might reach production), set `replEnabled: false`.

### Styling overrides

The console's stacking order can be adjusted from your own CSS without a JS config option, in case
your app already has a very-high-`z-index` overlay of its own:

```css
:root {
  --vc-z-index: 2147483000;
}
```

## Activation

- **Desktop**: Press `Shift + C` (or `Escape` to close while the console is focused), configurable via `keyboardShortcut`
- **Mobile**: Long press with 2 fingers for 0.5s, configurable via `longPressFingers` / `longPressDuration`

## Privacy

Virtual Console makes zero outbound network or telemetry calls of its own. It only reads/writes `localStorage` on the page it's installed on (theme choice, dock position/size, REPL history - all under keys prefixed `virtual-console:`) and renders everything locally in the DOM it creates. Nothing you log or throw is ever sent anywhere by this library.

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Lint
pnpm lint

# Typecheck
pnpm typecheck

# Run the test suite
pnpm test

# Run local workspace examples
pnpm dev:import:local
pnpm dev:vite-plugin:local

# Build local workspace examples
pnpm build:local

# Run the public demo site
pnpm dev:demo

# Build the public demo site
pnpm build:demo
```

See [examples/README.md](examples/README.md) for the full layout (local workspace examples vs. standalone examples that install the real published package) and the `*:published` commands.

See [demo/README.md](demo/README.md) for the public demo site (`demo/`) - it's not one of the examples above; it's the landing page at [virtual-console.codehacks.io](https://virtual-console.codehacks.io/), redeployed automatically on every stable release.

See [DECISIONS.md](DECISIONS.md) for the rationale behind non-obvious choices (REPL evaluation safety, DevTools-parity scope, known/accepted limitations) before proposing a change in those areas.

See [CLAUDE.md](CLAUDE.md) for the engineering standards contributors (human or AI) are expected to hold to in this repo.

## License

MIT