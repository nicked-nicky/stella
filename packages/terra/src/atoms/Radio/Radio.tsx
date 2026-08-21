import React, { forwardRef } from 'react';
import styles from './Radio.module.css';

// ============================================================================
// TYPES
// ============================================================================

type RadioSize = 'sm' | 'md';

interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /**
   * @default 'md'
   */
  size?: RadioSize;

  /**
   * Optional label text rendered next to the dot. For full control over
   * label markup, omit this and wrap Radio in your own <label>.
   */
  label?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Radio - built on a native `<input type="radio">`.
 *
 * Radios sharing the same `name` get roving arrow-key navigation and
 * mutual-exclusion for free from the browser — no roving-tabindex JS
 * needed. Group them with a shared `name` and wrap in a `<fieldset>` +
 * `<legend>` for the accessible group label (molecule-level concern,
 * not this atom's).
 *
 * @example
 * ```tsx
 * <fieldset>
 *   <legend>Plan</legend>
 *   <Radio name="plan" value="free" label="Free" defaultChecked />
 *   <Radio name="plan" value="pro" label="Pro" />
 * </fieldset>
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ size = 'md', label, className, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;

    const input = (
      <span className={[styles.wrapper, styles[`size-${size}`]].join(' ')}>
        <input
          ref={ref}
          type="radio"
          id={inputId}
          className={[styles.input, className].filter(Boolean).join(' ')}
          {...props}
        />
        <span className={styles.dot} aria-hidden="true" />
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

Radio.displayName = 'Radio';

export type { RadioProps, RadioSize };
