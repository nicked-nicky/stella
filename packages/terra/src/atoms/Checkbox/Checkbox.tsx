import React, { forwardRef, useEffect, useRef } from 'react';
import { mergeRefs } from '../../utils/mergeRefs';
import { usePulse } from '../../utils/usePulse';
import styles from './Checkbox.module.css';

// ============================================================================
// TYPES
// ============================================================================

type CheckboxSize = 'sm' | 'md';

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /**
   * @default 'md'
   */
  size?: CheckboxSize;

  /**
   * Visually and semantically indeterminate (e.g. "some children checked").
   * Applied via ref since HTML has no `indeterminate` attribute.
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Optional label text rendered next to the box. For full control over
   * label markup, omit this and wrap Checkbox in your own <label>.
   */
  label?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Checkbox - built on a native `<input type="checkbox">`.
 *
 * Using the real element (rather than a `role="checkbox"` div) gives
 * keyboard support, label association, and form participation for free —
 * only the visual box is custom-styled via a sibling element.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms" />
 * <Checkbox size="sm" defaultChecked />
 * <Checkbox indeterminate label="Select all" />
 * <Checkbox disabled label="Unavailable" />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'md',
      indeterminate = false,
      label,
      className,
      id,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);

    // Merge forwarded ref with internal ref so we can set .indeterminate
    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const setRefs = mergeRefs(innerRef, forwardedRef);

    const autoId = React.useId();
    const inputId = id ?? autoId;

    // Commit pulse — see usePulse's docs. Only triggered from a real
    // onChange event below, never derived from `checked` itself, so a
    // Checkbox that simply *renders* pre-checked (a common demo/initial
    // state) never fires it on mount.
    const [pulsing, triggerPulse] = usePulse();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) triggerPulse();
      onChange?.(event);
    };

    const input = (
      <span className={[styles.wrapper, styles[`size-${size}`]].join(' ')}>
        <input
          ref={setRefs}
          type="checkbox"
          id={inputId}
          className={[styles.input, className].filter(Boolean).join(' ')}
          onChange={handleChange}
          {...props}
        />
        <span
          className={[styles.box, pulsing && styles.pulsing]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          {/* Expanding ring played on every check-on, see
              Checkbox.module.css's PULSE section. Sits behind the icons
              (first in DOM = painted first) so the mark stays crisp on top. */}
          <span className={styles.pulseRing} />
          <svg
            className={styles.checkIcon}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.5 8.5L6.5 11.5L12.5 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            className={styles.indeterminateIcon}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 8H12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </span>
    );

    if (!label) return input;

    return (
      <label className={styles.label} htmlFor={inputId}>
        {input}
        <span className={styles.labelText}>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export type { CheckboxProps, CheckboxSize };
