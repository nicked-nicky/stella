import { useState } from 'react';
import { FlexContainer } from '../../layout/FlexContainer';
import { SettingsNav } from './SettingsNav';
import { SettingsCategoryPanel } from './SettingsCategoryPanel';
import type { SettingsSchema, SettingsValues, SettingsFieldValue } from './types';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsMenuProps {
  /** The category/field structure — this is the "data" the menu drives off of. */
  schema: SettingsSchema;
  /** Current field values. Fully controlled — SettingsMenu holds no data of its own. */
  values: SettingsValues;
  onChange: (categoryId: string, fieldKey: string, value: SettingsFieldValue) => void;
  /** Controlled category selection. Omit to let SettingsMenu manage it internally. */
  selectedCategoryId?: string;
  onCategoryChange?: (categoryId: string) => void;
  /** Initial category when uncontrolled. Defaults to the first in `schema.categories`. */
  defaultCategoryId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SettingsMenu - data-driven settings UI: categories on the left
 * (`SettingsNav`), the selected category's fields on the right
 * (`SettingsCategoryPanel` → `SettingsFieldRow` → one renderer per
 * field type in `fields/`). Fully controlled, same principle as
 * `ThemeManager`: renders a schema and reports changes, never owns or
 * persists values itself.
 *
 * Split across multiple files as the reference example for how to
 * decompose a growing organism — see WIKI.md's Component Structure
 * section for the full schema/usage example and the reasoning.
 *
 * @example
 * ```tsx
 * <SettingsMenu schema={schema} values={values} onChange={handleChange} />
 * ```
 */
export function SettingsMenu({
  schema,
  values,
  onChange,
  selectedCategoryId,
  onCategoryChange,
  defaultCategoryId,
}: SettingsMenuProps) {
  const [internalSelected, setInternalSelected] = useState(
    defaultCategoryId ?? schema.categories[0]?.id
  );
  const isControlled = selectedCategoryId !== undefined;
  const activeId = isControlled ? selectedCategoryId : internalSelected;

  const handleSelect = (id: string) => {
    if (!isControlled) setInternalSelected(id);
    onCategoryChange?.(id);
  };

  const activeCategory =
    schema.categories.find((c) => c.id === activeId) ?? schema.categories[0];

  return (
    <FlexContainer align="stretch" style={{ height: '100%', minHeight: 0 }}>
      <SettingsNav categories={schema.categories} activeId={activeId} onSelect={handleSelect} />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 'var(--stella-space-6)' }}>
        {activeCategory && (
          <SettingsCategoryPanel
            category={activeCategory}
            values={values[activeCategory.id] ?? {}}
            onFieldChange={(key, value) => onChange(activeCategory.id, key, value)}
          />
        )}
      </div>
    </FlexContainer>
  );
}

SettingsMenu.displayName = 'SettingsMenu';

export type { SettingsMenuProps };
