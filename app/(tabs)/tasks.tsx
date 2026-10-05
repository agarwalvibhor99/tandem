import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CompletionNotice } from '@/components/tasks/completion-notice';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskFilterTabs } from '@/components/tasks/task-filter-tabs';
import { Button } from '@/components/ui/button';
import { CompactAction } from '@/components/ui/compact-action';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { spacing } from '@/constants/theme';
import { Plus } from 'lucide-react-native';
import { useScreenFocus } from '@/hooks/use-screen-focus';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { usePendingCompletions, useTaskActions, useTaskClock, useTasks } from '@/hooks/use-tasks';
import { projectTaskList } from '@/lib/tasks/optimistic';
import { useTaskSync } from '@/providers/task-sync-provider';
import { taskFilters, type TaskFilter } from '@/types/task';

const explanations: Record<TaskFilter, string> = {
  Today: 'Due today and anything overdue.', Upcoming: 'Later plans and tasks with no due date.', Mine: 'Your private tasks and shared tasks assigned to you.',
  Partner: 'Shared tasks your partner is responsible for.', Shared: 'Open tasks both of you can see.', Completed: 'The things you’ve taken care of.',
};
export default function TasksScreen() {
  const { filter: requestedFilter } = useLocalSearchParams<{ filter?: string }>();
  const filter = taskFilters.find((value) => value === requestedFilter) ?? 'Today';
  const setFilter = (value: TaskFilter) => router.setParams({ filter: value });
  const focused = useScreenFocus();
  const { tomorrow } = useTaskClock();
  const userId = useAuth().session!.user.id;
  const tasks = useTasks(filter, tomorrow, focused);
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const pending = usePendingCompletions();
  const { complete } = useTaskActions();
  const healthy = useTaskSync();
  const rows = projectTaskList(tasks.data?.pages.flat() ?? [], pending, filter, userId, tomorrow);
  const pendingIds = new Set(pending.map(({ task }) => task.id));
  return <Screen title="Tasks" description="A little less on your mind. One thing at a time." refreshing={tasks.isFetching && !tasks.isFetchingNextPage} onRefresh={() => void tasks.refetch()}>
    <CompactAction icon={Plus} label="New task" onPress={() => router.push('/task/new')} />
    <TaskFilterTabs value={filter} onChange={setFilter} />
    <Text tone="secondary">{explanations[filter]}</Text>
    {!healthy && <Text variant="caption" tone="secondary">Live updates are reconnecting. Your list also refreshes periodically.</Text>}
    {tasks.isError && <Notice error message="We couldn’t refresh your tasks. Any saved list below may be out of date." />}
    <CompletionNotice />
    {tasks.isPending ? <LoadingState label="Loading tasks" /> : <>
      <View style={styles.list}>{rows.map((task) => <TaskCard key={task.id} task={task} pending={pendingIds.has(task.id)} name={task.assigned_to === userId ? 'You' : members.data?.find((member) => member.user_id === task.assigned_to)?.name ?? (task.assigned_to ? 'Partner' : 'Anyone')} onToggle={() => complete.mutate({ task, status: task.status === 'completed' ? 'open' : 'completed' })} />)}</View>
      {!rows.length && !tasks.isError && <EmptyState
        title={filter === 'Completed' ? 'Room for small wins' : filter === 'Partner' ? 'Nothing on their plate' : 'Nothing on your plate'}
        description={filter === 'Today' ? 'No tasks due right now. Add something to take care of, or check Upcoming.' : filter === 'Completed' ? 'Completed tasks will appear here. You can reopen them anytime.' : 'Add a task when something needs doing.'}
        action={filter === 'Partner' && (members.data?.length ?? 0) < 2 ? { label: couple.data ? 'Invite your partner' : 'Connect your partner', onPress: () => router.push(couple.data ? '/invite-partner' : '/create-space') } : undefined}
      />}
    </>}
    {tasks.hasNextPage && <Button label="Load more" variant="quiet" loading={tasks.isFetchingNextPage} onPress={() => void tasks.fetchNextPage()} />}
  </Screen>;
}
const styles = StyleSheet.create({ list: { gap: spacing.md } });
