import { TaskForm } from '@/components/tasks/task-form';
import { Screen } from '@/components/ui/screen';
export default function CreateTaskScreen() {
  return <Screen standalone title="Add a task" description="Get it out of your head and onto your list."><TaskForm /></Screen>;
}
