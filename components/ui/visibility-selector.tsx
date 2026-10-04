import { ChoiceChips } from '@/components/ui/choice-chips';
import { Text } from '@/components/ui/text';

export type Visibility = 'private' | 'shared';

export function VisibilitySelector({ value, onChange, sharedAvailable, showUnavailableShared = false, disabled, label = 'Who can see this?', privateHint, sharedHint, sharedLabel = 'Shared' }: {
  value: Visibility;
  onChange: (value: Visibility) => void;
  sharedAvailable: boolean;
  showUnavailableShared?: boolean;
  disabled?: boolean;
  label?: string;
  privateHint?: string;
  sharedHint?: string;
  sharedLabel?: string;
}) {
  return <>
    <ChoiceChips label={label} value={value} options={[{ value: 'private', label: 'Personal' }, ...(sharedAvailable || showUnavailableShared ? [{ value: 'shared' as const, label: sharedLabel === 'Shared' ? 'Ours' : sharedLabel, disabled: !sharedAvailable }] : [])]} onChange={onChange} disabled={disabled} />
    {(value === 'private' ? privateHint : sharedHint) && <Text variant="caption" tone="secondary">{value === 'private' ? privateHint : sharedHint}</Text>}
  </>;
}
