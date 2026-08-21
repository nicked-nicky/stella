import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { computeAnchoredPosition } from '../utils/positioning';
import type { Anchor, Placement } from '../utils/positioning';

export type { Anchor, VirtualAnchor, Placement } from '../utils/positioning';
export { pointAnchor } from '../utils/positioning';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAnchorPositionOptions {
  /** Only measures/observes while true — mirrors `useOverlayLayer`'s `open`. */
  open: boolean;
  /** The element (or virtual point, via `pointAnchor`) to position against. */
  anchor: Anchor | null;
  /** @default 'bottom-start' */
  placement?: Placement;
  /** Gap between anchor and panel, in px. @default 8 */
  offset?: number;
  /** Minimum gap kept from the viewport edge when shifting. @default 8 */
  padding?: number;
}

export interface UseAnchorPositionResult {
  /**
   * Attach to the floating panel's root element (`ref={panelRef}`).
   *
   * A callback ref rather than a `RefObject`, deliberately: measurement
   * has to be driven by the node *actually attaching*, not by an
   * unrelated dependency happening to change afterwards. With a plain
   * ref object the layout effect below could run before the panel
   * mounted, bail out, and then never re-run — leaving the panel stuck
   * at `visibility: hidden` forever. That's reachable in real use: an
   * overlay rendered `open` on first mount inside a freshly-mounted
   * `OverlayProvider` doesn't get its portal root until a passive
   * effect has run, which is a commit *later* than the anchor arriving.
   */
  panelRef: (node: HTMLDivElement | null) => void;
  /** The attached panel element, or null before it mounts. Read this
   * instead of a ref when you need the node during render. */
  panel: HTMLDivElement | null;
  /** Spread onto the panel: `position: fixed` plus the resolved
   * coordinates, or hidden-at-origin before the first measurement (so
   * there's no flash at the top-left corner on mount). */
  style: React.CSSProperties;
  /** Resolved side/align *after* flip. */
  placement: Placement;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useAnchorPosition - Terra's positioning primitive for anything that
 * floats next to a trigger: Tooltip, Popover, Menu (dropdown or
 * context). Purely geometric — pair with `useOverlayLayer` for
 * portal/stacking/Escape and `useClickOutside` for dismiss-on-outside-
 * click; this hook only answers "where."
 *
 * Positions with `position: fixed` in viewport coordinates (matches
 * `OverlayProvider`'s fixed, unscrolled portal root — no scroll-offset
 * math needed). Recomputes on scroll/resize anywhere in the document
 * and whenever the panel's own size changes (`ResizeObserver`), so a
 * menu whose item list changes while open repositions itself with no
 * extra wiring from the consumer.
 *
 * Measures the panel via `panelRef` *before* it's visibly placed: the
 * first render sits at `(0, 0)` with `visibility: hidden` (not
 * `display: none` — that would report zero size), gets measured and
 * repositioned inside a layout effect (runs before paint), and only
 * then becomes visible. No flash at the origin.
 *
 * @example
 * ```tsx
 * function Popover({ open, anchor, children }: PopoverProps) {
 *   const { panelRef, style } = useAnchorPosition({ open, anchor });
 *   if (!open) return null;
 *   return createPortal(
 *     <div ref={panelRef} style={style}>{children}</div>,
 *     root
 *   );
 * }
 * ```
 */
export function useAnchorPosition({
  open,
  anchor,
  placement = 'bottom-start',
  offset = 8,
  padding = 8,
}: UseAnchorPositionOptions): UseAnchorPositionResult {
  // Both, and they are not redundant: `panel` (state) drives the
  // measurement effect so it re-runs the moment the node attaches;
  // `panelRef` (the object) is what consumers read during an event
  // handler, where a render-time snapshot could be stale.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const panelElementRef = useRef<HTMLDivElement | null>(null);
  const setPanelRef = useCallback((node: HTMLDivElement | null) => {
    panelElementRef.current = node;
    setPanel(node);
  }, []);

  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [resolvedPlacement, setResolvedPlacement] =
    useState<Placement>(placement);

  const recompute = useCallback(() => {
    const panel = panelElementRef.current;
    if (!anchor || !panel) return;
    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const result = computeAnchoredPosition({
      anchorRect,
      panelWidth: panelRect.width,
      panelHeight: panelRect.height,
      placement,
      offset,
      padding,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
    setCoords({ top: result.top, left: result.left });
    setResolvedPlacement(result.placement);
  }, [anchor, placement, offset, padding]);

  // Measure + place before paint, every time the panel opens or the
  // panel node attaches (or the anchor/placement/offset/padding change
  // while it's open). `panel` in the deps is what makes the
  // panel-mounts-late case correct — see `panelRef`'s docs above.
  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    recompute();
  }, [open, panel, recompute]);

  // Anything that can move the anchor or change the viewport.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [open, recompute]);

  // Anything that changes the panel's own size (content, item count).
  useEffect(() => {
    if (!open || !panel || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(recompute);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [open, panel, recompute]);

  const style: React.CSSProperties = coords
    ? { position: 'fixed', top: coords.top, left: coords.left }
    : { position: 'fixed', top: 0, left: 0, visibility: 'hidden' };

  return { panelRef: setPanelRef, panel, style, placement: resolvedPlacement };
}
