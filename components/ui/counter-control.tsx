import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';

export function CounterControl({ label, value, min = 0, max = 99, onChange, disabled }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void; disabled?: boolean }) {
  const decreaseDisabled = disabled || value <= min;
  const increaseDisabled = disabled || value >= max;
  return <View style={styles.group}>
    <Text variant="label">{label}</Text>
    <View style={styles.counter}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} accessibilityState={{ disabled: decreaseDisabled }} disabled={decreaseDisabled} onPress={() => onChange(Math.max(min, value - 1))} style={[styles.stepper, decreaseDisabled && styles.disabled]}>
        <Minus color={colors.text} size={layout.iconSize} strokeWidth={1.75} />
      </Pressable>
      <Text variant="heading" style={styles.value}>{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} accessibilityState={{ disabled: increaseDisabled }} disabled={increaseDisabled} onPress={() => onChange(Math.min(max, value + 1))} style={[styles.stepper, increaseDisabled && styles.disabled]}>
        <Plus color={colors.text} size={layout.iconSize} strokeWidth={1.75} />
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  counter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, borderWidth: borders.thin, borderColor: colors.border, padding: spacing.xs, gap: spacing.sm },
  stepper: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  value: { minWidth: layout.smallControlHeight, textAlign: 'center' },
  disabled: { opacity: 0.45 },
});
