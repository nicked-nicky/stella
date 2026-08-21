import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Divider } from './Divider';
import { Spinner } from './Spinner';
import { Text } from './Text';
import { FlexContainer } from '../layout/FlexContainer';
import { WindowControls } from '../molecules/WindowControls';

// Deliberately thin. These components are presentational — they render
// props into markup and hand the rest to CSS — so exhaustive tests here
// would mostly assert that CSS Modules hashes class names, which is not
// a useful thing to protect. What's worth pinning down is the semantic
// contract each one makes (a Divider's role, a Spinner's label, Text's
// variant→element mapping) and the couple of genuinely conditional
// branches, so that a CI failure means something real.
//
// Anything whose correctness lives in computed CSS belongs in a
// Playwright *.ct.tsx file instead — see WIKI.md's Testing section.

describe('Avatar', () => {
  it('renders the image when a src is given', () => {
    render(<Avatar src="/jane.jpg" alt="Jane Doe" initials="JD" />);
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    render(<Avatar src="/broken.jpg" alt="Jane Doe" initials="JD" />);
    // Simulate the 404/offline case the onError handler exists for.
    fireEvent.error(screen.getByRole('img', { name: 'Jane Doe' }));
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('falls back to a generic icon when there are no initials either', () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('truncates initials to two characters', () => {
    render(<Avatar initials="ABCD" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });
});

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('carries colour and variant as data attributes for CSS to resolve', () => {
    // The whole component is an attribute carrier — Badge.module.css's
    // [data-color][data-variant] rules do the work, so these attributes
    // are the actual public contract, not an implementation detail.
    render(
      <Badge color="error" variant="filled">
        3 errors
      </Badge>
    );
    const badge = screen.getByText('3 errors');
    expect(badge).toHaveAttribute('data-color', 'error');
    expect(badge).toHaveAttribute('data-variant', 'filled');
  });

  it('defaults to neutral/tinted', () => {
    render(<Badge>Plain</Badge>);
    const badge = screen.getByText('Plain');
    expect(badge).toHaveAttribute('data-color', 'neutral');
    expect(badge).toHaveAttribute('data-variant', 'tinted');
  });
});

describe('Divider', () => {
  it('uses role="separator" rather than an <hr>', () => {
    // <hr> has no accessible vertical form, which is why this is a div
    // with an explicit role — worth pinning so it doesn't get "simplified"
    // back to an <hr> later.
    render(<Divider />);
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'horizontal'
    );
  });

  it('reports its vertical orientation to assistive tech', () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    );
  });
});

describe('Spinner', () => {
  it('announces itself as a loading status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('allows the label to be overridden for a specific context', () => {
    render(<Spinner aria-label="Saving changes" />);
    expect(
      screen.getByRole('status', { name: 'Saving changes' })
    ).toBeInTheDocument();
  });
});

describe('Text', () => {
  it('maps title variants to matching heading levels by default', () => {
    render(
      <>
        <Text variant="title-1">One</Text>
        <Text variant="title-2">Two</Text>
        <Text variant="title-3">Three</Text>
      </>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'One' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Two' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Three' })
    ).toBeInTheDocument();
  });

  it('keeps the visual variant and the semantic element independent', () => {
    // The documented escape hatch: look like a title-2, still be the h1.
    render(
      <Text variant="title-2" as="h1">
        Smaller but primary
      </Text>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Smaller but primary' })
    ).toBeInTheDocument();
  });

  it('renders body-level variants as a span, contributing no heading structure', () => {
    render(<Text variant="body">Just copy</Text>);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Just copy').tagName).toBe('SPAN');
  });
});

describe('FlexContainer', () => {
  it('renders its children', () => {
    render(
      <FlexContainer>
        <span>child</span>
      </FlexContainer>
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('renders as a div by default and contributes no semantics of its own', () => {
    const { container } = render(
      <FlexContainer>
        <span>child</span>
      </FlexContainer>
    );
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
});

describe('WindowControls', () => {
  it('renders only the buttons whose handler was supplied', () => {
    // A consumer that can't minimize omits the handler and should get a
    // two-button cluster — not a disabled placeholder.
    render(
      <WindowControls controls={{ maximize: () => {}, close: () => {} }} />
    );
    expect(screen.queryByRole('button', { name: 'Minimize' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Maximize' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders nothing at all when no handlers are supplied', () => {
    const { container } = render(<WindowControls controls={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('swaps the maximize button to Restore when the window is maximized', () => {
    render(
      <WindowControls controls={{ maximize: () => {}, maximized: true }} />
    );
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maximize' })).toBeNull();
  });

  it('invokes the supplied handlers on click', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    render(
      <WindowControls
        controls={{
          minimize: () => calls.push('minimize'),
          maximize: () => calls.push('maximize'),
          close: () => calls.push('close'),
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Minimize' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(calls).toEqual(['minimize', 'close']);
  });
});
