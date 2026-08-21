# Stella

<!-- Replace OWNER in the CI badge below with the GitHub account this repo lives under. -->
[![CI](https://github.com/OWNER/stella/actions/workflows/ci.yml/badge.svg?branch=alpha)](https://github.com/OWNER/stella/actions/workflows/ci.yml)
[![Status: alpha](https://img.shields.io/badge/status-alpha-orange.svg)](#project-status)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[![Runtime dependencies: 0](https://img.shields.io/badge/runtime%20deps-0-success.svg)](./packages/terra/package.json)
[![React](https://img.shields.io/badge/react-18%20%7C%2019-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](./tsconfig.base.json)
[![Node](https://img.shields.io/badge/node-%3E%3D20.19-339933.svg)](https://nodejs.org)

[![Tests: 204](https://img.shields.io/badge/tests-166%20unit%20%2B%2038%20component-success.svg)](./WIKI.md#testing)
[![Accessibility: axe-core](https://img.shields.io/badge/a11y-axe--core-6f42c1.svg)](./WIKI.md#testing)
[![Code style: Prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg)](./.prettierrc)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

A React-first, runtime-agnostic UI kit with a GTK 4 / libadwaita-inspired visual identity — built for fast, native-feeling desktop apps (Tauri, Electron, or any webview), and just as usable on the web.

Zero runtime dependencies and zero runtime CSS-in-JS. Theming is CSS custom properties, not JS-computed styles, so changing the colour scheme, density, rounding, or border weight never forces a React re-render across the tree.

**[WIKI.md](./WIKI.md)** — how to develop, how to use components, component structure & conventions, architecture reference, testing. **[CONTRIBUTING.md](./CONTRIBUTING.md)** — how to send a change.

## Packages

- **`@stella/terra`** — the base. Thin, opinionated, functional. Every component follows atomic design (`atoms/` → `molecules/` → `organisms/`), is built on native HTML elements wherever one exists, and ships with keyboard navigation + ARIA semantics by default, not as an opt-in prop.
- **`@stella/vidrio`** — the expansion. A superset of Terra adding purely aesthetic richness: frosted glass, dynamic lighting, textures, dynamic borders. Never required to use Terra alone.

**Terra never depends on Vidrio. Vidrio depends on Terra.** That direction is fixed.

`@stella/terra` has a working component set (below) and is the package to reach for today. `@stella/vidrio` is scaffolded but empty — nothing has been built on top of Terra yet. Neither is published yet (`private: true`) — see [WIKI.md's publish checklist](./WIKI.md#how-to-develop).

## Project status

**Alpha, and honest about it.** Terra's component set is complete enough to build a real app against — the author uses it for exactly that — but it is pre-1.0, unpublished, and the API is still allowed to move.

What's solid:

- 22 components across atoms, molecules, organisms and layout, plus three app-level providers.
- 204 tests: 166 in Vitest for logic, ARIA and keyboard behaviour, 38 in Playwright for things only a real browser can answer (resolved CSS, computed geometry), with axe-core scanning the component tree.
- Zero runtime dependencies. React and React DOM are peers; `lucide-react` is an *optional* peer, only if you use `Icon` with it.
- CI runs format, typecheck, both test layers and the build on every push.

What isn't, yet — the full list lives in [WIKI.md → Known gaps](./WIKI.md#known-gaps):

- `@stella/vidrio` is an empty scaffold.
- Component tests run in Chromium only, so the visual layer is unverified on WebKit.
- No published package, no semver guarantees, no ESLint config.

## Components (`@stella/terra`)

### Atoms

| Component | What it is |
|---|---|
| `Avatar` | Circular user/entity representation — image with initials fallback. |
| `Badge` | Compact status/label indicator. Non-interactive. |
| `Button` | The primary interactive element. Carries no border, surface, or radius of its own — all come from the wrapping `ButtonIsland`. |
| `Checkbox` | Native `<input type="checkbox">`, including indeterminate state. |
| `Divider` | Visual separator between content groups (horizontal or vertical rule). |
| `Icon` | Sizing/color wrapper around any icon element. Terra ships no icon set — bring your own (`lucide-react` is an optional peer dependency). |
| `Input` | Bare text field atom. |
| `Island` | The core structural container — panel, pill, or card surface with tone/shape variants everything else builds on. |
| `Radio` | Native `<input type="radio">`, with roving arrow-key navigation between grouped radios for free. |
| `Spinner` | Indeterminate loading indicator, inherits `currentColor`. |
| `Switch` | GTK-style toggle — no native HTML switch element, so this is the one atom with custom keyboard/ARIA wiring on top of a `<button>`. |
| `Text` | Typography primitive mapping directly to Terra's type scale. |

### Layout

| Component | What it is |
|---|---|
| `FlexContainer` | Configurable flexbox wrapper — the layout primitive everything else composes with. One-dimensional only; reach for CSS Grid directly for two-dimensional layouts. |

### Molecules

| Component | What it is |
|---|---|
| `ButtonIsland` | A row of related actions rendered as one pill-shaped toolbar cluster. Adjacent buttons get an automatic hairline (a real `Divider`, auto-inserted), and children fill the island's height so clusters of different `size` still line up. `ButtonIsland.Separator` is available for an explicit sub-cluster break. |
| `Notification` | A single toast card — status color carried by the icon, not a colored border. Typically rendered for you by `NotificationProvider`. |
| `Tooltip` | Anchored hover/focus label. |
| `WindowControls` | Minimize/maximize/close cluster for a custom title bar. |

### Organisms

| Component | What it is |
|---|---|
| `Dialog` | GTK4/libadwaita-style modal. Compound component (`Dialog.Header` / `.Title` / `.Description` / `.Body` / `.Footer`), focus trap, Escape-to-close, backdrop click, fade-out exit animation. |
| `Menu` | Anchored action list (dropdown or right-click context menu) with full keyboard navigation (arrow keys, typeahead, Home/End). |
| `Popover` | Anchored floating content, same positioning/stacking machinery as `Menu`. |
| `SettingsMenu` | Data-driven settings UI — categories on the left, schema-driven fields on the right. Feed it a `SettingsSchema`; it doesn't care where values come from. |
| `WindowChrome` | Runtime-agnostic custom title bar (Tauri/Electron/web), draggable region, optional tabs/tools/system controls. |

## Theming

`ThemeManager` writes CSS custom properties to the document root; `ThemeProvider`/`useTheme` is the React binding most consumers use. Four independent axes, each backed by a scale token — set one, everything reading it updates, no re-render required:

There is deliberately **no accent hue**. Stella has a single neutral colour scheme, and colour is reserved for exactly five status meanings (success / info / warning / error / debug) carried by `Badge` and `Notification`. A "checked" control inverts to the foreground tone rather than picking a brand colour.

| Axis | Values |
|---|---|
| `colorScheme` | `light` / `dark` / `system` |
| `radius` | `sharp` / `default` / `round` |
| `density` | `compact` / `default` / `comfortable` |
| `borderWidth` | `none` / `thin` / `default` / `thick` |

```tsx
import { ThemeProvider, useTheme } from '@stella/terra';

function App() {
  return (
    <ThemeProvider defaultConfig={loadedFromDisk} onChange={(c) => saveToDisk(c)}>
      <YourApp />
    </ThemeProvider>
  );
}
```

Full example, provider list, and the `ThemeManager` API are in [WIKI.md → How to use components](./WIKI.md#how-to-use-components).

## Design principles

1. Terra stays thin — every dependency is justified against bundle size; the default answer to "should we add this" is no.
2. Atomic design structure — atoms → molecules → organisms → layout primitives, no flat component dumps.
3. Accessibility isn't optional — keyboard navigation and correct ARIA semantics ship by default on every interactive component.
4. Theming is CSS custom properties, not JS-computed styles at runtime.
5. Visual identity is GTK 4 / libadwaita-inspired, not a generic design system — when a visual decision is ambiguous, it defaults toward what libadwaita would do.

## Getting started

```bash
pnpm install
pnpm typecheck
pnpm test                                  # Vitest — logic, ARIA, keyboard
pnpm --filter @stella/terra test:ct        # Playwright — resolved CSS, geometry, axe
```

The component showcase used for day-to-day development (`packages/terra-test`) lives in its own repository and is **not** part of this one — it's gitignored here, so `pnpm dev` has nothing to run on a fresh clone. Drop a Vite app in at `packages/terra-test` and the pnpm workspace picks it up automatically, consuming `@stella/terra` straight from source with hot reload.

See [WIKI.md → How to develop](./WIKI.md#how-to-develop) for the build, test, and publish workflow.

## License

MIT — see [LICENSE](./LICENSE).
