import React, { useCallback, useEffect, useRef } from 'react';
import { useOverlayLayer } from '../providers/OverlayProvider';
import { useAnchorPosition } from './useAnchorPosition';
import type { Anchor, Placement } from './useAnchorPosition';
import { useClickOutside } from './useClickOutside';
import { FOCUSABLE_SELECTOR } from '../utils/dom';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDismissableOverlayOptions {
  open: boolean;
  onClose?: () => void;
  anchor: Anchor | null;
  /** @default 'bottom-start' */
  placement?: Placement;
  /** @default 8 */
  offset?: number;
  /** @default 8 */
  padding?: number;
  /** Focus moves to the first element matching this selector on open
   * (falling back to the panel itself if none match).
   * @default FOCUSABLE_SELECTOR */
  initialFocusSelector?: string;
}

export interface UseDismissableOverlayResult {
  root: HTMLElement | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
  placement: Placement;
  /** Close, optionally restoring focus to whatever was focused before
   * open. Escape/Tab-style dismissal restores it; an outside pointer
   * click doesn't (that click already told the browser where focus
   * should go — pulling it back would fight the user). Exposed so a
   * caller with its own extra dismiss paths (`Menu`'s Tab-closes-menu
   * key handling) can route through the same restore-or-not decision
   * this hook already makes for Escape and outside-click. */
  requestClose: (restoreFocus: boolean) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useDismissableOverlay - the shared wiring behind `Popover` and
 * `Menu`: an anchored panel that takes focus on open, and can be
 * dismissed by Escape, an outside click, or the caller's own logic.
 * Bundles four things every such panel needs together (`useOverlayLayer`
 * for portal/stacking/Escape, `useAnchorPosition` for placement,
 * `useClickOutside` for outside dismissal, and the focus-in/focus-
 * restore effect) since `Popover` and `Menu` were previously
 * reimplementing all four side by side, near-identically.
 *
 * Deliberately doesn't try to also cover `Dialog` — a modal's backdrop
 * click and always-restore-focus semantics are different enough (and
 * `Dialog` has no `anchor` at all) that forcing it onto this shape
 * would cost more clarity than it'd save in duplication.
 *
 * @example
 * ```tsx
 * function Popover({ open, onClose, anchor, children }: PopoverProps) {
 *   const { root, panelRef, style } = useDismissableOverlay({ open, onClose, anchor });
 *   if (!open || !root) return null;
 *   return createPortal(
 *     <div ref={panelRef} style={style}>{children}</div>,
 *     root
 *   );
 * }
 * ```
 */
export function useDismissableOverlay({
  open,
  onClose,
  anchor,
  placement = 'bottom-start',
  offset = 8,
  padding = 8,
  initialFocusSelector = FOCUSABLE_SELECTOR,
}: UseDismissableOverlayOptions): UseDismissableOverlayResult {
  // Escape/programmatic close restores focus to whatever was focused
  // before open; an outside click doesn't — see `requestClose` above.
  const restoreFocus = useRef(true);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(
    (restore: boolean) => {
      restoreFocus.current = restore;
      onClose?.();
    },
    [onClose]
  );
  const handleEscapeClose = useCallback(() => requestClose(true), [requestClose]);
  const handleOutsideClose = useCallback(() => requestClose(false), [requestClose]);

  const { root } = useOverlayLayer({ open, onClose: handleEscapeClose });
  const { panelRef, style, placement: resolvedPlacement } = useAnchorPosition({
    open,
    anchor,
    placement,
    offset,
    padding,
  });

  useClickOutside(
    [panelRef, anchor instanceof HTMLElement ? anchor : null],
    handleOutsideClose,
    open
  );

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    restoreFocus.current = true;
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(initialFocusSelector);
      (first ?? panel).focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      if (restoreFocus.current) previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { root, panelRef, style, placement: resolvedPlacement, requestClose };
}
