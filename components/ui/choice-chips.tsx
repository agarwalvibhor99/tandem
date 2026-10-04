import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Props<T extends string> = { label: string; value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void; disabled?: boolean; scrollable?: boolean };
export function ChoiceChips<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  const chips = options.map((option) => <Pressable key={option.value} accessibilityRole="radio" aria-checked={value === option.value} accessibilityLabel={option.label} accessibilityState={{ checked: value === option.value, disabled: disabled || option.disabled }} disabled={disabled || option.disabled} onPress={() => onChange(option.value)} style={[styles.chip, value === option.value && styles.selected, (disabled || option.disabled) && styles.disabled]}>
    <Text variant="label" tone={value === option.value ? 'inverse' : 'secondary'}>{option.label}</Text>
  </Pressable>);
  return <View style={styles.group}>
    <Text variant="label">{label}</Text>
    <View style={styles.row}>{chips}</View>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.chip, justifyContent: 'center' },
  selected: { backgroundColor: colors.accent }, disabled: { opacity: 0.5 },
});
