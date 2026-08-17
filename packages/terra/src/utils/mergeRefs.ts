import type { MutableRefObject, Ref } from 'react';

/**
 * Merges a forwarded ref with an internal ref into a single callback ref.
 *
 * Needed whenever a component forwards a ref AND also needs its own
 * internal ref for imperative access (e.g. Checkbox setting
 * `.indeterminate`, which has no HTML attribute equivalent).
 *
 * Current `@types/react` types `ForwardedRef<T>` as possibly a
 * `RefObject<T>` with a **readonly** `.current` — direct assignment
 * (`forwardedRef.current = node`) fails to typecheck (TS2540). This
 * casts once, in one place, instead of at every call site.
 *
 * @example
 * ```tsx
 * const innerRef = useRef<HTMLInputElement>(null);
 * const setRefs = mergeRefs(innerRef, forwardedRef);
 * <input ref={setRefs} />
 * ```
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined | null>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<T | null>).current = node;
      }
    }
  };
}
