import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

type Props<T extends string> = { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; disabled?: boolean };
export function ChoiceChips<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  return <View style={styles.group}>
    <Text variant="label">{label}</Text>
    <View style={styles.row}>
      {options.map((option) => <Pressable key={option.value} accessibilityRole="radio" aria-checked={value === option.value} accessibilityLabel={option.label} accessibilityState={{ checked: value === option.value, disabled }} disabled={disabled} onPress={() => onChange(option.value)} style={[styles.chip, value === option.value && styles.selected, disabled && styles.disabled]}>
        <Text variant="label" tone={value === option.value ? 'inverse' : 'secondary'}>{option.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: layout.minTouchTarget, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, justifyContent: 'center' },
  selected: { backgroundColor: colors.accent }, disabled: { opacity: 0.5 },
});
