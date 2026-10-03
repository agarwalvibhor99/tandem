import { CircleCheck, Clock3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { TaskCard } from '@/components/tasks/task-card';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { Task } from '@/types/task';

type Props = { section: 'today' | 'upcoming'; tasks: Task[]; loading: boolean; error: boolean; pendingIds: Set<string>; nameFor: (id: string | null) => string; onComplete: (task: Task) => void; onRetry: () => void };
export function DashboardTasksCard({ section, tasks, loading, error, pendingIds, nameFor, onComplete, onRetry }: Props) {
  const today = section === 'today';
  return <DashboardCard title={today ? 'Today’s tasks' : 'Upcoming tasks'} subtitle={today ? 'Start here. Overdue tasks are included.' : 'Later plans and tasks without a due date.'} icon={today ? CircleCheck : Clock3} compact={!today}>
    {error && <Notice error message="We couldn’t refresh these tasks. Any saved items may be out of date." />}
    {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel={today ? 'Loading today’s tasks' : 'Loading upcoming tasks'} /> : tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} name={nameFor(task.assigned_to)} pending={pendingIds.has(task.id)} onToggle={() => onComplete(task)} />) : !error && <>
      <Text variant={today ? "title" : "heading"}>{today ? 'A little breathing room' : 'Room for what’s next'}</Text>
      <Text tone="secondary">{today ? 'Nothing due today. Add a task when something needs doing, or enjoy the clear space.' : 'Add a task for later, with or without a due date.'}</Text>
    </>}
    {error ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : !loading && <Button label={tasks.length ? today ? 'View today’s tasks' : 'View upcoming tasks' : 'Add a task'} variant="secondary" onPress={() => tasks.length ? router.push({ pathname: '/tasks', params: { filter: today ? 'Today' : 'Upcoming' } }) : router.push('/task/new')} />}
  </DashboardCard>;
}
