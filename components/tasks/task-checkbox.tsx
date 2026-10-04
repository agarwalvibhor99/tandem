import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radii, spacing } from '@/constants/theme';
export function TaskCheckbox({ completed, title, pending, onPress }: { completed: boolean; title: string; pending: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" aria-checked={completed} aria-busy={pending} accessibilityLabel={`${completed ? 'Reopen' : 'Complete'} ${title}`} accessibilityState={{ checked: completed, busy: pending, disabled: pending }} disabled={pending} onPress={onPress} style={styles.target}>
    <View style={[styles.box, completed && styles.checked]}>{completed && <Check color={colors.onAccent} size={16} />}</View>
  </Pressable>;
}
const styles = StyleSheet.create({ target: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, justifyContent: 'center', alignItems: 'center' }, box: { width: spacing.xl, height: spacing.xl, borderWidth: 2, borderColor: colors.accent, borderRadius: radii.sm }, checked: { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' } });
