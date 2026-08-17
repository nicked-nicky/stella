import React, { forwardRef } from 'react';
import styles from './Text.module.css';

// ============================================================================
// TYPES
// ============================================================================

/** Matches the type scale in styles/tokens.css. */
type TextVariant =
  | 'display'
  | 'title-1'
  | 'title-2'
  | 'title-3'
  | 'body'
  | 'body-strong'
  | 'caption'
  | 'caption-strong'
  | 'mono';

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'disabled';

/** Elements this atom is meant to render as — deliberately not fully
 * generic/polymorphic to keep the prop types simple; extend this list
 * if a real need comes up rather than opening it to `React.ElementType`. */
type TextElement =
  | 'span'
  | 'p'
  | 'div'
  | 'label'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'kbd';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Which entry in the type scale to render.
   * @default 'body'
   */
  variant?: TextVariant;

  /**
   * Override the rendered element. Defaults to a sensible tag per
   * variant (title-1 → h1, title-2 → h2, title-3 → h3, everything
   * else → span) — override when the visual scale and the document
   * heading structure don't line up.
   */
  as?: TextElement;

  /**
   * @default 'primary'
   */
  color?: TextColor;

  /** Truncates to a single line with an ellipsis when it overflows. */
  truncate?: boolean;

  children?: React.ReactNode;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_ELEMENT: Record<TextVariant, TextElement> = {
  display: 'h1',
  'title-1': 'h1',
  'title-2': 'h2',
  'title-3': 'h3',
  body: 'span',
  'body-strong': 'span',
  caption: 'span',
  'caption-strong': 'span',
  mono: 'span',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Text - typography primitive mapping directly to Terra's type scale.
 * The visual variant and the semantic element are independent: pick
 * the variant for how it should look, override `as` when the document
 * outline needs a different tag than the default.
 *
 * @example
 * ```tsx
 * <Text variant="title-1">Page Title</Text>
 * <Text variant="body" color="secondary">Supporting copy</Text>
 * <Text variant="title-2" as="h1">Visually smaller, still the h1</Text>
 * <Text variant="mono">const x = 1;</Text>
 * <Text truncate style={{ maxWidth: 200 }}>A long string that clips…</Text>
 * ```
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      variant = 'body',
      as,
      color = 'primary',
      truncate = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Element = (as ?? DEFAULT_ELEMENT[variant]) as React.ElementType;

    return (
      <Element
        ref={ref}
        className={[
          styles.text,
          styles[variant],
          styles[`color-${color}`],
          truncate && styles.truncate,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

Text.displayName = 'Text';

export type { TextProps, TextVariant, TextColor, TextElement };
