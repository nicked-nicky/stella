import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface OverlayContextValue {
  /** Shared portal root every overlay-type component mounts into. */
  root: HTMLElement | null;
  /** Registers a new overlay layer, returns its id. Call on open. */
  register: () => string;
  /** Removes a layer from the stack. Call on close/unmount. */
  unregister: (id: string) => void;
  /** True if `id` is the most-recently-opened layer still in the stack. */
  isTopmost: (id: string) => boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const OverlayContext = createContext<OverlayContextValue | undefined>(
  undefined
);

let layerCounter = 0;

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * OverlayProvider - coordination point for anything that renders "above"
 * normal page flow: Dialog, Popover, Dropdown, Tooltip.
 *
 * Solves two problems every overlay-type component would otherwise have
 * to solve on its own:
 *
 * 1. **Stacking.** All overlays mount into one shared portal root, so
 *    visual stacking order falls out of normal DOM paint order (later
 *    mount = later in the DOM = painted on top) — no manual z-index
 *    bookkeeping needed anywhere.
 * 2. **Escape-key scoping.** With two overlays open, Escape should
 *    close only the topmost one, not both. `isTopmost` lets each layer
 *    check whether it's the one that should currently respond.
 *
 * Wrap your app once, near the root:
 *
 * @example
 * ```tsx
 * <OverlayProvider>
 *   <App />
 * </OverlayProvider>
 * ```
 *
 * Individual overlay components consume this via `useOverlayLayer` —
 * see that hook for the actual per-component wiring.
 */
export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [stack, setStack] = useState<string[]>([]);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-stella-overlay-root', '');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
    setRoot(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const register = useCallback(() => {
    const id = `stella-overlay-${++layerCounter}`;
    setStack((prev) => [...prev, id]);
    return id;
  }, []);

  const unregister = useCallback((id: string) => {
    setStack((prev) => prev.filter((layerId) => layerId !== id));
  }, []);

  const isTopmost = useCallback(
    (id: string) => stack.length > 0 && stack[stack.length - 1] === id,
    [stack]
  );

  return (
    <OverlayContext.Provider value={{ root, register, unregister, isTopmost }}>
      {children}
    </OverlayContext.Provider>
  );
}

/** Internal — consumed by `useOverlayLayer`, not typically used directly. */
export function useOverlayContext() {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error(
      'useOverlayContext (and anything built on it, like useOverlayLayer) must be used within an <OverlayProvider>.'
    );
  }
  return ctx;
}
