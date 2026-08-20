import { useId } from 'react';
import { BooleanField } from './BooleanField';
import { ChoiceField } from './ChoiceField';
import { TextField } from './TextField';
import type { SettingsField, SettingsFieldValue } from '../types';

interface SettingsFieldRowProps {
  categoryId: string;
  field: SettingsField;
  value: SettingsFieldValue | undefined;
  onChange: (value: SettingsFieldValue) => void;
}

/**
 * Dispatches on `field.type` to the matching renderer — one file per
 * field type instead of one growing if-chain, so a new field type
 * means adding a file here, not editing this one.
 */
export function SettingsFieldRow({ categoryId, field, value, onChange }: SettingsFieldRowProps) {
  const fieldId = useId();

  if (field.type === 'boolean') {
    return <BooleanField field={field} fieldId={fieldId} value={value} onChange={onChange} />;
  }
  if (field.type === 'choice') {
    return (
      <ChoiceField categoryId={categoryId} field={field} value={value} onChange={onChange} />
    );
  }
  return <TextField field={field} fieldId={fieldId} value={value} onChange={onChange} />;
}
