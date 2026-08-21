import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeManager, DEFAULT_THEME_CONFIG } from './ThemeManager';

// ThemeManager is the whole theming contract in one place, and it's pure
// DOM-property writing with no React import — so it tests cheaply and
// covers a lot. The thing worth protecting is that the four axes are
// genuinely independent: they're presented to consumers as four separate
// settings, and the failure mode if that breaks (setting radius quietly
// resetting density) is silent and confusing.

function freshRoot(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('ThemeManager — defaults', () => {
  it('starts from DEFAULT_THEME_CONFIG when given no initial config', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    expect(manager.getConfig()).toEqual(DEFAULT_THEME_CONFIG);
  });

  it('applies its initial config to the root on construction, not lazily on first set', () => {
    const root = freshRoot();
    new ThemeManager(root, { colorScheme: 'dark', radius: 'round' });
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.style.getPropertyValue('--stella-radius-scale')).toBe('1.5');
  });

  it('merges a partial initial config over the defaults', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root, { density: 'compact' });
    expect(manager.getConfig()).toEqual({
      ...DEFAULT_THEME_CONFIG,
      density: 'compact',
    });
  });
});

describe('ThemeManager — colour scheme', () => {
  it('sets data-theme for an explicit light/dark choice', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setColorScheme('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    manager.setColorScheme('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('removes data-theme for `system`, handing the decision to CSS', () => {
    // "system" is the absence of an override, not a third value — the
    // stylesheet's color-scheme + light-dark() resolves it from the OS.
    // Writing data-theme="system" here would match no CSS rule at all.
    const root = freshRoot();
    const manager = new ThemeManager(root, { colorScheme: 'dark' });
    expect(root.getAttribute('data-theme')).toBe('dark');

    manager.setColorScheme('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});

describe('ThemeManager — motion', () => {
  it('removes data-stella-motion for `system`, handing the decision to CSS', () => {
    // Same "system" contract as colour scheme: absence of an override,
    // not a third value — prefers-reduced-motion alone decides.
    const root = freshRoot();
    const manager = new ThemeManager(root, { motion: 'reduced' });
    expect(root.getAttribute('data-stella-motion')).toBe('reduced');

    manager.setMotion('system');
    expect(root.hasAttribute('data-stella-motion')).toBe(false);
  });

  it('writes data-stella-motion for an explicit reduced/off choice', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setMotion('reduced');
    expect(root.getAttribute('data-stella-motion')).toBe('reduced');
    manager.setMotion('off');
    expect(root.getAttribute('data-stella-motion')).toBe('off');
  });
});

describe('ThemeManager — style scales', () => {
  it('writes the radius multiplier rather than a resolved pixel value', () => {
    // Components read --stella-radius-panel, which is defined in terms of
    // this multiplier — so one property write re-rounds the whole kit
    // with zero React re-renders (project principle 5).
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setRadius('sharp');
    expect(root.style.getPropertyValue('--stella-radius-scale')).toBe('0.5');
    manager.setRadius('round');
    expect(root.style.getPropertyValue('--stella-radius-scale')).toBe('1.5');
  });

  it('writes the spacing multiplier for density', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setDensity('compact');
    expect(root.style.getPropertyValue('--stella-space-scale')).toBe('0.85');
    manager.setDensity('comfortable');
    expect(root.style.getPropertyValue('--stella-space-scale')).toBe('1.15');
  });

  it('writes border width as a literal pixel value, not a multiplier', () => {
    // Hairlines don't subdivide cleanly, so this axis skips the scale
    // indirection the other two use — see BorderWidthStyle's docblock.
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setBorderWidth('thin');
    expect(root.style.getPropertyValue('--stella-border-width')).toBe('1px');
  });

  it('`none` is a genuine borderless mode, writing 0px', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setBorderWidth('none');
    expect(root.style.getPropertyValue('--stella-border-width')).toBe('0px');
  });
});

describe('ThemeManager — axis independence', () => {
  it('setting one axis leaves the other three untouched', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root, {
      colorScheme: 'dark',
      radius: 'round',
      density: 'compact',
      borderWidth: 'thick',
    });

    manager.setRadius('sharp');

    const config = manager.getConfig();
    expect(config.radius).toBe('sharp');
    expect(config.colorScheme).toBe('dark');
    expect(config.density).toBe('compact');
    expect(config.borderWidth).toBe('thick');

    // ...and the DOM agrees, not just the in-memory config.
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.style.getPropertyValue('--stella-space-scale')).toBe('0.85');
    expect(root.style.getPropertyValue('--stella-border-width')).toBe('3px');
  });

  it('all four can be set in sequence and all four stick', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.setColorScheme('light');
    manager.setRadius('round');
    manager.setDensity('comfortable');
    manager.setBorderWidth('none');

    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.style.getPropertyValue('--stella-radius-scale')).toBe('1.5');
    expect(root.style.getPropertyValue('--stella-space-scale')).toBe('1.15');
    expect(root.style.getPropertyValue('--stella-border-width')).toBe('0px');
  });
});

