import { Text } from '../../../atoms/Text';
import { Switch } from '../../../atoms/Switch';
import { FlexContainer } from '../../../layout/FlexContainer';
import type { SettingsBooleanField, SettingsFieldValue } from '../types';

interface BooleanFieldProps {
  field: SettingsBooleanField;
  fieldId: string;
  value: SettingsFieldValue | undefined;
  onChange: (value: SettingsFieldValue) => void;
}

/**
 * Renders a `type: 'boolean'` field as a `Switch`. The whole label
 * block (title + description) is clickable — libadwaita's
 * ActionRow/SwitchRow convention of a large click target.
 */
export function BooleanField({
  field,
  fieldId,
  value,
  onChange,
}: BooleanFieldProps) {
  return (
    <FlexContainer justify="between" align="center" gap="4">
      <label htmlFor={fieldId} style={{ cursor: 'pointer' }}>
        <Text as="span" variant="body-strong">
          {field.label}
        </Text>
        {field.description && (
          <Text
            as="p"
            variant="caption"
            color="secondary"
            style={{ marginTop: 'var(--stella-space-1)' }}
          >
            {field.description}
          </Text>
        )}
      </label>
      <Switch
        id={fieldId}
        checked={Boolean(value)}
        onCheckedChange={onChange}
      />
    </FlexContainer>
  );
}
