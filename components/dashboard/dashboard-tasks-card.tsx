import { CircleCheck, Clock3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { TaskCard } from '@/components/tasks/task-card';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { colors, spacing } from '@/constants/theme';
import type { Task } from '@/types/task';

type Props = { section: 'today' | 'upcoming'; tasks: Task[]; nextTasks?: Task[]; loading: boolean; error: boolean; pendingIds: Set<string>; nameFor: (id: string | null) => string; onComplete: (task: Task) => void; onRetry: () => void };
export function DashboardTasksCard({ section, tasks, nextTasks = [], loading, error, pendingIds, nameFor, onComplete, onRetry }: Props) {
  const today = section === 'today';
  const nextTask = nextTasks[0];
  return <DashboardCard title={today ? 'Today’s tasks' : 'Upcoming tasks'} subtitle={today ? 'Start here. Overdue tasks are included.' : 'Later plans and tasks without a due date.'} icon={today ? CircleCheck : Clock3} compact={!today}>
    {error && <Notice error message="We couldn’t refresh these tasks. Any saved items may be out of date." />}
    {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel={today ? 'Loading today’s tasks' : 'Loading upcoming tasks'} /> : tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} name={nameFor(task.assigned_to)} pending={pendingIds.has(task.id)} onToggle={() => onComplete(task)} />) : !error && <>
      <Text variant={today ? "title" : "heading"}>{today ? 'Nothing due today' : 'Room for what’s next'}</Text>
      <Text tone="secondary">{today ? nextTask ? 'You’re clear for today. Here’s what’s coming up next.' : 'You’re clear for today. Add something when it needs doing, or enjoy the space.' : 'Add a task for later, with or without a due date.'}</Text>
      {today && nextTask ? <View style={styles.next}>
        <Text variant="label" tone="secondary">Next up</Text>
        <TaskCard task={nextTask} name={nameFor(nextTask.assigned_to)} pending={pendingIds.has(nextTask.id)} onToggle={() => onComplete(nextTask)} />
      </View> : null}
    </>}
    {error ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : !loading && <Button label={tasks.length ? today ? 'View today’s tasks' : 'View upcoming tasks' : today && !!nextTask ? 'View what’s next' : 'Add a task'} variant="secondary" onPress={() => tasks.length ? router.push({ pathname: '/tasks', params: { filter: today ? 'Today' : 'Upcoming' } }) : today && nextTask ? router.push({ pathname: '/tasks', params: { filter: 'Upcoming' } }) : router.push('/task/new')} />}
  </DashboardCard>;
}

const styles = StyleSheet.create({ next: { gap: spacing.sm } });
