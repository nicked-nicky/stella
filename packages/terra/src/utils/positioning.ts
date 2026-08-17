/**
 * Terra's own minimal anchored-positioning engine — no floating-ui or
 * popper dependency (see the project's bundle-size principle: every
 * Terra dependency has to be justified, default answer is no). The
 * actual surface area Tooltip/Popover/Menu need is small: 4 sides × 3
 * alignments, one flip-to-the-opposite-side pass, and a cross-axis
 * shift to stay clear of the viewport edge. That's it — no
 * `autoPlacement`, no multi-strategy fallback chain, no arrow
 * middleware. This file is pure geometry (no DOM reads, no React) so
 * it's trivially testable; `hooks/useAnchorPosition` is the stateful
 * wrapper that feeds it real rects.
 */

// ============================================================================
// TYPES
// ============================================================================

export type PlacementSide = 'top' | 'bottom' | 'left' | 'right';
export type PlacementAlign = 'start' | 'center' | 'end';

/** `side` or `side-align` (align omitted means `center`) — same shape
 * as Radix/Floating UI's placement strings, so it reads familiarly. */
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Same contract as `Element.getBoundingClientRect()` — lets a cursor
 * point (context menu) or any other non-element target act as an
 * anchor, as long as it can report a viewport rect. Real elements
 * satisfy this already. */
export interface VirtualAnchor {
  getBoundingClientRect(): Rect;
}

export type Anchor = HTMLElement | VirtualAnchor;

interface ComputeAnchoredPositionInput {
  anchorRect: Rect;
  panelWidth: number;
  panelHeight: number;
  placement: Placement;
  /** Gap between anchor and panel, in px. */
  offset: number;
  /** Minimum gap kept from the viewport edge when shifting. */
  padding: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface ComputeAnchoredPositionResult {
  top: number;
  left: number;
  /** Resolved side/align *after* flip — use to orient an arrow or pick
   * which edge an enter animation should originate from. */
  placement: Placement;
}

// ============================================================================
// INTERNAL
// ============================================================================

const OPPOSITE: Record<PlacementSide, PlacementSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function parsePlacement(placement: Placement): {
  side: PlacementSide;
  align: PlacementAlign;
} {
  const [side, align] = placement.split('-') as [PlacementSide, PlacementAlign?];
  return { side, align: align ?? 'center' };
}

function joinPlacement(side: PlacementSide, align: PlacementAlign): Placement {
  return (align === 'center' ? side : `${side}-${align}`) as Placement;
}

/** Coordinates for one specific side+align combination, ignoring collisions. */
function place(
  side: PlacementSide,
  align: PlacementAlign,
  anchorRect: Rect,
  panelWidth: number,
  panelHeight: number,
  offset: number
): { top: number; left: number } {
  let top = 0;
  let left = 0;

  if (side === 'top' || side === 'bottom') {
    top =
      side === 'top'
        ? anchorRect.top - panelHeight - offset
        : anchorRect.top + anchorRect.height + offset;
    if (align === 'start') left = anchorRect.left;
    else if (align === 'end') left = anchorRect.left + anchorRect.width - panelWidth;
    else left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
  } else {
    left =
      side === 'left'
        ? anchorRect.left - panelWidth - offset
        : anchorRect.left + anchorRect.width + offset;
    if (align === 'start') top = anchorRect.top;
    else if (align === 'end') top = anchorRect.top + anchorRect.height - panelHeight;
    else top = anchorRect.top + anchorRect.height / 2 - panelHeight / 2;
  }

  return { top, left };
}

function fitsOnSide(
  side: PlacementSide,
  anchorRect: Rect,
  panelWidth: number,
  panelHeight: number,
  offset: number,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  if (side === 'top') return anchorRect.top - panelHeight - offset >= 0;
  if (side === 'bottom')
    return anchorRect.top + anchorRect.height + offset + panelHeight <= viewportHeight;
  if (side === 'left') return anchorRect.left - panelWidth - offset >= 0;
  return anchorRect.left + anchorRect.width + offset + panelWidth <= viewportWidth;
}

// ============================================================================
// PUBLIC
// ============================================================================

/**
 * Resolves a floating panel's viewport position against an anchor
 * rect. `position: fixed` in viewport coordinates throughout — matches
 * `OverlayProvider`'s fixed, unscrolled portal root, so a panel's
 * `top`/`left` here can be applied directly with no scroll-offset math.
 *
 * Flip: if the preferred side doesn't fit and the opposite side does,
 * switches sides once. (Doesn't cascade through every remaining side —
 * with 4 sides that's rarely needed and adds real complexity for an
 * edge case.)
 *
 * Shift: after side resolution, slides along the cross-axis to stay
 * `padding` clear of the viewport edge without changing side — GTK
 * popovers stay pinned to their trigger's edge rather than jumping to
 * an entirely different placement.
 */
export function computeAnchoredPosition({
  anchorRect,
  panelWidth,
  panelHeight,
  placement,
  offset,
  padding,
  viewportWidth,
  viewportHeight,
}: ComputeAnchoredPositionInput): ComputeAnchoredPositionResult {
  const { side, align } = parsePlacement(placement);

  const preferredFits = fitsOnSide(
    side,
    anchorRect,
    panelWidth,
    panelHeight,
    offset,
    viewportWidth,
    viewportHeight
  );
  const opposite = OPPOSITE[side];
  const oppositeFits =
    !preferredFits &&
    fitsOnSide(
      opposite,
      anchorRect,
      panelWidth,
      panelHeight,
      offset,
      viewportWidth,
      viewportHeight
    );

  const resolvedSide = preferredFits ? side : oppositeFits ? opposite : side;

  let { top, left } = place(resolvedSide, align, anchorRect, panelWidth, panelHeight, offset);

  if (resolvedSide === 'top' || resolvedSide === 'bottom') {
    left = Math.min(Math.max(left, padding), viewportWidth - panelWidth - padding);
  } else {
    top = Math.min(Math.max(top, padding), viewportHeight - panelHeight - padding);
  }

  return { top, left, placement: joinPlacement(resolvedSide, align) };
}

/**
 * Builds a `VirtualAnchor` pinned to a single viewport point — the
 * bridge for cursor-positioned overlays (right-click context menus)
 * that have no real trigger element to measure.
 *
 * @example
 * ```tsx
 * function handleContextMenu(event: React.MouseEvent) {
 *   event.preventDefault();
 *   setAnchor(pointAnchor(event.clientX, event.clientY));
 *   setOpen(true);
 * }
 * ```
 */
export function pointAnchor(x: number, y: number): VirtualAnchor {
  return {
    getBoundingClientRect: () => ({ top: y, left: x, width: 0, height: 0 }),
  };
}
