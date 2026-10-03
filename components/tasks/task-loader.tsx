import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { colors } from '@/constants/theme';
import { useTask } from '@/hooks/use-tasks';
import type { Task } from '@/types/task';
export function TaskLoader({ id, children }: { id: string; children: (task: Task) => ReactNode }) {
  const query = useTask(id);
  if (query.isPending) return <ActivityIndicator color={colors.accent} accessibilityLabel="Loading task" />;
  if (query.isError) return <><Notice error message="We couldn’t load this task. Check your connection and try again." /><Button label="Try again" onPress={() => void query.refetch()} /><Button variant="secondary" label="Back to tasks" onPress={() => router.replace('/tasks')} /></>;
  if (!query.data) return <><Notice message="This task is no longer available to you. It may have been deleted or made private." /><Button label="Back to tasks" onPress={() => router.replace('/tasks')} /></>;
  return children(query.data);
}
