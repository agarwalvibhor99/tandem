import { format } from 'date-fns';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { TaskCheckbox } from '@/components/tasks/task-checkbox';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import type { Reminder } from '@/types/reminder';

const repeatLabel = (value: Reminder['recurrence']) => value === 'none' ? 'Once' : value.charAt(0).toUpperCase() + value.slice(1);
export function ReminderCard({ reminder, assignee, pending, onToggle }: { reminder: Reminder; assignee: string; pending: boolean; onToggle: () => void }) {
  return <View style={styles.card}>
    <TaskCheckbox title={reminder.title} completed={reminder.completed} pending={pending} onPress={onToggle} />
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${reminder.title}`} onPress={() => router.push({ pathname: '/reminder/[id]/edit', params: { id: reminder.id } })} style={styles.content}>
      <Text variant="heading" style={reminder.completed ? styles.completed : undefined}>{reminder.title}</Text>
      <View style={styles.meta}><Text variant="caption" tone="secondary">{format(new Date(reminder.remind_at), 'MMM d · h:mm a')}</Text><Text variant="caption" tone="secondary">{repeatLabel(reminder.recurrence)}</Text></View>
      <View style={styles.meta}><Text variant="caption" tone="secondary">{reminder.visibility === 'private' ? 'Personal' : 'Shared'}</Text>{reminder.visibility === 'shared' && <Text variant="caption" tone="secondary">{assignee === 'Anyone' ? 'Anyone' : `For ${assignee}`}</Text>}</View>
      {pending && <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">Saving…</Text>}
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm }, content: { flex: 1, minHeight: layout.minTouchTarget, paddingVertical: spacing.sm, paddingRight: spacing.sm, gap: spacing.sm }, meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' }, completed: { textDecorationLine: 'line-through', color: colors.textSecondary } });
