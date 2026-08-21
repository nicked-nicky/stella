import { Fragment } from 'react';
import { Text } from '../../atoms/Text';
import { Divider } from '../../atoms/Divider';
import { FlexContainer } from '../../layout/FlexContainer';
import { SettingsFieldRow } from './fields/SettingsFieldRow';
import type { SettingsCategory, SettingsFieldValue } from './types';
import styles from './SettingsMenu.module.css';

interface SettingsCategoryPanelProps {
  category: SettingsCategory;
  values: Record<string, SettingsFieldValue>;
  onFieldChange: (key: string, value: SettingsFieldValue) => void;
}

/**
 * SettingsCategoryPanel - the right-hand pane: category title/
 * description, then every field in it dispatched through
 * `SettingsFieldRow`, separated by a quiet row `Divider`. Internal
 * decomposition detail of `SettingsMenu`, not exported.
 */
export function SettingsCategoryPanel({
  category,
  values,
  onFieldChange,
}: SettingsCategoryPanelProps) {
  return (
    <div>
      <Text
        variant="title-2"
        as="h2"
        style={{ marginBottom: 'var(--stella-space-1)' }}
      >
        {category.label}
      </Text>
      {category.description && (
        <Text
          variant="body"
          color="secondary"
          as="p"
          style={{ marginBottom: 'var(--stella-space-6)' }}
        >
          {category.description}
        </Text>
      )}
      {!category.description && (
        <div style={{ marginBottom: 'var(--stella-space-4)' }} />
      )}

      <FlexContainer direction="column" gap="0">
        {category.fields.map((field, idx) => (
          <Fragment key={field.key}>
            <div style={{ padding: 'var(--stella-space-4) 0' }}>
              <SettingsFieldRow
                categoryId={category.id}
                field={field}
                value={values[field.key]}
                onChange={(value) => onFieldChange(field.key, value)}
              />
            </div>
            {idx < category.fields.length - 1 && (
              <Divider className={styles.rowDivider} />
            )}
          </Fragment>
        ))}
      </FlexContainer>
    </div>
  );
}

SettingsCategoryPanel.displayName = 'SettingsMenu.CategoryPanel';
