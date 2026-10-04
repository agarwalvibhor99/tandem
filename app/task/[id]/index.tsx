import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { AssigneeAvatar } from '@/components/tasks/assignee-avatar';
import { PriorityIndicator } from '@/components/tasks/priority-indicator';
import { TaskLoader } from '@/components/tasks/task-loader';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { usePendingCompletions, useTaskActions } from '@/hooks/use-tasks';
import { dueDateLabel } from '@/lib/tasks/dates';
import { taskErrorMessage } from '@/lib/tasks/errors';
import { projectTask } from '@/lib/tasks/optimistic';
import type { Task } from '@/types/task';

function TaskDetail({ task }: { task: Task }) {
  const userId = useAuth().session!.user.id;
  const members = useCoupleMembers();
  const pending = usePendingCompletions();
  const projected = projectTask(task, pending);
  const busy = pending.some((change) => change.task.id === task.id);
  const { complete, remove } = useTaskActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const name = task.assigned_to === userId ? 'You' : members.data?.find((member) => member.user_id === task.assigned_to)?.name ?? (task.assigned_to ? 'Partner' : 'Anyone');
  return <>
    <Surface>
      <Text variant="title" accessibilityRole="header">{task.title}</Text>
      <Text tone="secondary">{task.visibility === 'private' ? 'Private · Only you can see this' : 'Shared · Both of you can see this'}</Text>
      <AssigneeAvatar name={name} />
      <Text>{dueDateLabel(task.due_at)}</Text>
      <Text tone="secondary">{task.category}</Text>
      <PriorityIndicator priority={task.priority} />
      {!!task.description && <Text>{task.description}</Text>}
      <Text variant="label" tone="accent">{projected.status === 'completed' ? 'Completed' : 'Open'}</Text>
    </Surface>
    {complete.isError && <Notice error message={`${taskErrorMessage(complete.error)} Your change was undone.`} />}
    <Button label={projected.status === 'completed' ? 'Reopen task' : 'Complete task'} loading={busy} disabled={remove.isPending} onPress={() => complete.mutate({ task, status: projected.status === 'completed' ? 'open' : 'completed' })} />
    <Button label="Edit task" variant="secondary" disabled={busy || remove.isPending} onPress={() => router.push({ pathname: '/task/[id]/edit', params: { id: task.id } })} />
    {remove.isError && <Notice error message={taskErrorMessage(remove.error)} />}
    {confirmDelete ? <Surface>
      <Text variant="heading">Delete this task?</Text>
      <Text tone="secondary">{task.visibility === 'shared' ? 'It will be removed for both of you. This can’t be undone.' : 'This can’t be undone.'}</Text>
      <Button label="Yes, delete task" loading={remove.isPending} disabled={busy} onPress={() => remove.mutate(task, { onSuccess: () => router.replace('/tasks') })} />
      <Button label="Keep task" variant="secondary" disabled={remove.isPending} onPress={() => setConfirmDelete(false)} />
    </Surface> : <Button label="Delete task" variant="secondary" disabled={busy} onPress={() => setConfirmDelete(true)} />}
  </>;
}
export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen standalone title="Task" description="The details, all in one place."><TaskLoader id={id}>{(task) => <TaskDetail task={task} />}</TaskLoader></Screen>;
}
