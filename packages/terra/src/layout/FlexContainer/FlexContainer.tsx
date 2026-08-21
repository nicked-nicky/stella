import React, { forwardRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/** Friendly names mapped to real `justify-content` values below —
 * matches the vocabulary most devs already reach for (Tailwind, etc.)
 * rather than typing `space-between` by hand every time. */
type FlexJustify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';

type FlexAlign = 'start' | 'end' | 'center' | 'stretch' | 'baseline';

/**
 * Restricted to the spacing scale in styles/tokens.css — no raw
 * CSS string escape hatch, so gaps stay on-token by construction rather
 * than inviting ad hoc pixel values (per project convention: reference
 * the design tokens, don't invent new scales ad hoc).
 */
type FlexGap =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16';

type FlexElement =
  'div' | 'span' | 'section' | 'nav' | 'ul' | 'li' | 'header' | 'footer';

interface FlexContainerProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * @default 'row'
   */
  direction?: FlexDirection;

  /**
   * Gap between children, as a spacing token (not a raw CSS value).
   */
  gap?: FlexGap;

  /**
   * @default 'nowrap'
   */
  wrap?: FlexWrap;

  /**
   * Maps to `justify-content`. `between`/`around`/`evenly` expand to
   * their `space-*` CSS equivalents.
   */
  justify?: FlexJustify;

  /**
   * Maps to `align-items`.
   */
  align?: FlexAlign;

  /**
   * Rendered element.
   * @default 'div'
   */
  as?: FlexElement;

  children?: React.ReactNode;
}

// ============================================================================
// VALUE MAPS
// ============================================================================

const JUSTIFY_MAP: Record<FlexJustify, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const ALIGN_MAP: Record<FlexAlign, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  stretch: 'stretch',
  baseline: 'baseline',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FlexContainer - configurable flexbox wrapper. The layout primitive
 * everything else in Terra composes with — bundles repeating children
 * (buttons, form rows, list items) without hand-writing flex CSS at
 * every call site.
 *
 * Deliberately covers only flexbox's one-dimensional model. For
 * genuinely two-dimensional layouts (dashboard card grids, label/value
 * columns that must align across many rows), reach for CSS Grid
 * instead — flex fights you once alignment needs to happen across two
 * axes at once, and there's no ambition here to grow this into a Grid
 * wrapper too.
 *
 * @example
 * ```tsx
 * <FlexContainer gap="3" align="center">
 *   <Avatar initials="JD" />
 *   <Text>Jane Doe</Text>
 * </FlexContainer>
 *
 * <FlexContainer direction="column" gap="2" wrap="wrap" justify="between">
 *   {items.map((item) => <Card key={item.id} {...item} />)}
 * </FlexContainer>
 * ```
 */
export const FlexContainer = forwardRef<HTMLElement, FlexContainerProps>(
  (
    {
      direction = 'row',
      gap,
      wrap = 'nowrap',
      justify,
      align,
      as = 'div',
      style,
      children,
      ...props
    },
    ref
  ) => {
    const Element = as as React.ElementType;

    return (
      <Element
        ref={ref}
        style={{
          display: 'flex',
          flexDirection: direction,
          flexWrap: wrap,
          gap: gap !== undefined ? `var(--stella-space-${gap})` : undefined,
          justifyContent: justify ? JUSTIFY_MAP[justify] : undefined,
          alignItems: align ? ALIGN_MAP[align] : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

FlexContainer.displayName = 'FlexContainer';

export type {
  FlexContainerProps,
  FlexDirection,
  FlexWrap,
  FlexJustify,
  FlexAlign,
  FlexGap,
  FlexElement,
};
