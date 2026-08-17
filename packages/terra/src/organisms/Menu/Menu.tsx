import React, { createContext, useContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDismissableOverlay } from '../../hooks';
import type { Anchor, Placement } from '../../hooks';
import { Island } from '../../atoms/Island';
import { Divider } from '../../atoms/Divider';
import styles from './Menu.module.css';

const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const TYPEAHEAD_RESET_MS = 500;

// ============================================================================
// TYPES
// ============================================================================

export interface MenuProps {
  /** Whether the menu is open. */
  open: boolean;
  /** Called on Escape/Tab (topmost layer only), an outside click, or
   * an item select (unless that item opts out via `closeOnSelect`). */
  onClose?: () => void;
  /** Trigger element for a dropdown menu, or a virtual point from
   * `pointAnchor(event.clientX, event.clientY)` for a right-click
   * context menu. */
  anchor: Anchor | null;
  /** @default 'bottom-start' */
  placement?: Placement;
  /** Gap between anchor and panel, in px — tighter than Popover's
   * default by design, so a dropdown reads as attached to its trigger.
   * @default 4 */
  offset?: number;
  className?: string;
  children?: React.ReactNode;
}

interface MenuContextValue {
  onClose: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('Menu subcomponents must be used inside <Menu>.');
  }
  return ctx;
}

// ============================================================================
// ROOT
// ============================================================================

/**
 * Menu - anchored list of actions (dropdown menu or right-click
 * context menu, same component either way — the only difference is
 * what `anchor` points to). A compound component:
 *
 * ```
 * <Menu open={open} onClose={close} anchor={anchor}>
 *   <Menu.Item leadingIcon={<Copy />} onSelect={handleCopy}>Copy</Menu.Item>
 *   <Menu.Item disabled>Paste</Menu.Item>
 *   <Menu.Separator />
 *   <Menu.Item destructive onSelect={handleDelete}>Delete</Menu.Item>
 * </Menu>
 * ```
 *
 * Visually the same trick as `ButtonIsland`: the panel (`Island`,
 * `clip` on by default) is the only thing that owns rounding, items
 * carry zero radius of their own and sit flush with no padding/gap
 * around them — the panel's own corner clip is what makes the *group*
 * read as rounded, same as `ButtonIsland`'s `Button`s. An automatic
 * hairline separates adjacent items (`.item + .item`, same reserved-
 * transparent-border trick as `ButtonIsland`'s `button + button`), one
 * shade quieter (`--stella-border-subtle`) since it's a row boundary,
 * not a break. `Menu.Separator` *is* the `Divider` atom, reserved for
 * an actual group break — the same move `ButtonIsland.Separator` makes
 * with `Separator`.
 *
 * Same `useDismissableOverlay` as `Popover` for portal/stacking/Escape/
 * anchor-position/outside-click/focus-management. Adds WAI-ARIA menu
 * keyboard behavior on top: ↑/↓ moves focus between
 * items (wrapping), Home/End jump to the first/last, typing jumps to
 * the next item whose label starts with what's typed, and Tab closes
 * the menu (a roving-focus list, not a Tab-through list — matches
 * every native menu). Reads the item list straight from the DOM at
 * keydown time (`panel.querySelectorAll('[role="menuitem"]')`) rather
 * than maintaining a parallel registration context — items are always
 * real `<button>` elements in DOM order, so this is both simpler and
 * exactly correct.
 *
 * `Menu.Item`'s `active` prop (same "persistent selected state"
 * meaning as `Button`'s) is what a future `Select`/`Dropdown` would
 * build on: mark the current value's item `active`, everything else
 * about Menu already works for that case unchanged.
 *
 * @example
 * ```tsx
 * // Dropdown, anchored to a trigger button
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * <Button ref={triggerRef} onClick={() => setOpen(true)}>Actions</Button>
 * <Menu open={open} onClose={() => setOpen(false)} anchor={triggerRef.current}>
 *   ...
 * </Menu>
 *
 * // Context menu, anchored to the cursor
 * <div onContextMenu={(e) => {
 *   e.preventDefault();
 *   setAnchor(pointAnchor(e.clientX, e.clientY));
 *   setOpen(true);
 * }}>
 * ```
 */
