import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ReminderForm } from '@/components/reminders/reminder-form';
import { ActionPanel } from '@/components/ui/action-panel';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useReminder, useReminderActions } from '@/hooks/use-reminders';
import { reminderErrorMessage } from '@/lib/reminders/errors';
import { cancelReminderNotifications } from '@/lib/reminders/notifications';
import { Text } from '@/components/ui/text';
export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminder = useReminder(id ?? '');
  const { remove } = useReminderActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteReminder = () => { if (reminder.data) remove.mutate(reminder.data, { onSuccess: (async () => { if (reminder.data?.id) await cancelReminderNotifications(reminder.data.id); router.replace('/reminders'); }) }); };
  return <Screen standalone title="Edit reminder" description="Keep the reminder useful and easy to follow.">
    {reminder.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading reminder" />}
    {reminder.isError && <><Notice error message="We couldn’t load this reminder." /><Button label="Try again" onPress={() => void reminder.refetch()} /></>}
    {reminder.isSuccess && !reminder.data && <Notice error message="This reminder is no longer available." />}
    {reminder.data && <>
      <ReminderForm reminder={reminder.data} />
      <ActionPanel description={reminder.data.visibility === 'shared' ? 'Edit this shared reminder or remove it for both of you.' : 'Edit or remove this personal reminder.'}>
        {remove.error && <Notice error message={reminderErrorMessage(remove.error)} />}
        {confirmDelete ? <>
          <Text variant="label">Delete this reminder?</Text>
          <Text tone="secondary">{reminder.data.visibility === 'shared' ? 'It will be removed for both of you. This can’t be undone.' : 'This can’t be undone.'}</Text>
          <Button label="Yes, delete reminder" variant="danger" loading={remove.isPending} onPress={deleteReminder} />
          <Button label="Keep reminder" variant="secondary" disabled={remove.isPending} onPress={() => setConfirmDelete(false)} />
        </> : <Button label="Delete reminder" variant="secondary" disabled={remove.isPending} onPress={() => setConfirmDelete(true)} />}
      </ActionPanel>
    </>}
  </Screen>;
}
