import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

// Input is a thin wrapper over a native <input>, so the interesting
// surface is the small amount it adds on top: the aria-invalid signal,
// forwarding the ref past the styling wrapper span, and not swallowing
// the native controlled/uncontrolled contract on the way through.

describe('Input — native behaviour passes through', () => {
  it('accepts typed text when uncontrolled', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    await user.type(input, 'hello@example.com');
    expect(input).toHaveValue('hello@example.com');
  });

  it('defers to the parent when controlled', async () => {
    // The classic wrapper bug: an internal value state that shadows the
    // `value` prop, so the field appears to work but ignores the parent.
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input aria-label="Email" value="fixed" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    await user.type(input, 'x');
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('fixed');
  });

  it('updates when a controlled parent does re-render', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <Input
          aria-label="Email"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    await user.type(input, 'abc');
    expect(input).toHaveValue('abc');
  });

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input aria-label="Email" disabled onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(input).toBeDisabled();
    await user.type(input, 'nope');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards arbitrary input attributes to the real <input>', async () => {
    render(
      <Input
        aria-label="Email"
        type="email"
        placeholder="you@example.com"
        required
      />
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
    expect(input).toBeRequired();
  });

  it('forwards its ref to the input element, not the styling wrapper', async () => {
    // The wrapper <span> exists purely for the icon layout — a consumer
    // calling ref.current.focus() must reach the field itself.
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current?.focus();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus();
  });
});

describe('Input — error state', () => {
  it('sets aria-invalid when error is set', () => {
    render(<Input aria-label="Email" error />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('omits aria-invalid entirely when there is no error', () => {
    // aria-invalid="false" is valid but noisier than absence; the
    // component deliberately emits undefined, so assert that.
    render(<Input aria-label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).not.toHaveAttribute(
      'aria-invalid'
    );
  });

  it('keeps the error signal semantic, not colour-only', () => {
    // The visual treatment lives in CSS (covered by the CT tests); what
    // matters here is that a screen-reader user is told at all.
    render(<Input aria-label="Email" error aria-describedby="email-error" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });
});

describe('Input — decoration', () => {
  it('hides leading and trailing icons from the accessibility tree', () => {
    render(
      <Input
        aria-label="Search"
        leadingIcon={<span data-testid="lead">L</span>}
        trailingIcon={<span data-testid="trail">T</span>}
      />
    );
    expect(screen.getByTestId('lead').parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    expect(screen.getByTestId('trail').parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});
