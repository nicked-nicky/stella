import { useEffect, useRef } from 'react';
import { useOverlayContext } from './OverlayProvider';

// ============================================================================
// TYPES
// ============================================================================

interface UseOverlayLayerOptions {
  /** Whether this overlay is currently open. */
  open: boolean;
  /** Called when Escape is pressed while this layer is topmost. */
  onClose?: () => void;
  /**
   * @default true
   */
  closeOnEscape?: boolean;
}

interface UseOverlayLayerResult {
  /** Portal target — render your overlay content into this via `createPortal`. */
  root: HTMLElement | null;
  /** Whether this layer is the most-recently-opened one still open. */
  topmost: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useOverlayLayer - the per-component half of OverlayProvider.
 *
 * Registers this component as an overlay layer while `open` is true,
 * unregisters on close/unmount, and wires up Escape-key handling that's
 * automatically scoped to only the topmost layer — so a Popover opened
 * from inside a Dialog doesn't also close the Dialog underneath it.
 *
 * @example
 * ```tsx
 * function Popover({ open, onClose, children }: PopoverProps) {
 *   const { root, topmost } = useOverlayLayer({ open, onClose });
 *   if (!open || !root) return null;
 *   return createPortal(
 *     <div className={styles.popover}>{children}</div>,
 *     root
 *   );
 * }
 * ```
 */
export function useOverlayLayer({
  open,
  onClose,
  closeOnEscape = true,
}: UseOverlayLayerOptions): UseOverlayLayerResult {
  const { root, register, unregister, isTopmost } = useOverlayContext();
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = register();
    idRef.current = id;
    return () => {
      unregister(id);
      idRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const topmost = idRef.current !== null && isTopmost(idRef.current);

  useEffect(() => {
    if (!open || !closeOnEscape || !topmost) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEscape, topmost, onClose]);

  return { root, topmost };
}
