/**
 * Resolves an exit-animation delay against the user's reduced-motion
 * preference. Components that must stay mounted for a CSS exit
 * animation to play before actually unmounting (Dialog, Notification)
 * use this instead of hardcoding a raw `setTimeout` duration — mirrors
 * tokens.css's own `prefers-reduced-motion` collapse (durations go to
 * ~0), so JS-driven unmount timing and the CSS animation duration it's
 * waiting on always agree.
 *
 * @example
 * ```ts
 * const EXIT_DURATION_MS = 150; // matches --stella-motion-fast
 * setTimeout(() => setMounted(false), getExitDelay(EXIT_DURATION_MS));
 * ```
 */
export function getExitDelay(defaultMs: number): number {
  if (typeof window === 'undefined' || !window.matchMedia) return defaultMs;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : defaultMs;
}
