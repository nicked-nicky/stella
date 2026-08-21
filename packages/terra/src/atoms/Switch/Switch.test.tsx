import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';

// Switch is the one atom with hand-rolled keyboard/ARIA wiring (no
// native <input type="switch">), which makes it the highest-regression-
// risk atom in the kit — worth a real test rather than trusting the
// button's native Space/Enter activation blindly.

describe('Switch', () => {
  it('exposes role="switch" and aria-checked, not a native checkbox role', () => {
    render(<Switch defaultChecked aria-label="Notifications" />);
    const el = screen.getByRole('switch', { name: 'Notifications' });
    expect(el).toHaveAttribute('aria-checked', 'true');
  });

  it('uncontrolled: toggles its own state on click', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);
    const el = screen.getByRole('switch', { name: 'Notifications' });

    expect(el).toHaveAttribute('aria-checked', 'false');
    await user.click(el);
    expect(el).toHaveAttribute('aria-checked', 'true');
  });

  it('uncontrolled: toggles via keyboard (Space), same as a native button', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);
    const el = screen.getByRole('switch', { name: 'Notifications' });

    el.focus();
    await user.keyboard(' ');
    expect(el).toHaveAttribute('aria-checked', 'true');
  });

  it('controlled: defers to checked/onCheckedChange, does not flip on its own', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch
        checked={false}
        onCheckedChange={onCheckedChange}
        aria-label="Wifi"
      />
    );
    const el = screen.getByRole('switch', { name: 'Wifi' });

    await user.click(el);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // Parent didn't re-render with checked=true, so the switch stays off —
    // this is what "controlled" means, and it's easy to accidentally break.
    expect(el).toHaveAttribute('aria-checked', 'false');
  });

  it('does not fire onCheckedChange when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch disabled onCheckedChange={onCheckedChange} aria-label="Locked" />
    );
    await user.click(screen.getByRole('switch', { name: 'Locked' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
