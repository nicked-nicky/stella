import React, { forwardRef } from 'react';
import styles from './Input.module.css';

// ============================================================================
// TYPES
// ============================================================================

type InputVariant = 'default' | 'filled';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  /**
   * @default 'default'
   */
  variant?: InputVariant;

  /**
   * @default 'md'
   */
  size?: InputSize;

  /**
   * Visual + semantic invalid state (sets `aria-invalid`). Rendering the
   * actual error message is a molecule-level concern (see `InputField`)
   * — this atom only handles the visual/ARIA signal.
   * @default false
   */
  error?: boolean;

  /** Icon rendered inside the field, before the text. */
  leadingIcon?: React.ReactNode;

  /** Icon rendered inside the field, after the text. */
  trailingIcon?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Input - bare text field atom. Label association, helper text, and
 * error messages are composed at the molecule level (`InputField`
 * wraps this with a `<label>` + error text) — this atom stays a plain
 * styled `<input>` so it's reusable in contexts that need their own
 * label markup.
 *
 * @example
 * ```tsx
 * <Input placeholder="Email" />
 * <Input variant="filled" size="lg" />
 * <Input leadingIcon={<SearchIcon />} placeholder="Search" />
 * <Input error aria-describedby="email-error" />
 * <Input disabled value="Read only" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      leadingIcon,
      trailingIcon,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <span
        className={[
          styles.wrapper,
          styles[variant],
          styles[`size-${size}`],
          error && styles.error,
          disabled && styles.disabled,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {leadingIcon && (
          <span className={styles.icon} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={[styles.input, className].filter(Boolean).join(' ')}
          {...props}
        />
        {trailingIcon && (
          <span className={styles.icon} aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </span>
    );
  }
);

Input.displayName = 'Input';

export type { InputProps, InputVariant, InputSize };
