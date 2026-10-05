import { format } from 'date-fns';
import { router } from 'expo-router';
import { CheckableCard, CheckableCardMeta } from '@/components/checkable-card';
import { Text } from '@/components/ui/text';
import type { Reminder } from '@/types/reminder';

const repeatLabel = (value: Reminder['recurrence']) => value === 'none' ? 'Once' : value.charAt(0).toUpperCase() + value.slice(1);
export function ReminderCard({ reminder, assignee, pending, onToggle }: { reminder: Reminder; assignee: string; pending: boolean; onToggle: () => void }) {
  return <CheckableCard title={reminder.title} completed={reminder.completed} pending={pending} onToggle={onToggle} openLabel={`Edit ${reminder.title}`} onOpen={() => router.push({ pathname: '/reminder/[id]/edit', params: { id: reminder.id } })}>
    <CheckableCardMeta><Text variant="caption" tone="secondary">{format(new Date(reminder.remind_at), 'MMM d · h:mm a')}</Text><Text variant="caption" tone="secondary">{repeatLabel(reminder.recurrence)}</Text></CheckableCardMeta>
    <CheckableCardMeta><Text variant="caption" tone="secondary">{reminder.visibility === 'private' ? 'Personal' : 'Shared'}</Text>{reminder.visibility === 'shared' && <Text variant="caption" tone="secondary">{assignee === 'Anyone' ? 'Anyone' : `For ${assignee}`}</Text>}</CheckableCardMeta>
  </CheckableCard>;
}
