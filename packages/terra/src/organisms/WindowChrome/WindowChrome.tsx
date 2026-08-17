import React from 'react';
import { Island } from '../../atoms/Island';
import { Text } from '../../atoms/Text';
import type { ButtonSize } from '../../atoms/Button';
import { FlexContainer } from '../../layout/FlexContainer';
import { ButtonIsland } from '../../molecules/ButtonIsland';
import { WindowControls } from '../../molecules/WindowControls';
import type { WindowControlsHandlers } from '../../molecules/WindowControls';
import styles from './WindowChrome.module.css';
import dragStyles from './dragRegion.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface WindowChromeProps {
  /** App icon/mark, shown before `title` in the leading pill. */
  icon?: React.ReactNode;
  /** App/window name, shown next to `icon`. */
  title?: React.ReactNode;
  /** Free/growable middle region — a `TabView`, breadcrumbs, or
   * nothing. Fills whatever space the other three regions leave; when
   * omitted it's just blank draggable bar, not an empty visible pill.
   * Arbitrary content WindowChrome doesn't control — size it yourself
   * (e.g. `<Input size="lg" />`) to match a non-default `size`. */
  tabs?: React.ReactNode;
  /** Quick-tools pill — pass `Button`s directly, same as any
   * `ButtonIsland` (they get sized/clipped/hairlined automatically). */
  tools?: React.ReactNode;
  /** System-tools pill (settings, account, ...) — sits left of the
   * window controls in the trailing group. */
  systemTools?: React.ReactNode;
  /** Minimize/maximize/close handlers — the entire boundary between
   * this component and whatever runtime (Tauri, Electron, ...) actually
   * performs them. See `WindowControlsHandlers`. */
  windowControls: WindowControlsHandlers;
  /**
   * Sizing token — sets the bar height from the matching
   * `--stella-size-*` control token (same scale `Button`/`ButtonIsland`
   * use) and cascades into every region WindowChrome renders itself:
   * `tools`, `systemTools`, and `WindowControls` all pick it up as
   * their own `size`, so a single prop keeps the whole bar's controls
   * on one scale instead of tuning each pill separately. Doesn't reach
   * into `tabs` — that's freeform content WindowChrome doesn't own, see
   * `tabs` above.
   * @default 'md'
   */
  size?: ButtonSize;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * WindowChrome - custom title bar for a frameless desktop window. Four
 * fixed regions, controlled entirely through props rather than compound
 * children — unlike `Dialog`'s Header/Body/Footer, a title bar's
 * leading/center/trailing structure isn't something callers should be
 * free to reorder, so named slots give better type safety than
 * compound composition would here (`windowControls` is typed as the
 * IPC handler interface, `tools` as plain `ReactNode`, etc.):
 *
 * 1. **Brand** — `icon` + `title`, a pill on the leading edge.
 * 2. **Tabs** — free/growable space. Renders whatever you pass
 *    directly, with no forced Island wrapper — a search `Input`, plain
 *    text, or a future `TabView` all render as-is; wrap it yourself in
 *    an `Island` if you want the pill look the other three regions
 *    have. Only opts the exact content out of the drag region when
 *    something's actually there, so empty space stays draggable.
 * 3. **Tools** — a quick-actions pill.
 * 4. **Trailing** — `systemTools` pill + `WindowControls` pill.
 *
 * Renders no window chrome of its own beyond a transparent flex strip
 * at a height set by `size` (`--stella-bar-height`'s own formula —
 * one control token plus its borders — generalized across the whole
 * `ButtonSize` scale instead of hardcoded to `md`). Every visible
 * surface (background/border/radius) belongs to the individual pills,
 * matching `Island`'s own principle that nothing sits flush against
 * the window edge. The app canvas shows through between the regions,
 * so place this on whatever background your window root uses.
 *
 * Handles the actual "drag to move the window" behavior itself: the
 * bar carries both `-webkit-app-region: drag` (Electron) and
 * `data-tauri-drag-region` (Tauri) unconditionally, since Terra is
 * runtime-agnostic and can't assume which one wraps it — see
 * `dragRegion.module.css` for why both are needed. Every pill inside
 * is explicitly marked `no-drag`, and double-clicking empty bar space
 * calls `windowControls.maximize` if provided (standard OS behavior).
 *
 * For an app that doesn't want the fixed 4-region layout at all — just
 * a draggable bar with window controls and fully custom content — use
 * `EmptyWindowChrome` instead.
 *
 * @example
 * ```tsx
 * <WindowChrome
 *   icon={<img src="/ray.svg" width={18} height={18} />}
 *   title="Ray IDE"
 *   tabs={<TabView ... />}
 *   tools={<Button iconOnly aria-label="Search"><Search /></Button>}
 *   systemTools={<Button iconOnly aria-label="Settings"><Settings /></Button>}
 *   windowControls={{
 *     minimize: () => appWindow.minimize(),
 *     maximize: () => appWindow.toggleMaximize(),
 *     close: () => appWindow.close(),
 *     maximized: isMaximized,
 *   }}
 * />
 * ```
 */
export function WindowChrome({
  icon,
  title,
  tabs,
  tools,
  systemTools,
  windowControls,
  size = 'md',
  className,
}: WindowChromeProps) {
  return (
    <header
      data-tauri-drag-region=""
      onDoubleClick={() => windowControls.maximize?.()}
      className={[
        styles.chrome,
        styles[`size-${size}`],
        dragStyles.dragRegion,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(icon || title) && (
        <Island
          shape="pill"
          tone="header"
          className={[styles.brand, dragStyles.noDrag].join(' ')}
        >
          <FlexContainer align="center" gap="2">
            {icon && (
              <span
                className={styles.icon}
                aria-hidden={title ? 'true' : undefined}
              >
                {icon}
              </span>
            )}
            {title && (
              <Text variant="body-strong" truncate>
                {title}
              </Text>
            )}
          </FlexContainer>
        </Island>
      )}

      <div className={styles.tabsRegion}>
        {tabs && (
          <div className={[styles.tabsContent, dragStyles.noDrag].join(' ')}>
            {tabs}
          </div>
        )}
      </div>

      {tools && (
        // Plain wrapper, not ButtonIsland's own `className` — ButtonIsland
        // forwards `className` to its *inner* FlexContainer (the button
        // row), not the outer Island that's the actual flex item here, so
        // `flex-shrink: 0` needs a real wrapper to land on the right box.
        <ButtonIsland size={size}>{tools}</ButtonIsland>
      )}

      <FlexContainer
        align="center"
        gap="2"
        className={[styles.trailing, dragStyles.noDrag].join(' ')}
      >
        {systemTools && <ButtonIsland size={size}>{systemTools}</ButtonIsland>}
        <WindowControls controls={windowControls} size={size} />
      </FlexContainer>
    </header>
  );
}

WindowChrome.displayName = 'WindowChrome';
