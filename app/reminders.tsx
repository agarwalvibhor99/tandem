import { router, useLocalSearchParams } from 'expo-router';
import { BellPlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ReminderCard } from '@/components/reminders/reminder-card';
import { CompactAction } from '@/components/ui/compact-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useReminderActions, useReminders } from '@/hooks/use-reminders';
import { cancelReminderNotifications, scheduleReminderNotifications } from '@/lib/reminders/notifications';
import type { ReminderVisibility } from '@/types/reminder';

export default function RemindersScreen() {
  const userId = useAuth().session?.user.id ?? '';
  const members = useCoupleMembers();
  const couple = useCurrentCouple();
  const connected = (members.data?.length ?? 0) > 1;
  const [view, setView] = useState<ReminderVisibility>('shared');
  const selectedView: ReminderVisibility = connected ? view : 'private';
  const reminders = useReminders(selectedView);
  const actions = useReminderActions();
  const params = useLocalSearchParams<{ notifications?: string }>();
  const nameFor = (id: string | null) => !id ? 'Anyone' : id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? 'Partner';
  const rows = reminders.query.data ?? [];
  const upcoming = rows.filter((reminder) => !reminder.completed);
  const completed = rows.filter((reminder) => reminder.completed);
  const pendingId = actions.complete.isPending ? actions.complete.variables?.reminder.id : undefined;
  const refreshing = members.isFetching || couple.isFetching || reminders.query.isFetching;
  const refresh = () => { void members.refetch(); void couple.refetch(); void reminders.query.refetch(); };
  return <Screen standalone title="Reminders" description="Small nudges for the things you want to remember." refreshing={refreshing} onRefresh={refresh}>
    <VisibilitySelector label="View" value={selectedView} sharedAvailable={connected} onChange={setView} />
    <CompactAction icon={BellPlus} label="New reminder" onPress={() => router.push({ pathname: '/reminder/new', params: { visibility: selectedView } })} disabled={selectedView === 'shared' && !connected} />
    {params.notifications === 'scheduled' && <Notice message="Reminder saved. This device will alert you at the chosen time." />}
    {params.notifications === 'denied' && <Notice message="Reminder saved, but notifications are off. Enable them in your device settings when you want alerts." />}
    {params.notifications === 'unavailable' && <Notice message="Reminder saved, but this device couldn’t schedule its alert. You can try again by editing the reminder." />}
    {params.notifications === 'unsupported' && <Notice message="Reminder saved. Local notifications are available in the native app, not in the browser." />}
    {params.notifications === 'past' && <Notice message="Reminder saved. Its date has passed, so no alert was scheduled." />}
    {params.notifications === 'limit' && <Notice message="Reminder saved. This device already has 100 Tandem alerts scheduled. Complete a reminder before scheduling another." />}
    {!connected && !members.isPending && !members.isError && <EmptyState title="Shared reminders come later" description="Personal reminders work on their own. Connect your partner when you’re ready to plan together." action={{ label: 'Connect your partner', onPress: () => router.push(couple.data ? '/invite-partner' : '/create-space') }} />}
    {reminders.query.isError && <ErrorState message="We couldn’t load your reminders." onRetry={() => void reminders.query.refetch()} />}
    {reminders.query.isPending && <LoadingState label="Loading reminders" />}
    {reminders.query.isSuccess && rows.length === 0 && <EmptyState title="Nothing here yet" description="Add a reminder for the next small thing you want Tandem to hold onto." action={{ label: 'Create reminder', onPress: () => router.push({ pathname: '/reminder/new', params: { visibility: selectedView } }) }} />}
    {upcoming.length > 0 && <Surface><Text variant="heading">Coming up</Text><View style={styles.rows}>{upcoming.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} assignee={nameFor(reminder.assigned_to)} pending={pendingId === reminder.id} onToggle={() => actions.complete.mutate({ reminder, completed: true }, { onSuccess: (saved) => { void cancelReminderNotifications(saved.id); } })} />)}</View></Surface>}
    {completed.length > 0 && <Surface><Text variant="heading">Completed</Text><View style={styles.rows}>{completed.map((reminder) => <ReminderCard key={reminder.id} reminder={reminder} assignee={nameFor(reminder.assigned_to)} pending={pendingId === reminder.id} onToggle={() => actions.complete.mutate({ reminder, completed: false }, { onSuccess: (saved) => { void scheduleReminderNotifications(saved, userId); } })} />)}</View></Surface>}
  </Screen>;
}

const styles = StyleSheet.create({ rows: { gap: spacing.sm } });
