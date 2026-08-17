import React from 'react';
import { Button } from '../../atoms/Button';
import type { ButtonSize } from '../../atoms/Button';
import { ButtonIsland } from '../ButtonIsland';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Maps window commands to whatever actually performs them — a Tauri
 * `getCurrentWindow().minimize()` call, an Electron IPC send, anything.
 * `WindowControls` (and `WindowChrome`/`EmptyWindowChrome`, which just
 * forward this straight through) know nothing about either runtime;
 * this interface is the entire boundary.
 */
export interface WindowControlsHandlers {
  minimize?: () => void;
  maximize?: () => void;
  close?: () => void;
  /** Current maximize state, if the host tracks it — swaps the
   * maximize button to a "restore" glyph when true. Omit it and the
   * button just always shows the maximize icon; this is additive, not
   * required for `maximize` to work. */
  maximized?: boolean;
}

export interface WindowControlsProps {
  controls: WindowControlsHandlers;
  /** @default 'sm' */
  size?: ButtonSize;
  className?: string;
}

// ============================================================================
// ICONS — symbolic, matching Dialog's inline-SVG close icon exactly
// (viewBox 0 0 16 16, strokeWidth 1.5, round caps/joins, no icon library).
//
// FIXES APPLIED:
// 1. Added `style={{ display: 'block' }}` to prevent the SVGs from sitting
//    on the text baseline (which causes that slight downward shift).
// 2. Changed `width="16" height="16"` to `100%` so they scale perfectly
//    inside the Button's `1.25em` `.icon` container instead of overflowing.
// 3. Fixed the Minimize path: `M4 12H12` was drawn at y=12 (75% down the
//    box). Changed to `M4 8H12` so it's perfectly centered vertically.
// ============================================================================

function MinimizeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M4 8H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="3.5"
        width="9"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M5.5 5.5V3.5H12.5V10.5H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3.5"
        y="5.5"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * WindowControls - minimize/maximize/close as one linked `ButtonIsland`
 * cluster, matching modern GTK4/libadwaita's default (not the classic
 * GNOME 2/3 split of minimize+maximize separated from close). Shared by
 * `WindowChrome` and `EmptyWindowChrome` — build your own custom title
 * bar without either and this is still the piece that knows how to
 * render the three buttons correctly.
 *
 * Every button is neutral — no red-on-hover close button. Stella has a
 * single neutral color scheme with color reserved for exactly 5 status
 * meanings (see tokens.css); a colored close button would be a sixth,
 * one-off exception to that rule.
 *
 * Renders nothing (`null`) if `controls` has no handlers at all, and
 * only renders the buttons whose handler is actually provided — a
 * consumer that can't minimize (some window managers, some Tauri
 * configs) just omits `minimize` and gets a two-button cluster, no
 * placeholder/disabled button standing in for it.
 *
 * @example
 * ```tsx
 * <WindowControls
 *   controls={{
 *     minimize: () => appWindow.minimize(),
 *     maximize: () => appWindow.toggleMaximize(),
 *     close: () => appWindow.close(),
 *     maximized: isMaximized,
 *   }}
 * />
 * ```
 */
export function WindowControls({
  controls,
  size = 'sm',
  className,
}: WindowControlsProps) {
  const { minimize, maximize, close, maximized = false } = controls;

  if (!minimize && !maximize && !close) return null;

  return (
    <ButtonIsland size={size} className={className}>
      {minimize && (
        <Button iconOnly aria-label="Minimize" onClick={minimize}>
          <MinimizeIcon />
        </Button>
      )}
      {maximize && (
        <Button
          iconOnly
          aria-label={maximized ? 'Restore' : 'Maximize'}
          onClick={maximize}
        >
          {maximized ? <RestoreIcon /> : <MaximizeIcon />}
        </Button>
      )}
      {close && (
        <Button iconOnly aria-label="Close" onClick={close}>
          <CloseIcon />
        </Button>
      )}
    </ButtonIsland>
  );
}

WindowControls.displayName = 'WindowControls';
