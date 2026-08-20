import { FlexContainer } from '../../layout/FlexContainer';
import type { SettingsCategory } from './types';
import styles from './SettingsMenu.module.css';

interface SettingsNavProps {
  categories: SettingsCategory[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
}

/**
 * SettingsNav - left-hand category list. Flat pill nav items with no
 * wrapping Island — deliberately not built from `Button` (see
 * SettingsMenu.module.css). Internal decomposition detail of
 * `SettingsMenu`, not exported.
 */
export function SettingsNav({ categories, activeId, onSelect }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings categories"
      style={{
        width: '220px',
        flexShrink: 0,
        overflowY: 'auto',
        borderRight: 'var(--stella-border-width) solid var(--stella-border-default)',
        padding: 'var(--stella-space-3)',
      }}
    >
      <FlexContainer direction="column" gap="1" style={{ width: '100%' }}>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={[styles.navItem, category.id === activeId && styles.navItemActive]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(category.id)}
            aria-current={category.id === activeId ? 'true' : undefined}
          >
            <span className={styles.navIcon}>{category.icon}</span>
            {category.label}
          </button>
        ))}
      </FlexContainer>
    </nav>
  );
}

SettingsNav.displayName = 'SettingsMenu.Nav';
