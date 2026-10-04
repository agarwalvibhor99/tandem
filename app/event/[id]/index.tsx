import { format, isSameDay } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform } from 'react-native';
import { Button } from '@/components/ui/button';
import { ActionPanel } from '@/components/ui/action-panel';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarActions, useCalendarEvent } from '@/hooks/use-calendar';
import { calendarErrorMessage } from '@/lib/calendar/errors';
import { calendarReminderLabel, cancelCalendarEventNotifications } from '@/lib/calendar/notifications';
export default function EventDetailScreen() {
  const { id, notification } = useLocalSearchParams<{ id: string; notification?: string }>();
  const event = useCalendarEvent(id ?? '');
  const userId = useAuth().session?.user.id;
  const { remove } = useCalendarActions();
  const [confirming, setConfirming] = useState(false);
  const deleting = () => { if (event.data) remove.mutate(event.data, { onSuccess: async () => { if (event.data?.id) await cancelCalendarEventNotifications(event.data.id); router.replace('/calendar'); } }); };
  const requestDelete = () => { if (Platform.OS === 'web') setConfirming(true); else Alert.alert('Delete event?', 'This removes it from the calendar.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: deleting }]); };
  return <Screen standalone title={event.data?.title ?? 'Event'} description={event.data?.visibility === 'shared' ? 'Shared plan' : 'Only you can see the details'}>

    {notification === 'scheduled' && <Notice message="Event saved. This device will alert you at the selected time." />}
    {notification === 'denied' && <Notice message="Event saved, but notifications are off. Enable them in your device settings when you want alerts." />}
    {notification === 'unsupported' && <Notice message="Event saved. Local alerts are available in the native app, not in the browser." />}
    {notification === 'past' && <Notice message="Event saved. The reminder time has already passed, so no alert was scheduled." />}
    {notification === 'limit' && <Notice message="Event saved. This device already has many Tandem alerts scheduled. Remove an old alert before adding more." />}
    {notification === 'unavailable' && <Notice message="Event saved, but this device couldn’t schedule its alert. You can try again by editing the event." />}
    {event.isPending && <ActivityIndicator color={colors.accent} />}
    {event.isError && <Notice error message="We couldn’t load this event." />}
    {event.isSuccess && !event.data && <Surface><Text variant="heading">Event unavailable</Text><Text tone="secondary">It may have been removed, or you may no longer have access.</Text></Surface>}
    {event.data && <><Surface><Text variant="heading">{format(new Date(event.data.start_at), 'EEEE, MMMM d')}</Text><Text>{format(new Date(event.data.start_at), 'h:mm a')}–{isSameDay(new Date(event.data.start_at), new Date(event.data.end_at)) ? format(new Date(event.data.end_at), 'h:mm a') : format(new Date(event.data.end_at), 'MMM d, h:mm a')}</Text><Text tone="secondary">{event.data.visibility === 'shared' ? 'Both of you can see this event.' : 'Your partner sees only “Busy”.'}</Text><Text tone="secondary">Alert: {calendarReminderLabel(event.data.reminder_offset_minutes)}</Text>{!!event.data.location && <Text>{event.data.location}</Text>}{!!event.data.notes && <Text>{event.data.notes}</Text>}</Surface>
      {event.data.owner_id === userId && <ActionPanel description="Edit this plan or remove it from your calendar."><Button label="Edit event" onPress={() => router.push({ pathname: '/event/[id]/edit', params: { id: event.data!.id } })} />{remove.error && <Notice error message={calendarErrorMessage(remove.error)} />}{confirming ? <><Text variant="label">Delete this event?</Text><Text tone="secondary">This removes it from your calendar. This can’t be undone.</Text><Button label="Yes, delete event" variant="danger" loading={remove.isPending} onPress={deleting} /><Button label="Keep event" variant="secondary" onPress={() => setConfirming(false)} /></> : <Button label="Delete event" variant="secondary" onPress={requestDelete} />}</ActionPanel>}
    </>}
  </Screen>;
}
