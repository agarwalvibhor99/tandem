import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, shadows, spacing } from '@/constants/theme';

type Props<T extends string> = { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void };
export function SegmentedControl<T extends string>({ label, value, options, onChange }: Props<T>) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.track}>
    {options.map(option => <PressableScale key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: option.value === value }} onPress={() => onChange(option.value)} style={[styles.option, value === option.value && styles.selected]}>
      <Text variant="label" tone={value === option.value ? 'accent' : 'secondary'}>{option.label}</Text>
    </PressableScale>)}
  </View>;
}
const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.chip, padding: spacing.xs, borderRadius: radii.md, gap: spacing.xs },
  option: { flex: 1, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.surface, ...shadows.soft },
});
