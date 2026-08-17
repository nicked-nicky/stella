import React from 'react';
import { createPortal } from 'react-dom';
import { useDismissableOverlay } from '../../hooks';
import type { Anchor, Placement } from '../../hooks';
import { Island } from '../../atoms/Island';
import styles from './Popover.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface PopoverProps {
  /** Whether the popover is open. */
  open: boolean;
  /** Called on Escape (topmost layer only) or an outside click. */
  onClose?: () => void;
  /** Trigger element, or a virtual point from `pointAnchor` for a
   * cursor-anchored popover. `null` while the trigger isn't mounted
   * yet is fine — the panel just stays unpositioned until it is. */
  anchor: Anchor | null;
  /** @default 'bottom-start' */
  placement?: Placement;
  /** Gap between anchor and panel, in px. @default 8 */
  offset?: number;
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Popover - non-modal floating panel anchored to a trigger element (or
 * a cursor point). Portal/stacking/Escape/anchor-position/outside-click/
 * focus-management all come from `useDismissableOverlay` — no backdrop,
 * since GTK popovers are chromeless and let the rest of the UI stay
 * interactive underneath.
 *
 * Unlike `Dialog`, Tab does *not* get trapped inside the panel — this
 * is a non-modal surface, so focus is allowed to move on.
 *
 * No `Header`/`Body`/`Footer` compound parts: unlike `Dialog`, a
 * popover's content is usually just one thing (a form, a color picker,
 * a small settings panel) with no standard chrome to factor out. Reach
 * for `Menu` instead when the content is actually a list of actions.
 *
 * @example
 * ```tsx
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const [open, setOpen] = useState(false);
 *
 * <ButtonIsland size="sm">
 *   <Button ref={triggerRef} size="sm" onClick={() => setOpen((v) => !v)}>
 *     Filters
 *   </Button>
 * </ButtonIsland>
 * <Popover open={open} onClose={() => setOpen(false)} anchor={triggerRef.current}>
 *   <Text variant="body-strong">Filter by status</Text>
 *   ...
 * </Popover>
 * ```
 */
export function Popover({
  open,
  onClose,
  anchor,
  placement = 'bottom-start',
  offset = 8,
  className,
  children,
}: PopoverProps) {
  const { root, panelRef, style } = useDismissableOverlay({
    open,
    onClose,
    anchor,
    placement,
    offset,
  });

  if (!open || !root) return null;

  return createPortal(
    <div ref={panelRef} style={style}>
      <Island
        shape="panel"
        tone="overlay"
        tabIndex={-1}
        role="dialog"
        className={[styles.panel, className].filter(Boolean).join(' ')}
      >
        {children}
      </Island>
    </div>,
    root
  );
}

Popover.displayName = 'Popover';