describe('ThemeManager — getConfig / loadConfig', () => {
  it('getConfig returns a JSON-serialisable copy, not the live object', () => {
    // The documented save contract is JSON.stringify(getConfig()) — if
    // this handed back the internal object, a caller mutating it would
    // silently desync the manager from the DOM.
    const root = freshRoot();
    const manager = new ThemeManager(root);
    const snapshot = manager.getConfig();
    snapshot.radius = 'round';
    expect(manager.getConfig().radius).toBe('default');
    expect(JSON.parse(JSON.stringify(manager.getConfig()))).toEqual(
      manager.getConfig()
    );
  });

  it('loadConfig applies a saved config to the DOM', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.loadConfig({ colorScheme: 'dark', density: 'compact' });
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.style.getPropertyValue('--stella-space-scale')).toBe('0.85');
  });

  it('loadConfig keeps current values for keys the saved config omits', () => {
    // A config saved before a field existed shouldn't reset that field —
    // this is the stated forward-compatibility guarantee.
    const root = freshRoot();
    const manager = new ThemeManager(root, { radius: 'round' });
    manager.loadConfig({ colorScheme: 'dark' });
    expect(manager.getConfig().radius).toBe('round');
  });

  it('loadConfig normalises the version to the current schema', () => {
    const root = freshRoot();
    const manager = new ThemeManager(root);
    manager.loadConfig({ version: 1 as never, colorScheme: 'dark' });
    expect(manager.getConfig().version).toBe(DEFAULT_THEME_CONFIG.version);
  });

  it('never touches localStorage — persistence is the host app’s job', () => {
    const root = freshRoot();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const manager = new ThemeManager(root);
    manager.setColorScheme('dark');
    manager.setRadius('round');
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe('ThemeManager — subscribe', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = freshRoot();
  });

  it('notifies subscribers after every setter', () => {
    const manager = new ThemeManager(root);
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.setColorScheme('dark');
    manager.setRadius('sharp');

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ colorScheme: 'dark', radius: 'sharp' })
    );
  });

  it('notifies after loadConfig', () => {
    const manager = new ThemeManager(root);
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.loadConfig({ density: 'compact' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not fire on construction — only on change', () => {
    const listener = vi.fn();
    const manager = new ThemeManager(root, { colorScheme: 'dark' });
    manager.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribe stops delivery', () => {
    const manager = new ThemeManager(root);
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);
    unsubscribe();
    manager.setDensity('compact');
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple independent subscribers', () => {
    const manager = new ThemeManager(root);
    const a = vi.fn();
    const b = vi.fn();
    manager.subscribe(a);
    const unsubscribeB = manager.subscribe(b);

    manager.setRadius('sharp');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubscribeB();
    manager.setRadius('round');
    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });
});
