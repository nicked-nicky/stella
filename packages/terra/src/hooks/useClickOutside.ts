import React, { useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/** Anything that can report the element to treat as "inside" — a ref
 * (the common case) or a raw element (e.g. an `anchor` prop that's
 * sometimes a real `HTMLElement`, sometimes a virtual point with
 * nothing to exclude). `null`/`undefined` entries are ignored, so
 * callers don't need to filter conditionally-present refs themselves. */
type OutsideTarget =
  React.RefObject<HTMLElement | null> | HTMLElement | null | undefined;

// ============================================================================
// HOOK
// ============================================================================

/**
 * useClickOutside - dismiss-on-outside-click for chromeless overlays.
 *
 * `Dialog` gets this for free from its full-screen backdrop (a
 * `mousedown` on the dim layer itself); `Popover` and `Menu` have no
 * backdrop, so they need this instead: a single document-level
 * `pointerdown` listener (capture phase, so it sees the event before
 * anything inside can stop propagation) that fires `onOutside` unless
 * the event target is inside one of `targets`.
 *
 * Reads `targets`/`onOutside` fresh on every event via refs updated on
 * each render, rather than re-subscribing the listener whenever a
 * caller passes a new array/closure — the common case (an inline array
 * literal of refs) would otherwise tear down and rebuild the listener
 * on every render for no reason.
 *
 * @example
 * ```tsx
 * const panelRef = useRef<HTMLDivElement>(null);
 * useClickOutside([panelRef, anchorElement], onClose, open);
 * ```
 */
export function useClickOutside(
  targets: OutsideTarget[],
  onOutside: () => void,
  enabled = true
): void {
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;

  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      const node = event.target as Node | null;
      if (!node) return;
      const isInside = targetsRef.current.some((target) => {
        const el = target && 'current' in target ? target.current : target;
        return el?.contains(node) ?? false;
      });
      if (!isInside) onOutsideRef.current();
    }

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [enabled]);
}
