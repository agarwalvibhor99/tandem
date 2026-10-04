import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { ReminderForm } from '@/components/reminders/reminder-form';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useReminder } from '@/hooks/use-reminders';
export default function EditReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminder = useReminder(id ?? '');
  return <Screen standalone title="Edit reminder" description="Keep the reminder useful and easy to follow.">
    {reminder.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading reminder" />}
    {reminder.isError && <><Notice error message="We couldn’t load this reminder." /><Button label="Try again" onPress={() => void reminder.refetch()} /></>}
    {reminder.isSuccess && !reminder.data && <Notice error message="This reminder is no longer available." />}
    {reminder.data && <ReminderForm reminder={reminder.data} />}
  </Screen>;
}
