import { router } from 'expo-router';
import { CheckableCard, CheckableCardMeta } from '@/components/checkable-card';
import { AssigneeAvatar } from '@/components/tasks/assignee-avatar';
import { PriorityIndicator } from '@/components/tasks/priority-indicator';
import { Text } from '@/components/ui/text';
import { dueDateLabel } from '@/lib/tasks/dates';
import type { Task } from '@/types/task';
export function TaskCard({ task, name, pending, onToggle }: { task: Task; name: string; pending: boolean; onToggle: () => void }) {
  return <CheckableCard title={task.title} completed={task.status === 'completed'} pending={pending} onToggle={onToggle} openLabel={`Open ${task.title}`} onOpen={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}>
    <CheckableCardMeta><Text variant="caption" tone="secondary">{task.visibility === 'private' ? 'Personal · Only you' : 'Shared'}</Text><Text variant="caption" tone="secondary">{dueDateLabel(task.due_at)}</Text></CheckableCardMeta>
    <CheckableCardMeta><AssigneeAvatar name={name} />{task.priority !== 'normal' && <PriorityIndicator priority={task.priority} />}</CheckableCardMeta>
  </CheckableCard>;
}
