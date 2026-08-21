import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { usePulse } from '../../utils/usePulse';
import styles from './Slider.module.css';

// ============================================================================
// TYPES
// ============================================================================

type SliderSize = 'sm' | 'md' | 'lg';

interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'size'
  | 'min'
  | 'max'
  | 'step'
  | 'value'
  | 'defaultValue'
  | 'onChange'
> {
  /**
   * @default 'md'
   */
  size?: SliderSize;

  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** @default 1 */
  step?: number;

  /** Controlled value. Pair with `onValueChange`. */
  value?: number;

  /** Initial value for uncontrolled use. */
  defaultValue?: number;

  /**
   * Fires once per *gesture* — a click, a keyboard step, typed entry
   * committing, or a drag ending — not on every tick of an in-progress
   * drag. The track, ghost thumb, and value readout all update live and
   * lag-free regardless; this is specifically the "the value settled,
   * go do something with it" signal, so it's cheap to wire up to
   * anything with real cost (persisting to disk, an expensive
   * recompute) without that cost firing dozens of times a second while
   * the user is still dragging.
   */
  onValueChange?: (value: number) => void;

  /**
   * Optional label rendered above the track. For full control over label
   * markup, omit this and wrap Slider in your own <label> (same escape
   * hatch Checkbox offers).
   */
  label?: React.ReactNode;

  /**
   * Show the current value beside the track. Clicking it (or pressing
   * Enter/Space on it) swaps in a real number field for typing an exact
   * value — Tab or Enter commits it, Escape cancels back to the track's
   * current value.
   * @default true
   */
  showValue?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Slider - built on a native `<input type="range">`.
 *
 * Using the real element (rather than a custom `role="slider"` div, the
 * way Switch has to for its button-based toggle) gives keyboard support
 * (arrow keys, Home/End, Page Up/Down), pointer dragging, and form
 * participation for free. The one thing native range inputs can't do is
 * animate the thumb's own position — browsers compute it internally,
 * not via a CSS `left`/`margin` this component could transition — so
 * the visible circle is actually a decorative "ghost" thumb layered on
 * top (see Slider.module.css's docblock), driven by the same value the
 * real, invisible-but-interactive thumb has.
 *
 * That split is also what makes the motion behaviour possible: a plain
 * click on the track springs the ghost thumb to the new position
 * (the transition is on by default), while an actual drag disables it
 * the instant the pointer *moves* — so the very first jump on
 * mousedown still animates, but the drag that follows tracks the
 * pointer with zero lag instead of visibly trailing behind it.
 *
 * TWO VALUES, ON PURPOSE — `liveValue` (local, always present) is what
 * actually renders: the track's own `value`, the ghost thumb's
 * position, and the readout number, all updated on every single drag
 * tick so the motion never lags. The *external* value — `value`/
 * `onValueChange` for a controlled Slider, or the internal state a
 * consumer never sees for an uncontrolled one — only updates once per
 * gesture (see `onValueChange`'s docs). Without this split, a
 * controlled Slider wired to `onValueChange` would re-render whatever
 * owns that state dozens of times a second while being dragged, which
 * is the actual cost, not anything Slider itself does — this way the
 * expensive side only pays once per gesture, while the cheap, local
 * visual side stays perfectly smooth regardless of how expensive the
 * consumer's own state update is.
 *
 * Supports both controlled (`value` + `onValueChange`) and uncontrolled
 * (`defaultValue`) usage, same convention as Switch.
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <Slider label="Volume" defaultValue={50} />
 *
 * // Controlled — onValueChange fires once, on release, not per tick
 * <Slider label="Brightness" value={brightness} onValueChange={setBrightness} />
 *
 * // No editable readout — just the track
 * <Slider min={0} max={1} step={0.01} showValue={false} />
 * ```
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      size = 'md',
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      onValueChange,
      label,
      showValue = true,
      disabled,
      className,
      id,
      ...props
    },
    forwardedRef
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue ?? min);
    const committedValue = isControlled ? value : internalValue;

    // The always-live value everything actually renders from — see the
    // "TWO VALUES, ON PURPOSE" section above. Mirrored into a ref too,
    // read at commit time (pointerup) so that read is never a tick
    // behind a batched-but-not-yet-rendered state update.
    const [liveValue, setLiveValueState] = useState(committedValue);
    const liveValueRef = useRef(liveValue);

    const clamp = (raw: number) => Math.min(max, Math.max(min, raw));

    const setLive = (raw: number) => {
      const clamped = clamp(raw);
      liveValueRef.current = clamped;
      setLiveValueState(clamped);
      return clamped;
    };

    // A brief "something just settled" pulse played on every external
    // commit (see Slider.module.css's COMMIT PULSE section, and
    // ../../utils/usePulse.ts for the shared trigger every toggle-style
    // atom in the kit uses).
    const [pulsing, triggerPulse] = usePulse();

    const commitExternal = (next: number) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
      triggerPulse();
    };

    // Drag-vs-click/keyboard split — the same signal drives two things:
    // the CSS motion (Slider.module.css's `.dragging`) and, in
    // handleTrackChange/handlePointerUp below, whether a value change
    // commits immediately or waits for release. isDraggingRef is read
    // synchronously inside handlers (no waiting on a render);
    // isDragging (state) exists purely so the class further down can
    // react to it.
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);

    // Keeps liveValue aligned with the true value whenever it changes
    // for a reason other than our own in-progress drag — the initial
    // mount, an external reset of a controlled `value`, or our own
    // commit echoing back through that same prop (a no-op by the time
    // it arrives, since liveValue already matches). Skipped mid-drag so
    // it can never fight the pointer.
    useEffect(() => {
      if (!isDraggingRef.current) setLive(committedValue);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [committedValue]);

    // Typed-entry mode for the value readout — its own local state
    // regardless of controlled/uncontrolled, since "am I currently
    // editing" isn't part of the slider's value, just this component's
    // transient UI state.
    const [isEditing, setIsEditing] = useState(false);
    const [draftValue, setDraftValue] = useState(String(liveValue));

    const autoId = React.useId();
    const inputId = id ?? autoId;

    // The one CSS custom property the fill/ghost-thumb both read,
    // derived once per liveValue/min/max change rather than recomputed
    // on every render (e.g. a parent re-render that only changes
    // `disabled`). `.trackFill`'s width and `.thumbGhost`'s left both
    // consume this exact same value — see Slider.module.css's docblock
    // for why that single source of truth is what keeps them in sync.
    const trackStyle = useMemo(() => {
      const fraction = (liveValue - min) / (max - min || 1);
      return {
        '--slider-fraction': fraction,
      } as React.CSSProperties;
    }, [liveValue, min, max]);

    const handleTrackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const clamped = setLive(Number(event.target.value));
      // Not an active drag — a plain click (fires before any
      // pointermove) or a keyboard step — commits right away. A drag
      // in progress defers to handlePointerUp instead.
      if (!isDraggingRef.current) commitExternal(clamped);
    };

    // Fires on every pointerdown, including the plain "click a point on
    // the track" case — capture the pointer so move/up keep firing on
    // this element even if the cursor drifts off it mid-drag.
    const handlePointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
      isDraggingRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    // Only fires while the pointer is down (capture above guarantees
    // that). The *first* value change on pointerdown happens before any
    // movement, so it still commits/animates immediately — this only
    // starts deferring once real dragging begins.
    const handlePointerMove = () => {
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
    };

    const handlePointerUp = () => {
      // A drag was in progress — commit the final value now, exactly
      // once, instead of the (possibly hundreds of) intermediate ticks
      // handleTrackChange deferred while isDraggingRef was true.
      if (isDraggingRef.current) commitExternal(liveValueRef.current);
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    const startEditing = () => {
      if (disabled) return;
      setDraftValue(String(liveValue));
      setIsEditing(true);
    };

    const commitDraft = () => {
      const parsed = Number(draftValue);
      if (!Number.isNaN(parsed)) commitExternal(setLive(parsed));
      setIsEditing(false);
    };

    const cancelDraft = () => {
      setIsEditing(false);
    };

    const trackBox = (
      <span
        className={[styles.trackBox, isDragging && styles.dragging]
          .filter(Boolean)
          .join(' ')}
        style={trackStyle}
      >
        <input
          ref={forwardedRef}
          type="range"
          id={inputId}
          min={min}
          max={max}
          step={step}
          value={liveValue}
          disabled={disabled}
          onChange={handleTrackChange}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={[styles.track, className].filter(Boolean).join(' ')}
          {...props}
        />
        {/* Real overlays — see Slider.module.css's docblock for why the
            native track/thumb can't be styled to move directly. Order
            matters: each one paints on top of the last. */}
        <span className={styles.trackRail} aria-hidden="true" />
        <span className={styles.trackFill} aria-hidden="true" />
        <span className={styles.thumbGhost} aria-hidden="true" />
        <span className={styles.thumbPulse} aria-hidden="true" />
      </span>
    );

    const valueControl =
      showValue &&
      (isEditing ? (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={draftValue}
          disabled={disabled}
          autoFocus
          className={styles.valueInput}
          onChange={(e) => setDraftValue(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitDraft();
            if (e.key === 'Escape') cancelDraft();
          }}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          className={styles.valueButton}
          aria-label={`Edit ${typeof label === 'string' ? label : 'value'}, currently ${liveValue}`}
          onClick={startEditing}
        >
          {liveValue}
        </button>
      ));

    const control = (
      <span
        className={[
          styles.wrapper,
          styles[`size-${size}`],
          pulsing && styles.pulsing, // FUN PASS
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {trackBox}
        {valueControl}
      </span>
    );

    if (!label) return control;

    return (
      <span className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {control}
      </span>
    );
  }
);

Slider.displayName = 'Slider';

export type { SliderProps, SliderSize };
