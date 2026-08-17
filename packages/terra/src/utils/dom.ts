/**
 * Matches any element a11y-focusable via Tab: links with an `href`,
 * form controls, and anything with an explicit non-negative `tabindex`.
 * Shared by `Dialog` (its own hand-rolled Tab-trap) and
 * `useDismissableOverlay` (the initial-focus-on-open step for
 * `Popover`/`Menu`) — previously copy-pasted verbatim in both places.
 */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
