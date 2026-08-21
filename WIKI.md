# Stella-Componente Wiki

Everything about developing Stella-Componente, using its components, and why things are built the way they are. Start here; jump to [CONTRIBUTING.md](./CONTRIBUTING.md) when you're ready to send a change.

## Contents

1. [Orientation](#orientation)
2. [How to develop](#how-to-develop)
3. [How to use components](#how-to-use-components)
4. [Component structure & conventions](#component-structure--conventions)
5. [Architecture reference](#architecture-reference)
6. [Browser support](#browser-support)
7. [Testing](#testing)
8. [Known gaps](#known-gaps)

---

## Orientation

Stella-Componente is two packages: `@stella-componente/terra` (the base — thin, functional, GTK 4/libadwaita-inspired) and `@stella-componente/vidrio` (an aesthetic superset of Terra — frosted glass, dynamic lighting; scaffolded, not built yet). Terra never depends on Vidrio; that direction is fixed.

Repo layout:

```
packages/
  terra/       @stella-componente/terra  — the package you install
  vidrio/      @stella-componente/vidrio — depends on @stella-componente/terra via workspace:*
  terra-test/  (not in this repo — see below)
```

`terra-test` is the Vite + React showcase used for day-to-day component work. It lives in a **separate repository** and is gitignored here, so a fresh clone of this repo won't have it and `pnpm dev` will find nothing to run. The pnpm workspace globs `packages/*`, so dropping it back in at that path is all it takes to restore the dev loop — no config change needed.

Every component follows atomic design: `src/atoms/`, `src/molecules/`, `src/organisms/`, `src/layout/`, plus `src/providers/` and `src/theme/` for app-level systems.

## How to develop

**Prerequisites:** Node ≥ 20.19 (Vite 8's floor), pnpm 11.

```bash
pnpm install
pnpm dev   # runs terra-test, if you have it — see Orientation
```

Terra's `src/` is consumed directly by `terra-test` through the pnpm workspace, so editing a component hot-reloads immediately — no build step in the loop. `pnpm dev` is where you'll do almost all component work, _when the showcase is present_; on a bare clone of this repo it's a no-op and the tests are your feedback loop instead.

This works because `@stella-componente/terra`'s `exports` point at `./src/index.ts`, and `publishConfig` overrides them to `./dist/` — pnpm swaps the two at publish time, so workspace consumers get live source and published consumers get compiled output, with no build step in between and no `dist/` needing to exist locally. (It previously pointed only at `dist/`, which meant `pnpm dev` failed with _"Failed to resolve entry for package @stella-componente/terra"_ on a clean checkout, since `dist/` is gitignored and never built in the dev loop.)

**Build** (only needed to actually publish — not part of the dev loop):

```bash
pnpm --filter @stella-componente/terra build
```

Terra builds unbundled: `tsc` compiles `src/` to `dist/` 1:1 (declarations included, `inlineSources: true` + `removeComments: true` — the published `dist/*.js` is comment-free but each `.js.map` embeds the original `src/` text so debugging lands in the real source without shipping `src/`), then `scripts/copy-css.mjs` copies every `*.css`/`*.module.css` alongside its compiled `.js` twin while stripping `/* … */` comments (tokens.css alone is ~59% comments), since `tsc` only touches TypeScript. No bundler in the middle — the consuming app's own bundler (Vite, webpack, Next, a Tauri frontend) resolves the CSS Modules imports from `dist/`, the same way it already resolves them from any other package. This keeps Terra genuinely thin (zero build-tool dependency shipped or required beyond `tsc`) and gives perfect tree-shaking for free, since there's no bundler decision-making step to get in the way of dead-code elimination.

The tradeoff: `dist/` output uses extensionless relative imports (`from '../atoms/Button'`), which needs a bundler to resolve — running the built output under plain Node ESM directly won't work. Every realistic Stella-Componente consumer (Vite, webpack, Next, Tauri) already has one, so this hasn't been a real constraint. `declarationMap` has no `inlineSources` equivalent, so "go to definition" on a published install lands on the `.d.ts` signature (still fully typed with JSDoc) rather than the commented implementation — runtime debugging via `.js.map` is unaffected.

**Typecheck:**

```bash
pnpm typecheck   # runs tsc in every package
```

Terra has two TS configs, and the split matters: `tsconfig.json` is the **build** config (emits `dist/`, excludes `*.test.*`/`*.ct.tsx` so tests never ship), while `tsconfig.typecheck.json` is the **check** config (`noEmit`, and additionally covers the test files, `playwright/`, and the config files themselves). `pnpm typecheck` runs the second. Without the split, `pnpm build` would emit compiled test files into `dist/` and fail on `playwright/a11y.ts` sitting outside `rootDir`.

**Format:**

```bash
pnpm format         # writes
pnpm format:check   # CI-style check, no writes
```

Prettier config: tabs + double quotes everywhere, **except** `*.{ts,tsx}` which override to spaces + single quotes (see `.prettierrc`). If a `.tsx` file looks tab-indented with double quotes, it predates that override and is due a reformat, not a new convention to match.

**Test:** see [Testing](#testing) below.

**Publish checklist** (manual, no Changesets).

Only `@stella-componente/terra` publishes. `@stella-componente/vidrio` keeps `private: true` until it has an actual component — publishing an empty package would just squat the name.

**One-time setup**

1. The `@stella-componente` scope has to belong to you before npm will accept the package — it maps to an npm org of that name, created once and free for public packages. The shorter `@stella` was taken (registered years ago, nothing published under it), which is why the scope reads the way it does; npm does not release squatted scopes, so the only options were a different scope or a dispute nobody wants to file.
2. `npm login`, or put a granular automation token in `~/.npmrc`. Never commit either — there is no `.npmrc` in this repo on purpose.
3. Enable 2FA on the npm account. For a package other people install, this is the difference between a leaked token being an inconvenience and being a supply-chain incident.

**Each release**

1. Bump `version` in `packages/terra/package.json`. Semver: patch for fixes, minor for new components/props, major for breaking API/behaviour changes. Pre-1.0, minor can carry breaking changes too (standard semver-0.x reading). Prereleases use `-alpha.N` / `-beta.N`.
2. Move the relevant entries out of `[Unreleased]` in the root `CHANGELOG.md` under a new version heading.
3. Verify locally: `pnpm typecheck && pnpm test && pnpm --filter @stella-componente/terra test:ct`. `prepublishOnly` re-runs clean/typecheck/test/build during publish anyway, so a broken tree can't ship — but the component tests aren't in that hook (they need a browser), so run them yourself.
4. `pnpm --filter @stella-componente/terra publish --tag alpha --access public --dry-run` and **read the file list**. It should be `dist/**`, `package.json`, `README.md`, `LICENSE` and nothing else. Source, tests and configs must not appear.
5. Drop `--dry-run` to publish for real.
6. `git tag v0.1.0-alpha.0 && git push --tags`.

**Why `--tag alpha` matters.** Without it npm sets the `latest` dist-tag, so `npm install @stella-componente/terra` gives everyone a prerelease. With it, `latest` stays unset until a stable release and installing the alpha is opt-in via `@stella-componente/terra@alpha`. Getting this wrong on the first publish is awkward to undo — `latest` can be repointed, but anyone who installed in between already has it pinned.

**What `publishConfig` does for you.** The package points `main`/`types`/`exports` at `./src` so the workspace consumes TypeScript source directly; `publishConfig` overrides all of them to `./dist` at publish time. pnpm performs the swap — nothing in `package.json` needs hand-editing at release, and there is no state to remember to revert afterwards.

**Unpublishing barely exists.** npm only allows it within 72 hours and only if nothing depends on the package; after that the version is permanent. `npm deprecate` is the realistic remedy. This is the reason for the dry-run step.

## How to use components

```bash
pnpm add @stella-componente/terra@alpha
```

The `alpha` tag is required while the package is pre-1.0 — `latest` is deliberately unset, so a bare `pnpm add @stella-componente/terra` will not resolve.

Import the design tokens once, at your app's entry point — everything else in Terra reads these as CSS custom properties, nothing works visually without them:

```tsx
import "@stella-componente/terra/styles/tokens.css";
```

Wrap your app root in the providers you need — none are required for a component to render, but `ThemeProvider` is needed for runtime theme switching, `OverlayProvider` for `Dialog`/`Menu`/`Popover`, `NotificationProvider` for toasts:

```tsx
import {
	ThemeProvider,
	OverlayProvider,
	NotificationProvider,
} from "@stella-componente/terra";

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

Then use components directly:

```tsx
import { ButtonIsland, Button } from "@stella-componente/terra";

<ButtonIsland size="sm">
	<Button>Cancel</Button>
	<Button active>Save</Button>
</ButtonIsland>;
```

**Worked example — `SettingsMenu`** (data-driven, schema in, changes out — it owns no state of its own beyond which category is selected):

```tsx
import { useState } from "react";
import {
	SettingsMenu,
	type SettingsSchema,
	type SettingsValues,
} from "@stella-componente/terra";

const schema: SettingsSchema = {
	categories: [
		{
			id: "general",
			label: "General",
			fields: [
				{ key: "displayName", type: "text", label: "Display name" },
				{ key: "autoSave", type: "boolean", label: "Auto-save" },
				{
					key: "startupView",
					type: "choice",
					label: "Startup view",
					options: [
						{ value: "dashboard", label: "Dashboard" },
						{ value: "last", label: "Last opened" },
					],
				},
			],
		},
	],
};

function Settings() {
	const [values, setValues] = useState<SettingsValues>({
		general: { displayName: "Jane", autoSave: true, startupView: "dashboard" },
	});

	return (
		<SettingsMenu
			schema={schema}
			values={values}
			onChange={(categoryId, key, value) =>
				setValues((prev) => ({
					...prev,
					[categoryId]: { ...prev[categoryId], [key]: value },
				}))
			}
		/>
	);
}
```

For the full component list and prop reference, generated API docs are the source of truth (TypeDoc — see [Testing/Docs](#how-to-develop)); this wiki covers usage patterns and reasoning, not a live prop table that would drift out of sync.

## Component structure & conventions

**Per-component file layout**, one folder per component under its atomic-design tier:

```
atoms/Button/
  Button.tsx
  Button.module.css
  index.ts        — barrel: export { Button, type ButtonProps, ... } from './Button';
```

`index.ts` only ever re-exports; it never contains logic. `src/index.ts` at the package root re-exports every component's barrel — that single file is Terra's entire public surface.

**When a component outgrows one file**, split by sub-component, not by concern (no generic `utils.ts`/`helpers.ts` dumping ground). `SettingsMenu` is the reference example:

```
organisms/SettingsMenu/
  SettingsMenu.tsx           — root: composition + controlled/uncontrolled state
  SettingsCategoryPanel.tsx  — internal: right-hand pane
  SettingsNav.tsx            — internal: left-hand category list
  fields/
    SettingsFieldRow.tsx     — internal: dispatches on field.type
    BooleanField.tsx
    ChoiceField.tsx
    TextField.tsx
  types.ts                   — schema types (SettingsSchema, SettingsField, ...)
  index.ts                   — still only exports SettingsMenu + its public types
```

Only the root component (`SettingsMenu`) is exported from the barrel. Everything else is `// internal — decomposition detail, not a new atom` in its own docblock, so nobody mistakes an internal split for a new part of the public API. Split when a file mixes more than one real responsibility (nav vs. panel vs. per-field-type rendering) or crosses roughly 150–200 lines of actual logic — not on a fixed line count alone.

**Compound vs. prop-driven APIs:** complex organisms use compound components (`<Dialog><Dialog.Header>…`), simple atoms stay prop-driven (`<Button variant="…">`). If a component has 2+ structurally distinct regions a consumer composes (header/body/footer), reach for compound; if it's one control with variations, reach for props.

**CSS:** CSS Modules only, zero runtime CSS-in-JS. Cross-file sharing uses `composes: x from './file.module.css'` (see `styles/shared/formControl.module.css`, `styles/shared/controlIcon.module.css`) rather than duplicating declarations. All theming is CSS custom properties (`tokens.css`) — never JS-computed inline styles for anything that varies by theme, so an accent/density/radius change never forces a React re-render.

**Accessibility:** native HTML element first (`<input type="checkbox">`, real `<button>`) — custom ARIA wiring (`role="switch"`, roving tabindex) only when no native element matches, and even then keyboard behavior and focus management are non-optional, not an opt-in prop. `:focus-visible` gets a real ring on every interactive component; see the inset-ring pattern in [Architecture reference](#architecture-reference).

**Icons:** Terra ships no icon set. Symbolic UI glyphs it does need internally (window controls, dialog close, plus `Palette`/`Sun`/`Moon`/`Monitor` for the pre-built `appearanceSettingsCategory`) live in `utils/icons.tsx`, one file, no duplication — check there before inlining a new SVG.

## Architecture reference

Deeper design reasoning that used to live as long inline comments scattered across individual component files — relocated here so it's in one searchable place instead of duplicated/drifting per file. Source comments now point back to the relevant section here instead of re-explaining it.

### Design tokens & theming

`ThemeManager` (framework-agnostic) writes CSS custom properties to the document root; `ThemeProvider`/`useTheme` is the React binding. Five independent axes, each backed by a scale token multiplier so changing one updates every component reading it with no re-render:

| Axis         | Token                                      | Values                                |
| ------------ | ------------------------------------------ | ------------------------------------- |
| Color scheme | native `light-dark()`                      | `light` / `dark` / `system`           |
| Radius       | `--stella-radius-scale`                    | `sharp` / `default` / `round`         |
| Density      | `--stella-space-scale`                     | `compact` / `default` / `comfortable` |
| Border width | `--stella-border-width`                    | `none` / `thin` / `default` / `thick` |
| Motion       | `data-stella-motion` + `--stella-motion-*` | `system` / `reduced` / `off`          |

**Single radius token model:** every component reads `--stella-radius-panel` for its rounding — there is no per-component radius scale. This was a deliberate consolidation (there used to be `-xs/-sm/-lg/-full/-pill` variants); one token that everything shares means changing the kit's overall "roundedness" is a single edit, and every surface stays visually consistent with every other one at any radius setting.

**State layers** (`--stella-state-hover` / `-active` / `-selected`) are a 3-step escalation ladder used as _background overlays_ over whatever surface tone happens to be underneath (card, muted island, toolbar) — this is deliberate: a fixed opaque hover color previously baked in an assumption about what sat underneath it (`--stella-surface-hover` once equalled `--stella-surface-muted`, so hovering anything on a muted surface was invisible). The three steps mirror a hover → active → selected ladder where each is a clear step firmer than the last.

This ladder is reused as a _border-color_ escalation too (see Button/ButtonIsland below) — which surfaced a real bug worth recording: `--stella-state-hover` and `--stella-border-default` briefly resolved to the exact same raw neutral step, so anything using state-hover as a border-color escalation above border-default was changing color "to" the color it already rested at — invisible. Fixed by giving `--stella-state-hover` its own step (`neutral-300`/`600`) distinct from `--stella-border-default` (`neutral-200`/`700`) and below `--stella-state-active` (`neutral-400`/`500`). The lesson: a token being visually correct in one context (background wash over a surface) doesn't guarantee it's correct in another (border-color over a border-default resting state) — check the actual resting value it's escalating _from_, not just the token name.

### Island — the structural primitive

`Island` is the one container every surface in Stella-Componente builds on: a bordered, elevated box (`panel` shape, block-level, fills its container) or a content-hugging pill (`pill` shape, `ButtonIsland`/toolbar clusters). Both shapes share the same radius token — shape is a layout distinction, not a rounding one. `ButtonIsland`, `Dialog`, `Menu`'s panel, `Notification` are all an `Island` underneath.

### Button / ButtonIsland — the border model

`Button` carries **no border property at all**, and no radius, and no surface of its own — all three come from the wrapping `ButtonIsland`/`Island`. This is deliberate, not an oversight: a bare `Button` outside an `Island` is square and borderless on purpose, a signal to wrap it rather than a bug.

The hairline between adjacent buttons in a `ButtonIsland` is a **real `Divider` element**, auto-inserted between every consecutive `Button` pair by `ButtonIsland.tsx` — not a border trick. (An earlier version used a reserved transparent `border-left` on `Button` colored in via a sibling selector; this was replaced because "buttons shouldn't have borders, Islands do" — border/separator ownership belongs to the container, not the control.) An explicit `ButtonIsland.Separator` already sitting between two buttons is left alone — no second one gets auto-inserted next to it.

Both the auto-inserted hairline and the outer `Island`'s own border react to a hovered/pressed `Button` child via CSS `:has()` — no JS state needed to coordinate a child's interaction with its parent's styling:

```css
.root:has(.group > button:hover:not(:disabled)) {
	border-color: var(--stella-state-hover);
}
.root:has(.group > button:active:not(:disabled)) {
	border-color: var(--stella-state-active);
}
```

`Menu` mirrors this exact pattern for its own items: no border on `.item`, a real auto-inserted `Divider` between adjacent `Menu.Item`s (dimmed one shade via a scoped `.autoSeparator` class since it's a row boundary, not a group break — an explicit `Menu.Separator` stays at the louder default), same `:has()` escalation.

### Focus rings

Inset rings (`outline-offset: -2px`), not outset, on any control that lives inside a `clip`-on `Island` — an outset ring would be clipped by the wrapping pill's `overflow: hidden` and effectively invisible. `Checkbox`/`Radio`/`Switch` (never inside a clipping Island) use outset rings instead.

## Browser support

Terra targets **Baseline 2024**: Chrome 123+, Edge 123+, Safari 17.5+, Firefox 120+, and WebKitGTK 2.44+. That floor is not arbitrary — it's set by the specific modern CSS the kit leans on rather than by a support policy picked in advance:

| Feature            | Used for                                                                                                          | Consequence if unsupported                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `light-dark()`     | Every theme-dependent token is declared once instead of duplicated across a media query and an attribute selector | Colours fall back to the unresolved declaration — the theme collapses |
| `:has()`           | `ButtonIsland`'s separator and Island border reacting to a hovered/pressed child with no JS                       | Interaction states stop escalating; everything still renders          |
| `color-scheme`     | Native scrollbars, selection, caret and form chrome following the theme                                           | Dark app with light native chrome                                     |
| `scrollbar-gutter` | `SettingsMenu`'s columns reserving their scrollbar gutter                                                         | Content reflows when a scrollbar appears                              |

For desktop hosts this floor is easier than it looks: Tauri on macOS and Electron everywhere ship a modern engine you don't choose. The one to watch is **Tauri on Linux**, which uses the system WebKitGTK — an older distro can land below 2.44.

Two host-specific integrations are worth knowing about, both in `WindowChrome`:

- **Dragging** is declared twice, unconditionally — `data-tauri-drag-region` for Tauri and `-webkit-app-region: drag` for Electron — because Terra is runtime-agnostic and can't know which shell wraps it. Electron additionally needs every interactive child marked `no-drag` or the buttons swallow their own clicks; that's handled for you.
- **Window controls** are neutral by design, with no red close button, because colour in Stella-Componente means status and nothing else.

## Testing

Two layers, deliberately not one — jsdom (what Vitest runs against) doesn't evaluate real CSS: no `:has()`, no `light-dark()`, no real computed-style cascade. A whole class of real bug (the `--stella-state-hover`/`--stella-border-default` collision above) is invisible to a jsdom-based test no matter how thorough, because jsdom never actually paints anything.

**Vitest + Testing Library** (`pnpm --filter @stella-componente/terra test`) — logic, ARIA attributes, controlled/uncontrolled behavior, keyboard event handlers. Colocated as `Component.test.tsx` next to the component. See `Checkbox.test.tsx` and `Switch.test.tsx` for the pattern.

**Playwright component tests** (`pnpm --filter @stella-componente/terra test:ct`) — anything whose correctness lives in actual computed CSS: state-layer escalation, `:has()` reactions, focus ring visibility. Colocated as `Component.ct.tsx`. See `ButtonIsland.ct.tsx` — it's a direct regression test for the hover-collision bug above, asserting `getComputedStyle(...).backgroundColor` actually changes on hover rather than trusting that the CSS rule exists.

**axe-core** (`@axe-core/playwright`, via the shared `checkA11y()` helper in `playwright/a11y.ts`) runs inside the Playwright layer. It complements the hand-written ARIA tests rather than replacing them — axe can't tell you that Escape closes only the topmost overlay, and the hand-written tests can't tell you the focus ring fails contrast. It's a devDependency only, so it never reaches Terra's shipped bundle. Landmark/`lang`/heading rules are disabled in the helper: components are mounted in isolation there, and those are the host application's responsibility.

### What's covered

| Layer             | Files                                                                                | What they protect                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pure logic        | `utils/positioning.test.ts`, `theme/ThemeManager.test.ts`                            | The anchored-positioning geometry (flip, cross-axis shift, alignment) and the four independent theme axes. No DOM, no React, no flake. |
| Overlay behaviour | `OverlayProvider.test.tsx`, `Dialog.test.tsx`, `Menu.test.tsx`                       | Escape scoping across stacked layers, Dialog's focus trap and focus restore, Menu's full WAI-ARIA keyboard contract.                   |
| State & timers    | `NotificationProvider.test.tsx`                                                      | Queue ordering, auto-dismiss timing, pause-on-hover, the `aria-live` region.                                                           |
| Form atoms        | `Checkbox`, `Switch`, `Input`, `Radio` `.test.tsx`                                   | Controlled/uncontrolled contracts, ARIA, disabled behaviour.                                                                           |
| Presentational    | `atoms/atoms.smoke.test.tsx`                                                         | One file of thin smoke tests for Avatar/Badge/Divider/Spinner/Text/FlexContainer/WindowControls — semantics only.                      |
| Computed CSS      | `ButtonIsland.ct.tsx`, `Button.ct.tsx`, `SettingsMenu.ct.tsx`, `WindowChrome.ct.tsx` | The state-layer ladder resolving to distinct values, focus-ring visibility and inset, the transparent chrome strip, drag regions.      |

Priority for anything new, given accessibility is non-negotiable: keyboard navigation, ARIA correctness, and controlled/uncontrolled state for every component that offers both. `Popover` and `Tooltip` are the notable remaining gaps — their positioning is covered indirectly through `positioning.test.ts`, but neither has a component test of its own yet.

## Known gaps

Kept honest deliberately — an empty list here would mean nobody's looking, not that nothing's missing.

### Coverage

- **Component tests run in Chromium only.** `playwright-ct.config.ts` defines a single project. Everything the CT layer proves about resolved CSS — the state and border ladders, `light-dark()`, `:has()`, computed geometry — is proven in Blink and nowhere else. For a kit that claims "any webview" this is the most significant gap on the list, and WebKit is the one that matters: it's where `:has()` and `light-dark()` support is newest, and it's what Tauri uses on Linux and macOS. Adding a `webkit` project to the config is the fix.
- **`Popover` and `Tooltip` have no tests of their own.** Their positioning math is covered by `utils/positioning.test.ts` and their overlay plumbing indirectly through `Menu`, but nothing exercises their own open/close/anchor behaviour.
- **No coverage thresholds in CI.** The suite is real, but nothing stops it from silently getting thinner.
- **`@stella-componente/vidrio` is an empty scaffold** — directories and a `workspace:*` dependency on Terra, no components.

### Design debt

- **`--stella-border-subtle` is identical to `--stella-border-default`.** Everything that opts into "subtle" — `Dialog`'s header/footer rules, `Menu`'s per-item hairline, `SettingsMenu`'s between-row rules — therefore draws at full strength while the CSS describes it as the faintest thing on the panel. `neutral-100/800` is the obvious step; left alone because it's a look decision, not a correctness one.
- **`--stella-state-hover` and `--stella-state-selected` are the same value, on purpose.** A selected control is distinguished by holding its fill _at rest_, not by a third colour. This is pinned by an equality assertion in `Button.ct.tsx` so it reads as a decision rather than the collision it resembles — see the note in `tokens.css` before changing either.
- **A fragment wrapper silently disables auto-hairlines.** `Children.toArray` doesn't descend into fragments, so `<Menu>{cond && <><Item/><Item/></>}</Menu>` renders its items fine and quietly drops the separators between them. Same applies to `ButtonIsland`. Pinned by a test in `Menu.test.tsx` so the behaviour is at least documented.

### Tooling

- **No ESLint config** — Prettier only, so nothing catches unused variables, exhaustive-deps violations, or accidental `any`. The hooks in `src/hooks/` already carry `eslint-disable` comments for a rule that isn't currently running.
- **Comment condensing is partial.** The plan is for deep design reasoning to live here and source docblocks to stay terse; a good number of components still carry the long-form version inline.
- **Nothing is published.** Both packages are `private: true`, there are no semver guarantees, and the release path is the manual checklist in [How to develop](#how-to-develop) rather than an automated one.
