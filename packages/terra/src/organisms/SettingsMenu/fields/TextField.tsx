import { Text } from '../../../atoms/Text';
import { Input } from '../../../atoms/Input';
import type { SettingsTextField, SettingsFieldValue } from '../types';

interface TextFieldProps {
  field: SettingsTextField;
  fieldId: string;
  value: SettingsFieldValue | undefined;
  onChange: (value: SettingsFieldValue) => void;
}

/** Renders a `type: 'text'` field as a bare `Input`. */
export function TextField({ field, fieldId, value, onChange }: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={fieldId}
        style={{ display: 'block', marginBottom: 'var(--stella-space-1)' }}
      >
        <Text as="span" variant="body-strong">
          {field.label}
        </Text>
      </label>
      {field.description && (
        <Text
          as="p"
          variant="caption"
          color="secondary"
          style={{ marginBottom: 'var(--stella-space-2)' }}
        >
          {field.description}
        </Text>
      )}
      <Input
        id={fieldId}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ maxWidth: '320px' }}
      />
    </div>
  );
}
