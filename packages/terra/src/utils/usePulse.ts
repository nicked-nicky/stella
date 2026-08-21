import { useEffect, useRef, useState } from 'react';

/**
 * Drives a brief "just committed" CSS pulse — the expanding, fading
 * ring Checkbox/Radio/Switch/Slider all play on a real commit (checking
 * a box, flipping a switch, a slider value settling). Shared here
 * because the same three moving parts were being copy-pasted into each
 * component: a `pulsing` boolean to toggle a class, a timeout to turn
 * it back off, and the requestAnimationFrame restart trick.
 *
 * That last part matters: toggling a CSS class to a value it already
 * has doesn't restart a running `animation` (checking a box twice fast
 * would just let the first pulse finish uninterrupted, or cut it off
 * with no replay). Flipping `pulsing` false then true again on the next
 * frame forces the browser to treat it as a fresh animation each time.
 *
 * IMPORTANT — only call `trigger()` from a real user-driven event
 * handler (onChange/onClick), never as a side effect of a value that
 * happens to already be "on" at mount. An element that renders
 * pre-checked has not "just committed" anything; pulsing it on first
 * paint reads as a stray animation firing for no reason.
 *
 * @example
 * ```tsx
 * const [pulsing, triggerPulse] = usePulse();
 *
 * const handleChange = (e) => {
 *   if (e.target.checked) triggerPulse();
 *   onChange?.(e);
 * };
 *
 * <span className={pulsing ? styles.pulsing : undefined}>...</span>
 * ```
 */
export function usePulse(durationMs = 500): [boolean, () => void] {
  const [pulsing, setPulsing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't leave a pending setState dangling if the component unmounts
  // mid-pulse.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const trigger = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPulsing(false);
    requestAnimationFrame(() => setPulsing(true));
    timeoutRef.current = setTimeout(() => setPulsing(false), durationMs);
  };

  return [pulsing, trigger];
}
