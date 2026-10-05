import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { borders, colors, layout, radii, spacing } from '@/constants/theme';

export function Checkbox({ checked, label, loading, onPress }: { checked: boolean; label: string; loading?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" aria-checked={checked} aria-busy={loading} accessibilityLabel={label} accessibilityState={{ checked, busy: loading, disabled: loading }} disabled={loading} onPress={onPress} style={styles.target}>
    <View style={[styles.box, checked && styles.checked]}>{checked && <Check color={colors.onAccent} size={layout.iconSize} />}</View>
  </Pressable>;
}

const styles = StyleSheet.create({
  target: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, justifyContent: 'center', alignItems: 'center' },
  box: { width: spacing.xl, height: spacing.xl, borderWidth: borders.focus, borderColor: colors.accent, borderRadius: radii.sm },
  checked: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
