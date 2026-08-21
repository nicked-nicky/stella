# @stella/terra

[![npm](https://img.shields.io/npm/v/@stella/terra/alpha.svg)](https://www.npmjs.com/package/@stella/terra)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Runtime dependencies: 0](https://img.shields.io/badge/runtime%20deps-0-success.svg)](#zero-runtime-dependencies)

A React-first, runtime-agnostic UI kit with a GTK 4 / libadwaita-inspired visual identity — built for fast, native-feeling desktop apps (Tauri, Electron, or any webview), and just as usable on the web.

> **Alpha.** The component set is complete enough to build a real app against, but this is pre-1.0 and the API is still allowed to move. Pin an exact version if that matters to you.

## Install

```bash
npm install @stella/terra@alpha
# or: pnpm add @stella/terra@alpha
```

React 18 or 19 is a peer dependency. `lucide-react` is an _optional_ peer — only needed if you feed Lucide icons to `Icon`.

## Quick start

Import the design tokens once, at your app entry. Nothing renders correctly without them — every component reads its colours, spacing and radii from these custom properties.

```tsx
import "@stella/terra/styles/tokens.css";
```

Then wrap your app in the providers you actually need. All three are optional and independent:

```tsx
import {
	ThemeProvider,
	OverlayProvider,
	NotificationProvider,
	ButtonIsland,
	Button,
} from "@stella/terra";

export function App() {
	return (
		<ThemeProvider>
			<OverlayProvider>
				<NotificationProvider>
					<ButtonIsland>
						<Button>Save</Button>
						<Button>Cancel</Button>
					</ButtonIsland>
				</NotificationProvider>
			</OverlayProvider>
		</ThemeProvider>
	);
}
```

`ThemeProvider` for theming, `OverlayProvider` for `Dialog`/`Menu`/`Popover` stacking and Escape scoping, `NotificationProvider` for toasts. Everything else works without any of them.

## What's in it

22 components across atoms, molecules, organisms and layout primitives — `Avatar`, `Badge`, `Button`, `Checkbox`, `Divider`, `Icon`, `Input`, `Island`, `Radio`, `Spinner`, `Switch`, `Text`, `FlexContainer`, `ButtonIsland`, `Notification`, `Tooltip`, `WindowControls`, `Dialog`, `Menu`, `Popover`, `SettingsMenu`, `WindowChrome`.

Full component reference, architecture notes and the theming API live in the [repository README](https://github.com/nicked-nicky/stella#readme) and [WIKI](https://github.com/nicked-nicky/stella/blob/alpha/WIKI.md).

## Theming

Four independent axes, each written to the document root as a CSS custom property — change one and everything reading it updates with no React re-render:

| Axis          | Values                                |
| ------------- | ------------------------------------- |
| `colorScheme` | `light` / `dark` / `system`           |
| `radius`      | `sharp` / `default` / `round`         |
| `density`     | `compact` / `default` / `comfortable` |
| `borderWidth` | `none` / `thin` / `default` / `thick` |

There is deliberately no accent hue: Stella has a single neutral colour scheme, and colour is reserved for five status meanings (success / info / warning / error / debug).

Persistence is your job — `ThemeProvider`'s `onChange` hands you a plain serialisable config to save wherever your runtime saves things (Tauri's fs plugin, Electron IPC, `localStorage`).

## Zero runtime dependencies

Terra ships no runtime dependencies at all. Styling is CSS Modules with design tokens, so there is no runtime CSS-in-JS and no style recalculation on theme change. Output is unbundled — `tsc` compiles `src/` to `dist/` 1:1 with the CSS copied alongside — so your bundler tree-shakes it directly.

Because the output uses extensionless relative imports, it needs a bundler (Vite, webpack, Next, any Tauri/Electron frontend). Running it under plain Node ESM won't work.

## Browser support

Baseline 2024: Chrome 123+, Edge 123+, Safari 17.5+, Firefox 120+, WebKitGTK 2.44+. The floor comes from `light-dark()`, `:has()` and `color-scheme`, which the theming and interaction layers rely on. For Tauri on Linux this is worth checking, since it uses the system WebKitGTK.

## License

MIT — see [LICENSE](./LICENSE).
