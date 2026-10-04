import { format, isSameDay } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarActions, useCalendarEvent } from '@/hooks/use-calendar';
import { calendarErrorMessage } from '@/lib/calendar/errors';
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useCalendarEvent(id ?? '');
  const userId = useAuth().session?.user.id;
  const { remove } = useCalendarActions();
  const [confirming, setConfirming] = useState(false);
  const deleting = () => { if (event.data) remove.mutate(event.data, { onSuccess: () => router.replace('/calendar') }); };
  const requestDelete = () => { if (Platform.OS === 'web') setConfirming(true); else Alert.alert('Delete event?', 'This removes it from the calendar.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: deleting }]); };
  return <Screen standalone title={event.data?.title ?? 'Event'} description={event.data?.visibility === 'shared' ? 'Shared plan' : 'Only you can see the details'}>
    {event.isPending && <ActivityIndicator color={colors.accent} />}
    {event.isError && <Notice error message="We couldn’t load this event." />}
    {event.isSuccess && !event.data && <Surface><Text variant="heading">Event unavailable</Text><Text tone="secondary">It may have been removed, or you may no longer have access.</Text></Surface>}
    {event.data && <><Surface><Text variant="heading">{format(new Date(event.data.start_at), 'EEEE, MMMM d')}</Text><Text>{format(new Date(event.data.start_at), 'h:mm a')}–{isSameDay(new Date(event.data.start_at), new Date(event.data.end_at)) ? format(new Date(event.data.end_at), 'h:mm a') : format(new Date(event.data.end_at), 'MMM d, h:mm a')}</Text><Text tone="secondary">{event.data.visibility === 'shared' ? 'Both of you can see this event.' : 'Your partner sees only “Busy”.'}</Text>{!!event.data.location && <Text>{event.data.location}</Text>}{!!event.data.notes && <Text>{event.data.notes}</Text>}</Surface>
      {event.data.owner_id === userId && <><Button label="Edit event" onPress={() => router.push({ pathname: '/event/[id]/edit', params: { id: event.data!.id } })} />{remove.error && <Notice error message={calendarErrorMessage(remove.error)} />}{confirming ? <><Text>Delete this event?</Text><Button label="Yes, delete event" loading={remove.isPending} onPress={deleting} /><Button label="Keep event" variant="secondary" onPress={() => setConfirming(false)} /></> : <Button label="Delete event" variant="secondary" onPress={requestDelete} />}</>}
    </>}
  </Screen>;
}
