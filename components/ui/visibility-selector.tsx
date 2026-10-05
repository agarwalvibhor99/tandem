import { VisibilitySegment, type Visibility } from '@/components/ui/visibility-segment';
import { Text } from '@/components/ui/text';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';

export type { Visibility };

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
  return <View style={styles.group}>
    <Text variant="label">{label}</Text>
    <VisibilitySegment value={value} onChange={onChange} sharedAvailable={sharedAvailable} showShared={sharedAvailable || showUnavailableShared} disabled={disabled} sharedLabel={sharedLabel === 'Shared' ? 'Ours' : sharedLabel} />
    {(value === 'private' ? privateHint : sharedHint) && <Text variant="caption" tone="secondary">{value === 'private' ? privateHint : sharedHint}</Text>}
  </View>;
}

const styles = StyleSheet.create({ group: { gap: spacing.sm } });
