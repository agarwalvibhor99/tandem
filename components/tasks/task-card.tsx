import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AssigneeAvatar } from '@/components/tasks/assignee-avatar';
import { PriorityIndicator } from '@/components/tasks/priority-indicator';
import { TaskCheckbox } from '@/components/tasks/task-checkbox';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { dueDateLabel } from '@/lib/tasks/dates';
import type { Task } from '@/types/task';
export function TaskCard({ task, name, pending, onToggle }: { task: Task; name: string; pending: boolean; onToggle: () => void }) {
  return <View style={styles.card}>
    <TaskCheckbox title={task.title} completed={task.status === 'completed'} pending={pending} onPress={onToggle} />
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${task.title}`} onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })} style={styles.content}>
      <Text variant="heading" style={task.status === 'completed' ? styles.completed : undefined}>{task.title}</Text>
      <View style={styles.meta}><Text variant="caption" tone="secondary">{task.visibility === 'private' ? 'Private · Only you' : 'Shared'}</Text><Text variant="caption" tone="secondary">{dueDateLabel(task.due_at)}</Text></View>
      <View style={styles.meta}><AssigneeAvatar name={name} />{task.priority !== 'normal' && <PriorityIndicator priority={task.priority} />}</View>
      {pending && <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">Saving…</Text>}
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm }, content: { flex: 1, minHeight: layout.minTouchTarget, paddingVertical: spacing.sm, paddingRight: spacing.sm, gap: spacing.sm }, meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' }, completed: { textDecorationLine: 'line-through', color: colors.textSecondary } });
