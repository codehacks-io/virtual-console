# Virtual Console

A mobile-friendly virtual console for debugging web applications. Use it through an explicit runtime import or through the Vite plugin when you want early injection before your app mounts.

## Features

- 📱 **Mobile Friendly**: Toggle with 2-finger long press or Shift+C.
- 🔍 **Object Inspector**: Interactive viewer for Objects, Arrays, Maps, Sets, and more.
- 🎨 **Themable**: Comes with multiple themes (VSCode, Chrome Light, Dracula, Nord, Tokyo).
- ⚡ **Vite Plugin**: Optional early injection for Vite apps.
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
```

See [examples/README.md](examples/README.md) for the full layout (local workspace examples vs. standalone examples that install the real published package) and the `*:published` commands.

See [DECISIONS.md](DECISIONS.md) for the rationale behind non-obvious choices (REPL evaluation safety, DevTools-parity scope, known/accepted limitations) before proposing a change in those areas.

See [CLAUDE.md](CLAUDE.md) for the engineering standards contributors (human or AI) are expected to hold to in this repo.

## License

MIT