import { useLocalSearchParams } from 'expo-router';
import { TaskForm } from '@/components/tasks/task-form';
import { Screen } from '@/components/ui/screen';
export default function CreateTaskScreen() {
  const { title, dueAt } = useLocalSearchParams<{ title?: string; dueAt?: string }>();
  return <Screen standalone title="Add a task" description="Capture the next thing, then add timing only if it helps."><TaskForm initialValues={{ title, dueAt }} /></Screen>;
}
