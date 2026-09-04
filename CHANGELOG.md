# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the version is below
`1.0.0`, the public API may change in a minor release — see [Versioning](#versioning).

## [Unreleased]

### Added

- Repository metadata, contribution guidelines, security policy, and code of conduct.
- `getVersion()` and `getBuildId()`, exposing the package version and release-commit build id that
  the console's own header already showed internally.

## [0.7.6] - 2026-08-26

First release with the repository public. Versions before this one were published to npm while the
source was still private and are not documented individually — the entries below describe the
feature set as it stands at the point the project was opened up.

### Added

- Mobile-friendly console UI, toggled with a two-finger long press or a configurable keyboard
  shortcut, dockable to any edge with persisted position and size.
- Interception of `console.log`, `console.error`, `console.warn`, `console.info` and
  `console.debug`, plus uncaught errors and unhandled promise rejections.
- Interactive object inspector for Objects, Arrays, Maps, Sets, and other built-ins.
- REPL evaluating against the page's real globals, with result preview as you type and history
  persisted across reloads. Can be disabled entirely with `replEnabled: false`.
- Five themes: `vscode`, `chrome-light`, `dracula`, `nord`, `tokyo`.
- Two integration paths: an explicit runtime import, and a Vite plugin that injects the console
  before the application bundle runs.
- Syntax highlighting for logged values and REPL input.
- No runtime dependencies, and no outbound network calls of any kind.

## Versioning

This project is pre-1.0. Under Semantic Versioning that means the public API is not yet frozen:

- **`0.x` minor bumps** (`0.7.0` → `0.8.0`) may contain breaking changes.
- **`0.x` patch bumps** (`0.7.0` → `0.7.1`) are fixes and additions that don't break existing usage.

Anything that breaks is called out under a **Changed** or **Removed** heading with migration notes.

The public API covered by this promise is: the `installVirtualConsole()` options and its return
value, the `toggleConsole()` export, the Vite plugin's options, the package entry points declared
in `exports`, the documented theme names, and the `--vc-z-index` CSS custom property.

[Unreleased]: https://github.com/codehacks-io/virtual-console/compare/v0.7.6...HEAD
[0.7.6]: https://github.com/codehacks-io/virtual-console/releases/tag/v0.7.6
