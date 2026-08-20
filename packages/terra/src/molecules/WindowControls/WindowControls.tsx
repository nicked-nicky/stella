import React from 'react';
import { Button } from '../../atoms/Button';
import type { ButtonSize } from '../../atoms/Button';
import { ButtonIsland } from '../ButtonIsland';
import {
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  RestoreIcon,
} from '../../utils/icons';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Maps window commands to whatever actually performs them — a Tauri
 * `getCurrentWindow().minimize()` call, an Electron IPC send, anything.
 * `WindowControls` (and `WindowChrome`, which just forwards this
 * straight through in both of its render modes) know nothing about
 * either runtime; this interface is the entire boundary.
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
  /** Explicitly `| undefined` so a parent (WindowChrome) can forward its
   * own optional `className` straight through under
   * `exactOptionalPropertyTypes`. */
  className?: string | undefined;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * WindowControls - minimize/maximize/close as one linked `ButtonIsland`
 * cluster, matching modern GTK4/libadwaita's default (not the classic
 * GNOME 2/3 split of minimize+maximize separated from close). Used by
 * both of `WindowChrome`'s render modes — build your own custom title
 * bar without it and this is still the piece that knows how to render
 * the three buttons correctly.
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
