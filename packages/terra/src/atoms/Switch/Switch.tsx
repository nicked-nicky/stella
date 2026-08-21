import React, { forwardRef, useState } from 'react';
import styles from './Switch.module.css';

// ============================================================================
// TYPES
// ============================================================================

type SwitchSize = 'sm' | 'md';

interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'value'
> {
  /**
   * @default 'md'
   */
  size?: SwitchSize;

  /** Controlled checked state. Pair with `onCheckedChange`. */
  checked?: boolean;

  /** Initial checked state for uncontrolled use. */
  defaultChecked?: boolean;

  /** Fires with the new checked value on toggle. */
  onCheckedChange?: (checked: boolean) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Switch - GTK-style toggle. No native HTML element matches "switch"
 * semantics exactly, so this is a real `<button>` with `role="switch"`
 * and `aria-checked` — buttons already give keyboard activation
 * (Space/Enter) and focus handling for free; only the checked state
 * and visuals are custom.
 *
 * Supports both controlled (`checked` + `onCheckedChange`) and
 * uncontrolled (`defaultChecked`) usage, same convention as Radix.
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <Switch defaultChecked label="Notifications" />
 *
 * // Controlled
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * ```
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      size = 'md',
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const isChecked = isControlled ? checked : internalChecked;

    const handleClick = () => {
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) setInternalChecked(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleClick}
        className={[
          styles.switch,
          styles[`size-${size}`],
          isChecked && styles.checked,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        <span className={styles.thumb} />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

export type { SwitchProps, SwitchSize };
