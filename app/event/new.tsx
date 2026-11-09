import { useLocalSearchParams } from 'expo-router';
import { EventForm } from '@/components/calendar/event-form';
import { Screen } from '@/components/ui/screen';
export default function NewEventScreen() {
  const { title, startAt } = useLocalSearchParams<{ title?: string; startAt?: string }>();
  return <Screen standalone title="Add an event" description="Set a time and choose who sees it."><EventForm initialValues={{ title, startAt }} /></Screen>;
}
