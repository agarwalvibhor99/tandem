import { useLocalSearchParams } from 'expo-router';
import { ReminderForm } from '@/components/reminders/reminder-form';
import { Screen } from '@/components/ui/screen';
export default function NewReminderScreen() {
  const { visibility, title, remindAt } = useLocalSearchParams<{ visibility?: string; title?: string; remindAt?: string }>();
  const initialVisibility = visibility === 'shared' || visibility === 'private' ? visibility : undefined;
  return <Screen standalone title="Create a reminder" description="Keep the timing simple, and let Tandem remember."><ReminderForm initialVisibility={initialVisibility} initialValues={{ title, remindAt }} /></Screen>;
}
