import { useLocalSearchParams } from 'expo-router';
import { TaskForm } from '@/components/tasks/task-form';
import { TaskLoader } from '@/components/tasks/task-loader';
import { Screen } from '@/components/ui/screen';
export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Screen standalone title="Edit task" description="A small adjustment to the plan."><TaskLoader id={id}>{(task) => <TaskForm key={task.id} task={task} />}</TaskLoader></Screen>;
}
