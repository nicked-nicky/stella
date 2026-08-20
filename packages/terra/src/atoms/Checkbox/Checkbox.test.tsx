import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';

// Example/template test — see WIKI.md's Testing section for what belongs
// here (logic, ARIA, controlled/uncontrolled) vs in a Playwright
// component test (anything CSS-state-dependent).

describe('Checkbox', () => {
  it('associates the label with the input via htmlFor/id', () => {
    render(<Checkbox label="Accept terms" />);
    const input = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(input).toBeInTheDocument();
  });

  it('toggles on click and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Auto-save" onChange={onChange} />);

    const input = screen.getByRole('checkbox', { name: 'Auto-save' });
    expect(input).not.toBeChecked();

    await user.click(input);
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('sets the native indeterminate property (no HTML attribute for it)', () => {
    render(<Checkbox label="Select all" indeterminate />);
    const input = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  it('is keyboard-disabled and unclickable when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Unavailable" disabled onChange={onChange} />);

    const input = screen.getByRole('checkbox', { name: 'Unavailable' });
    expect(input).toBeDisabled();

    await user.click(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});
