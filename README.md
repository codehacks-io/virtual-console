# Virtual Console

A bullet-proof, mobile-friendly virtual console for debugging web applications. It injects itself as the very first script to catch errors even if your main application fails to load.

## Features

- 🚀 **Bullet-proof Injection**: Injected at the top of `<body>` to catch early errors.
- 📱 **Mobile Friendly**: Toggle with 2-finger long press or Shift+C.
- 🔍 **Object Inspector**: Interactive viewer for Objects, Arrays, Maps, Sets, and more.
- 🎨 **Themable**: Comes with multiple themes (VSCode, Chrome Light, Dracula, Nord, Tokyo).
- ⚡ **Vite Plugin**: Easy integration with Vite.

## Installation

### 1. Configure Registry
Create an `.npmrc` file in your project root:

```ini
@codehacks-io:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 2. Install Package

```bash
# Ensure GITHUB_TOKEN is set in your environment
export GITHUB_TOKEN=your_token_here

pnpm add -D @codehacks-io/virtual-console
# or
npm install -D @codehacks-io/virtual-console
```

## Usage

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { virtualConsoleVitePlugin } from '@codehacks-io/virtual-console';

export default defineConfig({
  plugins: [
    virtualConsoleVitePlugin({
      // Specify available themes. The first one will be the default.
      themes: ['vscode', 'chrome-light', 'dracula']
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

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run the playground
pnpm dev
```

## License

MIT