import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { EventForm } from '@/components/calendar/event-form';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarEvent } from '@/hooks/use-calendar';
import { colors } from '@/constants/theme';
export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useCalendarEvent(id ?? '');
  const userId = useAuth().session?.user.id;
  return <Screen standalone title="Edit event" description="Keep your plans up to date.">
    {event.isPending && <ActivityIndicator color={colors.accent} />}
    {event.isError && <Notice error message="We couldn’t load this event." />}
    {event.data && event.data.owner_id === userId && <EventForm event={event.data} />}
    {event.isSuccess && (!event.data || event.data.owner_id !== userId) && <Notice error message="Only the person who added this event can edit it." />}
  </Screen>;
}
