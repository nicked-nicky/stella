import React, { forwardRef } from 'react';
import { Spinner } from '../Spinner';
import styles from './Button.module.css';

// ============================================================================
// TYPES
// ============================================================================

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button height and padding scale.
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Persistent "selected/on" state — swaps the fill to the inverted
   * selected tokens and keeps it through hover/active. For nav-style
   * buttons showing the current view; pair with `aria-current` yourself
   * when that's what `active` represents.
   * @default false
   */
  active?: boolean;

  /**
   * Loading state. Shows spinner, disables interaction.
   * @default false
   */
  loading?: boolean;

  /**
   * Icon rendered before text.
   */
  leadingIcon?: React.ReactNode;

  /**
   * Icon rendered after text.
   */
  trailingIcon?: React.ReactNode;

  /**
   * If true, only renders icon(s), no text.
   * Useful for icon-only buttons.
   */
  iconOnly?: boolean;

  /**
   * Child content (text, React nodes).
   */
  children?: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Button - the primary interactive element.
 *
 * Carries neither a fill nor a radius of its own. Both come from the
 * `ButtonIsland` it lives inside: the Island's `header` tone is the
 * surface you see behind the button, and the Island's radius plus its
 * `overflow: hidden` clip is what rounds the group's ends. This mirrors
 * Ray's `.menu-button` / `.menu-button-group` pair, and it's why a bare
 * Button outside an Island looks unstyled — that's a signal to wrap it,
 * not a bug.
 *
 * Interaction is a three-rung state-layer ladder over that inherited
 * surface — hover, press, then `active` for a persistent "on" state —
 * with the label starting quiet (`--stella-text-secondary`) and
 * brightening to full strength on hover, so a dense toolbar reads
 * calmly at rest.
 *
 * There is no `variant` prop: Stella has a single neutral color scheme,
 * so there was only ever one value. Mark the current pick in a group
 * with `active`. Status meaning (success/info/warning/error/debug)
 * lives on Badge and Notification, not here.
 *
 * Always shows a focus ring on `:focus-visible`, drawn *inset* (see
 * Button.module.css) so the wrapping Island's clip can't swallow it.
 *
 * @example
 * ```tsx
 * // Always wrap in a ButtonIsland — Button has no surface of its own
 * <ButtonIsland><Button>Save</Button></ButtonIsland>
 *
 * // Active (selected) button in a nav cluster
 * <ButtonIsland>
 *   <Button active aria-current="page">Editor</Button>
 *   <Button>Settings</Button>
 * </ButtonIsland>
 *
 * // Icon-only button
 * <ButtonIsland><Button size="sm" iconOnly><IconClose /></Button></ButtonIsland>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = 'md',
      active = false,
      loading = false,
      leadingIcon,
      trailingIcon,
      iconOnly = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Build class names
    const classes = [
      styles.button,
      styles[`size-${size}`],
      active && styles.active,
      isDisabled && styles.disabled,
      loading && styles.loading,
      iconOnly && styles.iconOnly,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {/* Loading spinner overlay */}
        {loading && (
          <span className={styles.spinnerContainer} aria-hidden="true">
            <Spinner size="md" />
          </span>
        )}

        {iconOnly ? (
          /* Icon-only content — accepts either `children` (the common
             case: <Button iconOnly><Icon>...</Icon></Button>) or
             `leadingIcon`, so both authoring styles work. */
          (children || leadingIcon) && (
            <span className={styles.icon} aria-hidden="true">
              {children ?? leadingIcon}
            </span>
          )
        ) : (
          <>
            {/* Leading icon */}
            {leadingIcon && (
              <span className={styles.icon} aria-hidden="true">
                {leadingIcon}
              </span>
            )}

            {/* Text content */}
            {children && <span className={styles.text}>{children}</span>}

            {/* Trailing icon */}
            {trailingIcon && (
              <span className={styles.icon} aria-hidden="true">
                {trailingIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type { ButtonProps, ButtonSize };
