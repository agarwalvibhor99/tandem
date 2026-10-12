import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';

type Props<T extends string> = { label: string; value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void; disabled?: boolean; scrollable?: boolean };
export function ChoiceChips<T extends string>({ label, value, options, onChange, disabled }: Props<T>) {
  const chips = options.map((option) => {
    const selected = value === option.value;
    return <PressableScale key={option.value} accessibilityRole="radio" aria-checked={selected} accessibilityLabel={option.label} accessibilityState={{ checked: selected, disabled: disabled || option.disabled }} disabled={disabled || option.disabled} onPress={() => onChange(option.value)} style={[styles.chip, selected && styles.selected, (disabled || option.disabled) && styles.disabled]}>
      <Text variant="label" tone={selected ? 'inverse' : 'secondary'}>{option.label}</Text>
    </PressableScale>;
  });
  return <View style={styles.group}>
    <Text variant="label">{label}</Text>
    <View style={styles.row}>{chips}</View>
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: spacing.sm }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: layout.minTouchTarget, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.chip, justifyContent: 'center', borderWidth: borders.thin, borderColor: colors.chip },
  selected: { backgroundColor: colors.accent }, disabled: { opacity: 0.5 },
});
