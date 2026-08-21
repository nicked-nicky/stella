import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio } from './Radio';

// Radio's design decision is that grouping is the *browser's* job: give
// two radios the same `name` and mutual exclusion plus arrow-key roving
// come for free, with no roving-tabindex JS to maintain. That's a
// deliberate non-feature, so it's worth a test proving the delegation
// actually works — otherwise the first person to hit a grouping bug will
// "fix" it by adding the JS the component was designed to avoid.

describe('Radio — label association', () => {
  it('associates the generated label with the input', () => {
    render(<Radio label="Free plan" />);
    expect(
      screen.getByRole('radio', { name: 'Free plan' })
    ).toBeInTheDocument();
  });

  it('honours a caller-supplied id instead of generating one', () => {
    render(<Radio id="plan-free" label="Free plan" />);
    expect(screen.getByRole('radio', { name: 'Free plan' })).toHaveAttribute(
      'id',
      'plan-free'
    );
  });

  it('gives each instance a unique id when none is supplied', () => {
    render(
      <>
        <Radio label="One" />
        <Radio label="Two" />
      </>
    );
    const [first, second] = screen.getAllByRole('radio');
    expect(first!.id).toBeTruthy();
    expect(first!.id).not.toBe(second!.id);
  });

  it('renders bare, with no wrapping label, when no label prop is given', () => {
    render(<Radio aria-label="Bare" />);
    const radio = screen.getByRole('radio', { name: 'Bare' });
    expect(radio.closest('label')).toBeNull();
  });

  it('clicking the label text selects the radio', async () => {
    const user = userEvent.setup();
    render(<Radio label="Free plan" />);
    await user.click(screen.getByText('Free plan'));
    expect(screen.getByRole('radio', { name: 'Free plan' })).toBeChecked();
  });
});

describe('Radio — group semantics delegated to the browser', () => {
  it('radios sharing a name are mutually exclusive', async () => {
    const user = userEvent.setup();
    render(
      <fieldset>
        <legend>Plan</legend>
        <Radio name="plan" value="free" label="Free" defaultChecked />
        <Radio name="plan" value="pro" label="Pro" />
      </fieldset>
    );

    const free = screen.getByRole('radio', { name: 'Free' });
    const pro = screen.getByRole('radio', { name: 'Pro' });
    expect(free).toBeChecked();

    await user.click(pro);
    expect(pro).toBeChecked();
    expect(free).not.toBeChecked();
  });

  it('radios with different names do not interfere', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="plan" value="free" label="Free" />
        <Radio name="billing" value="annual" label="Annual" />
      </>
    );

    await user.click(screen.getByRole('radio', { name: 'Free' }));
    await user.click(screen.getByRole('radio', { name: 'Annual' }));

    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Annual' })).toBeChecked();
  });

  it('exposes the group to assistive tech via fieldset/legend', () => {
    render(
      <fieldset>
        <legend>Plan</legend>
        <Radio name="plan" value="free" label="Free" />
      </fieldset>
    );
    expect(screen.getByRole('group', { name: 'Plan' })).toBeInTheDocument();
  });
});

describe('Radio — controlled and disabled', () => {
  it('defers to the parent when controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Radio name="plan" label="Pro" checked={false} onChange={onChange} />
    );
    const radio = screen.getByRole('radio', { name: 'Pro' });

    await user.click(radio);
    expect(onChange).toHaveBeenCalledTimes(1);
    // Parent didn't re-render with checked=true, so it stays unchecked.
    expect(radio).not.toBeChecked();
  });

  it('does not fire onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Radio name="plan" label="Pro" disabled onChange={onChange} />);
    const radio = screen.getByRole('radio', { name: 'Pro' });

    expect(radio).toBeDisabled();
    await user.click(radio);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('carries its value through for form submission', () => {
    render(<Radio name="plan" value="pro" label="Pro" defaultChecked />);
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveAttribute(
      'value',
      'pro'
    );
  });

  it('hides the decorative dot from the accessibility tree', () => {
    const { container } = render(<Radio label="Free" />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
