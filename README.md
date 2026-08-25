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

## Activation

- **Desktop**: Press `Shift + C`
- **Mobile**: Long press with 2 fingers for 0.5s

## Privacy

Virtual Console makes zero outbound network or telemetry calls of its own. It only reads/writes `localStorage` on the page it's installed on (theme choice, dock position/size) and renders everything locally in the DOM it creates. Nothing you log or throw is ever sent anywhere by this library.

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Typecheck
pnpm typecheck

# Run the test suite
pnpm test

# Run local workspace examples
pnpm dev:local-import
pnpm dev:local-plugin

# Build local workspace examples
pnpm build:examples
```

See [examples/README.md](examples/README.md) for the full layout (local workspace examples vs. standalone examples that install the real published package) and the `packaged-*` commands.

## License

MIT