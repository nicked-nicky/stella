import { describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverlayProvider } from '../../providers/OverlayProvider';
import { Dialog } from './Dialog';

// A modal that leaks focus is a modal that's broken for keyboard and
// screen-reader users — the trap, the initial focus move, and the
// focus-restore-on-close are the three things that make it a dialog
// rather than a floating div. All three are hand-rolled here (no
// third-party focus-trap dependency, per Terra's bundle-size bar), so
// they're worth asserting directly.

function renderDialog(ui: ReactNode) {
  return render(<OverlayProvider>{ui}</OverlayProvider>);
}

/** Dialog with a trigger, so focus-restore has somewhere to restore to. */
function DialogHarness({
  onClose,
  closeOnBackdrop,
}: {
  onClose?: () => void;
  closeOnBackdrop?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  return (
    <OverlayProvider>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <Dialog
        open={open}
        onClose={close}
        {...(closeOnBackdrop === undefined ? {} : { closeOnBackdrop })}
      >
        <Dialog.Header>
          <Dialog.Title>Settings</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <button>First</button>
          <button>Last</button>
        </Dialog.Body>
      </Dialog>
    </OverlayProvider>
  );
}

describe('Dialog — ARIA semantics', () => {
  it('exposes role="dialog" with aria-modal', async () => {
    renderDialog(
      <Dialog open>
        <Dialog.Body>Body</Dialog.Body>
      </Dialog>
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('labels itself from Dialog.Title when one is present', async () => {
    renderDialog(
      <Dialog open>
        <Dialog.Header>
          <Dialog.Title>Preferences</Dialog.Title>
        </Dialog.Header>
      </Dialog>
    );
    // Resolving by accessible name proves the aria-labelledby wiring
    // actually points at the rendered title node.
    expect(
      await screen.findByRole('dialog', { name: 'Preferences' })
    ).toBeInTheDocument();
  });

  it('describes itself from Dialog.Description when one is present', async () => {
    renderDialog(
      <Dialog open>
        <Dialog.Header>
          <Dialog.Title>Preferences</Dialog.Title>
          <Dialog.Description>Tune the app</Dialog.Description>
        </Dialog.Header>
      </Dialog>
    );
    const dialog = await screen.findByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      'Tune the app'
    );
  });

  it('omits aria-labelledby entirely when there is no title, rather than pointing at a missing id', async () => {
    // A dangling aria-labelledby is worse than none — screen readers
    // announce an unlabelled dialog either way, but a broken reference
    // hides the problem from auditing tools.
    renderDialog(
      <Dialog open>
        <Dialog.Body>Just a body</Dialog.Body>
      </Dialog>
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('renders the header close button only when onClose is provided', async () => {
    const { unmount } = renderDialog(
      <Dialog open>
        <Dialog.Header>
          <Dialog.Title>No close</Dialog.Title>
        </Dialog.Header>
      </Dialog>
    );
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Close dialog' })).toBeNull();
    unmount();

    renderDialog(
      <Dialog open onClose={() => {}}>
        <Dialog.Header>
          <Dialog.Title>Has close</Dialog.Title>
        </Dialog.Header>
      </Dialog>
    );
    expect(
      await screen.findByRole('button', { name: 'Close dialog' })
    ).toBeInTheDocument();
  });
});

describe('Dialog — focus management', () => {
  it('moves focus into the panel on open', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
        true
      );
    });
  });

  it('restores focus to the trigger on close', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });

    await user.click(trigger);
    await waitFor(() =>
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
        true
      )
    );

    await user.keyboard('{Escape}');

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('traps Tab at the end of the panel, wrapping to the first focusable', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await screen.findByRole('dialog');

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'Last' });

    last.focus();
    await user.tab();

    // Wrapped back to the first focusable in the panel (the close button)
    // rather than escaping to the trigger behind the backdrop.
    expect(closeButton).toHaveFocus();
  });

  it('traps Shift+Tab at the start of the panel, wrapping to the last focusable', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await screen.findByRole('dialog');

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'Last' });

    closeButton.focus();
    await user.tab({ shift: true });

    expect(last).toHaveFocus();
  });

  it('leaves Tab alone in the middle of the panel', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await screen.findByRole('dialog');

    const first = screen.getByRole('button', { name: 'First' });
    first.focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });
});

describe('Dialog — dismissal', () => {
  it('Escape calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('the header close button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    await user.click(
      await screen.findByRole('button', { name: 'Close dialog' })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a backdrop click closes by default', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    const dialog = await screen.findByRole('dialog');

    // The backdrop is the panel's parent; clicking the panel itself must
    // not close, so the two are asserted as a pair.
    await user.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a click inside the panel does not close', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closeOnBackdrop={false} keeps the dialog open on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DialogHarness onClose={onClose} closeOnBackdrop={false} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(dialog.parentElement!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('is not in the document at all when closed', () => {
    renderDialog(
      <Dialog open={false}>
        <Dialog.Body>Body</Dialog.Body>
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Dialog — compound-component guard', () => {
  it('throws a named error if a subcomponent is used outside Dialog', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Dialog.Title>Orphan</Dialog.Title>)).toThrow(
      /must be used inside <Dialog>/
    );
    spy.mockRestore();
  });
});
