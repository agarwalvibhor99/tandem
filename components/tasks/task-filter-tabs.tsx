import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { taskFilters, type TaskFilter } from '@/types/task';
export function TaskFilterTabs({ value, onChange }: { value: TaskFilter; onChange: (filter: TaskFilter) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityLabel="Task filters">
    {taskFilters.map((filter) => <Pressable key={filter} accessibilityRole="tab" aria-selected={filter === value} accessibilityState={{ selected: filter === value }} onPress={() => onChange(filter)} style={[styles.tab, value === filter && styles.selected]}>
      <Text variant="label" tone={value === filter ? 'inverse' : 'secondary'}>{filter}</Text>
    </Pressable>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ row: { gap: spacing.sm }, tab: { borderRadius: radii.pill, minHeight: layout.minTouchTarget, paddingHorizontal: spacing.lg, justifyContent: 'center', backgroundColor: colors.surfaceMuted }, selected: { backgroundColor: colors.accent } });
