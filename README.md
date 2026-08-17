# Stella

A React-first, runtime-agnostic UI kit with a GTK 4 / libadwaita-inspired visual identity — built for fast, native-feeling desktop apps (Tauri, Electron, or any webview), and just as usable on the web.

Zero runtime CSS-in-JS. Theming is CSS custom properties, not JS-computed styles, so changing the accent, density, or rounding never forces a React re-render across the tree.

## Documentation

- **[docs/README.md](./docs/README.md)** — doc index and 30-second orientation.
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** — how to write components and styles: conventions, patterns, gotchas, checklist.
- **[docs/WIKI.md](./docs/WIKI.md)** — architecture reference: tokens, theming, Islands, overlays, window chrome, known gaps.

## Packages

- **`@stella/terra`** — the base. Thin, opinionated, functional. Every component follows atomic design (`atoms/` → `molecules/` → `organisms/`), is built on native HTML elements wherever one exists, and ships with keyboard navigation + ARIA semantics by default, not as an opt-in prop.
- **`@stella/vidrio`** — the expansion. A superset of Terra adding purely aesthetic richness: frosted glass, dynamic lighting, textures, dynamic borders. Never required to use Terra alone.

**Terra never depends on Vidrio. Vidrio depends on Terra.** That direction is fixed.

## Status

`@stella/terra` has a working component set (below) and is the package to reach for today. `@stella/vidrio` is scaffolded but empty — nothing has been built on top of Terra yet.

## Components (`@stella/terra`)

### Atoms

| Component | What it is |
|---|---|
| `Avatar` | Circular user/entity representation — image with initials fallback. |
| `Badge` | Compact status/label indicator. Non-interactive. |
| `Button` | The primary interactive element. Carries no surface, radius or variants of its own — all come from the wrapping `ButtonIsland`. Quiet label that brightens on hover; status color lives on `Badge`/`Notification` instead. |
| `Checkbox` | Native `<input type="checkbox">`, including indeterminate state. |
| `Divider` | Visual separator between content groups (horizontal or vertical rule). |
| `Icon` | Sizing/color wrapper around any icon element. Terra ships no icon set of its own — bring your own (`lucide-react` is an optional peer dependency). |
| `Input` | Bare text field atom. |
| `Island` | The core structural container of Stella's visual identity — panel, pill, or card surface with tone/shape variants that everything else (`ButtonIsland`, `Dialog`) builds on. |
| `Radio` | Native `<input type="radio">`, with roving arrow-key navigation between grouped radios for free. |
| `Separator` | A thin rule that fills its container's height/width — for use inside button groups and toolbars. |
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
| `ButtonIsland` | A row of related actions rendered as one pill-shaped toolbar cluster. Adjacent buttons get an automatic hairline between them (GTK/libadwaita's "linked" button-group convention), and children fill the island's height so clusters of different `size` still line up. `ButtonIsland.Separator` is available for an explicit sub-cluster break. |
| `Notification` | A single toast card — status color carried by the icon, not a colored border. Typically rendered for you by `NotificationProvider`. |

### Organisms

| Component | What it is |
|---|---|
| `Dialog` | GTK4/libadwaita-style modal dialogue. Compound component (`Dialog.Header` / `.Title` / `.Description` / `.Body` / `.Footer`), with focus trap, Escape-to-close, backdrop click, and a fade-out exit animation before unmount. |
| `SettingsMenu` | Data-driven settings UI — categories on the left, schema-driven fields on the right. Feed it a `SettingsSchema`; it doesn't care where values come from (local state, `ThemeManager`, anything). |

## Theming

`ThemeManager` is a framework-agnostic class that writes CSS custom properties to the document root; `ThemeProvider` / `useTheme` is the React binding most consumers actually use.

```tsx
import { ThemeProvider, useTheme } from '@stella/terra';

function App() {
  return (
    <ThemeProvider
      defaultConfig={loadedFromDisk}
      onChange={(config) => saveToDisk(config)} // Stella never persists anything itself
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

Four independent axes, each backed by one or a few CSS custom properties — set one, everything that reads it updates, no re-render required:

| Axis | Values | What it controls |
|---|---|---|
| `colorScheme` | `light` / `dark` / `system` | Light/dark palette. |
| `radius` | `sharp` / `default` / `round` | Scales every corner radius token together (`--stella-radius-scale`). Pills stay fully round except at `sharp`. |
| `density` | `compact` / `default` / `comfortable` | Scales every spacing/padding token together (`--stella-space-scale`). |
| `borderWidth` | `none` / `thin` / `default` / `thick` | Sets `--stella-border-width` directly. `none` is a genuine borderless mode — every hairline in Terra reads this one token. |

```ts
const theme = useTheme();
theme.setColorScheme('dark');
theme.setRadius('round');
theme.setDensity('compact');
theme.setBorderWidth('none');
```

## Providers

Wrap these around your app root; everything else in Terra is runtime-agnostic and needs none of them to function.

- **`ThemeProvider`** — see [Theming](#theming) above.
- **`OverlayProvider`** — coordination point for anything that renders "above" normal page flow (`Dialog`, and future `Popover`/`Dropdown`). Solves stacking order (shared portal, DOM paint order) and Escape-key scoping (only the topmost layer responds) so individual components don't each reinvent it.
- **`NotificationProvider`** — app-wide toast system. Queueing, auto-dismiss with pause-on-hover, `aria-live` announcement, and a fade-out on dismiss.

```tsx
import { OverlayProvider, NotificationProvider, ThemeProvider } from '@stella/terra';

function Root() {
  return (
    <ThemeProvider>
      <OverlayProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </OverlayProvider>
    </ThemeProvider>
  );
}
```

```tsx
import { useNotifications } from '@stella/terra';

const notify = useNotifications();
notify.success('Changes saved');
notify.error('Something went wrong', { duration: 0 }); // sticky until dismissed
```

## Design principles

1. Terra stays thin — every dependency is justified against bundle size; the default answer to "should we add this" is no.
2. Atomic design structure — atoms → molecules → organisms → layout primitives, no flat component dumps.
3. Accessibility isn't optional — keyboard navigation and correct ARIA semantics ship by default on every interactive component.
4. Theming is CSS custom properties, not JS-computed styles at runtime.
5. Visual identity is GTK 4 / libadwaita-inspired, not a generic design system — when a visual decision is ambiguous, it defaults toward what libadwaita would do.

## Requirements

- Node >= 20
- pnpm (workspaces)
- React >= 18

## Getting started

```bash
pnpm install
pnpm dev   # runs packages/terra-test, a Vite app that consumes @stella/terra live via workspace:*
```

`@stella/terra` ships TypeScript source directly (no build step, `main`/`types` point straight at `src/index.ts`) — editing a component in `packages/terra/src` hot-reloads in `terra-test` the same as editing `terra-test` itself. This means Terra currently only works via the pnpm workspace; it isn't yet publishable to a registry as a standalone package (no `dist/`, no library build).

## Repository structure

```
packages/
  terra/       @stella/terra  — base package (this is what you install)
  vidrio/      @stella/vidrio — aesthetic expansion, depends on @stella/terra via workspace:*
  terra-test/  Vite + React app used for local development and as a living component showcase
```

Each package follows atomic design: `src/atoms/`, `src/molecules/`, `src/organisms/`, `src/layout/`, plus `src/providers/` and `src/theme/` for the app-level systems.

## License

MIT — see [LICENSE](./LICENSE).
