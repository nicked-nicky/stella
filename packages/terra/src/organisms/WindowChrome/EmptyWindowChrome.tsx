import React from 'react';
import { WindowControls } from '../../molecules/WindowControls';
import type { WindowControlsHandlers } from '../../molecules/WindowControls';
import type { ButtonSize } from '../../atoms/Button';
import chromeStyles from './WindowChrome.module.css';
import dragStyles from './dragRegion.module.css';
import styles from './EmptyWindowChrome.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface EmptyWindowChromeProps {
  /** Minimize/maximize/close handlers — same interface as `WindowChrome`. */
  windowControls: WindowControlsHandlers;
  /**
   * Sizing token — sets the bar height and cascades into `WindowControls`,
   * same meaning and default as `WindowChrome`'s own `size` prop.
   * @default 'md'
   */
  size?: ButtonSize;
  className?: string;
  /** Fully custom content, left of the window controls. No layout
   * opinion beyond filling the remaining draggable width. */
  children?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * EmptyWindowChrome - the minimal title bar: a draggable strip,
 * `WindowControls`, and one `children` slot for anything else. For
 * apps that don't want `WindowChrome`'s fixed 4-region layout — a
 * launcher, a single-view utility window, anything where "brand pill +
 * tabs + tools + system tools" doesn't apply.
 *
 * Deliberately a separate component rather than `WindowChrome` with
 * every slot optional: forcing one component to branch between "fixed
 * 4-region grid" and "fully freeform" would make its internals more
 * complex than either mode actually needs. They share the two pieces
 * that are genuinely identical — `WindowControls` and the drag-region
 * handling (`dragRegion.module.css`, reused here alongside
 * `WindowChrome.module.css`'s own `.chrome` strip) — and nothing else.
 *
 * @example
 * ```tsx
 * <EmptyWindowChrome windowControls={{ minimize, maximize, close, maximized }}>
 *   <Text variant="body-strong">Quick Capture</Text>
 * </EmptyWindowChrome>
 * ```
 */
export function EmptyWindowChrome({
  windowControls,
  size = 'md',
  className,
  children,
}: EmptyWindowChromeProps) {
  return (
    <header
      data-tauri-drag-region=""
      onDoubleClick={() => windowControls.maximize?.()}
      className={[
        chromeStyles.chrome,
        chromeStyles[`size-${size}`],
        dragStyles.dragRegion,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={[styles.content, dragStyles.noDrag].join(' ')}>{children}</div>
      <WindowControls controls={windowControls} size={size} className={dragStyles.noDrag} />
    </header>
  );
}

EmptyWindowChrome.displayName = 'EmptyWindowChrome';
