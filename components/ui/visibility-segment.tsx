import { Lock, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import type { Visibility } from '@/components/ui/visibility-selector';

export function VisibilitySegment({ value, onChange, sharedAvailable, disabled, privateLabel = 'Personal', sharedLabel = 'Ours' }: { value: Visibility; onChange: (value: Visibility) => void; sharedAvailable: boolean; disabled?: boolean; privateLabel?: string; sharedLabel?: string }) {
  return <View style={styles.segment} accessibilityRole="radiogroup">
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === 'private', disabled }} disabled={disabled} onPress={() => onChange('private')} style={[styles.item, value === 'private' && styles.selected]}>
      <Lock color={value === 'private' ? colors.accent : colors.muted} size={layout.iconSize} strokeWidth={1.75} />
      <Text variant="label" tone={value === 'private' ? 'accent' : 'secondary'}>{privateLabel}</Text>
    </Pressable>
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === 'shared', disabled: disabled || !sharedAvailable }} disabled={disabled || !sharedAvailable} onPress={() => onChange('shared')} style={[styles.item, value === 'shared' && styles.selected, !sharedAvailable && styles.disabled]}>
      <Users color={value === 'shared' ? colors.accent : colors.muted} size={layout.iconSize} strokeWidth={1.75} />
      <Text variant="label" tone={value === 'shared' ? 'accent' : 'secondary'}>{sharedLabel}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: radii.lg, backgroundColor: colors.chip, padding: spacing.xs, gap: spacing.xs },
  item: { flex: 1, minHeight: 56, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.chip, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  disabled: { opacity: 0.45 },
});