export function Menu({
  open,
  onClose,
  anchor,
  placement = 'bottom-start',
  offset = 4,
  className,
  children,
}: MenuProps) {
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | undefined }>({
    buffer: '',
    timer: undefined,
  });

  const { root, panelRef, style, requestClose } = useDismissableOverlay({
    open,
    onClose,
    anchor,
    placement,
    offset,
    initialFocusSelector: ITEM_SELECTOR,
  });

  // Item select restores focus to the trigger, same as Escape — see
  // `requestClose`'s docs on the restore/don't-restore distinction.
  const contextValue = useMemo<MenuContextValue>(
    () => ({ onClose: () => requestClose(true) }),
    [requestClose]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
        return;
      case 'ArrowUp':
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        return;
      case 'Home':
        event.preventDefault();
        items[0]?.focus();
        return;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus();
        return;
      case 'Tab':
        // Native menus close rather than let Tab wander through their
        // items — leaving focus wherever it already is, so it lands on
        // whatever comes next in the surrounding page's tab order.
        requestClose(false);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const state = typeahead.current;
          clearTimeout(state.timer);
          state.buffer += event.key.toLowerCase();
          const match = items.find((item) =>
            item.textContent?.trim().toLowerCase().startsWith(state.buffer)
          );
          match?.focus();
          state.timer = setTimeout(() => {
            state.buffer = '';
          }, TYPEAHEAD_RESET_MS);
        }
    }
  };

  if (!open || !root) return null;

  return createPortal(
    <div ref={panelRef} style={style}>
      <Island
        shape="panel"
        tone="overlay"
        role="menu"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={[styles.menu, className].filter(Boolean).join(' ')}
      >
        <MenuContext.Provider value={contextValue}>{children}</MenuContext.Provider>
      </Island>
    </div>,
    root
  );
}

Menu.displayName = 'Menu';

// ============================================================================
// ITEM
// ============================================================================

export interface MenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  /** Fired on click or Enter/Space (native `<button>` behavior). */
  onSelect?: () => void;
  /** Status-red text, for a destructive action — the same red used
   * everywhere else status color appears in Stella (see tokens.css),
   * not a one-off. */
  destructive?: boolean;
  /** Persistent "selected" mark — same meaning as `Button`'s `active`.
   * What a `Select`/`Dropdown` built on `Menu` would set on the item
   * matching the current value. */
  active?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** @default true */
  closeOnSelect?: boolean;
  children?: React.ReactNode;
}

function MenuItem({
  onSelect,
  destructive = false,
  active = false,
  leadingIcon,
  trailingIcon,
  closeOnSelect = true,
  disabled,
  className,
  children,
  onClick,
  ...props
}: MenuItemProps) {
  const { onClose } = useMenuContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (disabled) return;
    onSelect?.();
    if (closeOnSelect) onClose();
  };

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      data-destructive={destructive || undefined}
      data-active={active || undefined}
      className={[styles.item, className].filter(Boolean).join(' ')}
      onClick={handleClick}
      {...props}
    >
      {leadingIcon && (
        <span className={styles.itemIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className={styles.itemLabel}>{children}</span>
      {trailingIcon && (
        <span className={styles.itemIcon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}

MenuItem.displayName = 'Menu.Item';

// ============================================================================
// SEPARATOR — reuses the Divider atom directly (same move ButtonIsland
// makes with Separator: no bespoke separator implementation, just the
// existing full-width horizontal-rule atom exposed as a discoverable
// static). No custom color/inset needed — with `.menu` flush (zero
// padding), Divider's own default full-bleed styling gives it a clearly
// stronger line than the subtle per-item hairline above, so a real group
// break still reads as one rather than blending into it.
// ============================================================================

Menu.Item = MenuItem;
Menu.Separator = Divider;
