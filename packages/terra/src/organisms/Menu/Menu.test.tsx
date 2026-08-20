import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverlayProvider } from '../../providers/OverlayProvider';
import { Menu } from './Menu';

// Menu implements WAI-ARIA menu keyboard behaviour by hand — arrow-key
// roving, Home/End, typeahead, Tab-closes — with no native element
// backing any of it. That's the same risk profile that justified giving
// Switch a test: nothing about a <button role="menuitem"> makes the
// browser supply this for free, so if the handler regresses the menu
// still looks fine and is simply unusable by keyboard.

/** Menu with a real trigger element to anchor against. */
function MenuHarness({
  onClose,
  children,
}: {
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  return (
    <OverlayProvider>
      <button ref={setAnchor}>Trigger</button>
      <Menu open={open} onClose={close} anchor={anchor}>
        {children}
      </Menu>
    </OverlayProvider>
  );
}

function defaultItems() {
  return (
    <>
      <Menu.Item>Copy</Menu.Item>
      <Menu.Item>Paste</Menu.Item>
      <Menu.Item>Delete</Menu.Item>
    </>
  );
}

/** Waits for the open-focus rAF to land on the first item. */
async function waitForMenuReady() {
  const menu = await screen.findByRole('menu');
  await waitFor(() =>
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus()
  );
  return menu;
}

describe('Menu — structure and ARIA', () => {
  it('renders role="menu" containing role="menuitem" children', async () => {
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
  });

  it('takes items out of the natural tab order (roving focus, not tab-through)', async () => {
    // WAI-ARIA menus are a single tab stop; arrow keys move within.
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await screen.findByRole('menu');
    screen.getAllByRole('menuitem').forEach((item) => {
      expect(item).toHaveAttribute('tabindex', '-1');
    });
  });

  it('auto-inserts a hairline separator between adjacent items', async () => {
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    const menu = await screen.findByRole('menu');
    // Three items → two gaps between them.
    expect(within(menu).getAllByRole('separator')).toHaveLength(2);
  });

  it('does not stack a second hairline next to an explicit Menu.Separator', async () => {
    render(
      <MenuHarness>
        <Menu.Item>Copy</Menu.Item>
        <Menu.Separator />
        <Menu.Item>Delete</Menu.Item>
      </MenuHarness>
    );
    const menu = await screen.findByRole('menu');
    expect(within(menu).getAllByRole('separator')).toHaveLength(1);
  });

  it('is absent from the document when closed', () => {
    render(
      <OverlayProvider>
        <Menu open={false} anchor={null}>
          <Menu.Item>Copy</Menu.Item>
        </Menu>
      </OverlayProvider>
    );
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('Menu — keyboard navigation', () => {
  it('focuses the first item on open', async () => {
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();
  });

  it('ArrowDown moves focus to the next item', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Paste' })).toHaveFocus();
  });

  it('ArrowUp moves focus to the previous item', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Paste' })).toHaveFocus();
  });

  it('ArrowDown wraps from the last item to the first', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });

  it('ArrowUp wraps from the first item to the last', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('Home and End jump to the ends', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });

  it('skips disabled items when navigating', async () => {
    const user = userEvent.setup();
    render(
      <MenuHarness>
        <Menu.Item>Copy</Menu.Item>
        <Menu.Item disabled>Paste</Menu.Item>
        <Menu.Item>Delete</Menu.Item>
      </MenuHarness>
    );
    await waitForMenuReady();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });
});

describe('Menu — typeahead', () => {
  it('typing a letter jumps to the first item starting with it', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('d');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<MenuHarness>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('P');
    expect(screen.getByRole('menuitem', { name: 'Paste' })).toHaveFocus();
  });

  it('accumulates consecutive letters to disambiguate', async () => {
    const user = userEvent.setup();
    render(
      <MenuHarness>
        <Menu.Item>Save</Menu.Item>
        <Menu.Item>Select all</Menu.Item>
      </MenuHarness>
    );
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Save' })).toHaveFocus()
    );

    await user.keyboard('se');
    expect(screen.getByRole('menuitem', { name: 'Select all' })).toHaveFocus();
  });

  it('ignores whitespace so Space stays available for activation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <MenuHarness>
        <Menu.Item onSelect={onSelect}>Copy</Menu.Item>
        <Menu.Item>Paste</Menu.Item>
      </MenuHarness>
    );
    await waitForMenuReady();

    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('Menu — dismissal', () => {
  it('Escape closes the menu', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MenuHarness onClose={onClose}>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab closes the menu rather than tabbing through its items', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MenuHarness onClose={onClose}>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.tab();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('an outside click closes the menu', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MenuHarness onClose={onClose}>{defaultItems()}</MenuHarness>);
    await waitForMenuReady();

    await user.click(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selecting an item fires onSelect and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <MenuHarness onClose={onClose}>
        <Menu.Item onSelect={onSelect}>Copy</Menu.Item>
        <Menu.Item>Paste</Menu.Item>
      </MenuHarness>
    );
    await waitForMenuReady();

    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnSelect={false} keeps the menu open after a selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <MenuHarness onClose={onClose}>
        <Menu.Item onSelect={onSelect} closeOnSelect={false}>
          Toggle
        </Menu.Item>
        <Menu.Item>Paste</Menu.Item>
      </MenuHarness>
    );
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Toggle' })).toHaveFocus()
    );

    await user.click(screen.getByRole('menuitem', { name: 'Toggle' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a disabled item does not fire onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <MenuHarness>
        <Menu.Item>Copy</Menu.Item>
        <Menu.Item disabled onSelect={onSelect}>
          Paste
        </Menu.Item>
      </MenuHarness>
    );
    await waitForMenuReady();

    await user.click(screen.getByRole('menuitem', { name: 'Paste' }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('Menu — compound-component guard', () => {
  it('throws a named error if Menu.Item is used outside Menu', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Menu.Item>Orphan</Menu.Item>)).toThrow(
      /must be used inside <Menu>/
    );
    spy.mockRestore();
  });
});
