import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TimePicker } from '@/components/calendar/time-picker';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/ui/form-field';
import { GroupDivider, GroupedPanel, GroupRow } from '@/components/ui/grouped-rows';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { PersonSelector } from '@/components/ui/person-selector';
import { VisibilitySegment } from '@/components/ui/visibility-segment';
import { CalendarDays, Repeat, StickyNote } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useReminderActions } from '@/hooks/use-reminders';
import { scheduleReminderNotifications } from '@/lib/reminders/notifications';
import { reminderErrorMessage } from '@/lib/reminders/errors';
import { reminderSchema } from '@/lib/validation/reminder';
import { colors, layout, spacing } from '@/constants/theme';
import { reminderRecurrences, type Reminder, type ReminderInput, type ReminderVisibility } from '@/types/reminder';

type Values = ReminderInput;
function initialTime() { const value = new Date(); value.setMinutes(0, 0, 0); value.setHours(value.getHours() + 1); return value.toISOString(); }
function valuesFrom(reminder: Reminder): Values { return { couple_id: reminder.couple_id, assigned_to: reminder.assigned_to, title: reminder.title, notes: reminder.notes, remind_at: reminder.remind_at, visibility: reminder.visibility, recurrence: reminder.recurrence }; }
function reminderDateLabel(value: string) { return format(new Date(value), 'MMM d · h:mm a'); }
function recurrenceLabel(value: Values['recurrence']) { return value === 'none' ? 'No repeat' : value.charAt(0).toUpperCase() + value.slice(1); }
function onDate(value: string | null, current: string) { if (!value) return current; const selected = new Date(value); const next = new Date(current); next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate()); return next.toISOString(); }

export function ReminderForm({ reminder, initialVisibility }: { reminder?: Reminder; initialVisibility?: ReminderVisibility }) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const { create, update } = useReminderActions();
  const [baseline, setBaseline] = useState(reminder);
  const [timeOpen, setTimeOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(!!reminder?.notes);
  const defaultVisibility = reminder?.visibility ?? initialVisibility ?? 'private';
  const form = useForm<Values>({ resolver: zodResolver(reminderSchema), defaultValues: reminder ? valuesFrom(reminder) : { couple_id: defaultVisibility === 'shared' ? couple.data?.id ?? null : null, assigned_to: null, title: '', notes: '', remind_at: initialTime(), visibility: defaultVisibility, recurrence: 'none' } });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const title = useWatch({ control: form.control, name: 'title' });
  const remindAt = useWatch({ control: form.control, name: 'remind_at' });
  const recurrence = useWatch({ control: form.control, name: 'recurrence' });
  const busy = create.isPending || update.isPending;
  const connected = (members.data?.length ?? 0) > 1;
  useEffect(() => { if (visibility === 'shared' && couple.data?.id) form.setValue('couple_id', couple.data.id); if (visibility === 'private') { form.setValue('couple_id', null); form.setValue('assigned_to', null); } }, [couple.data?.id, form, visibility]);
  const changedElsewhere = !!baseline && !!reminder && baseline.updated_at !== reminder.updated_at;
  const submit = form.handleSubmit((values) => {
    const input: ReminderInput = { ...values, couple_id: values.visibility === 'shared' ? couple.data?.id ?? null : null, assigned_to: values.visibility === 'shared' ? values.assigned_to : null };
    if (baseline) update.mutate({ reminder: baseline, input }, { onSuccess: async (saved) => { const result = await scheduleReminderNotifications(saved, userId); router.replace({ pathname: '/reminders', params: { notifications: result } }); } });
    else create.mutate(input, { onSuccess: async (saved) => { const result = await scheduleReminderNotifications(saved, userId); router.replace({ pathname: '/reminders', params: { notifications: result } }); } });
  });
  if (couple.isPending || members.isPending) return <Text tone="secondary">Loading your reminder options…</Text>;
  return <View style={styles.form}>
    {changedElsewhere && <><Notice message="This reminder changed while you were editing. Load the latest version before saving." /><Button label="Load latest version" variant="secondary" onPress={() => { if (reminder) { setBaseline(reminder); form.reset(valuesFrom(reminder)); update.reset(); } }} /></>}
    <Controller control={form.control} name="title" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <View style={styles.hero}><HeroTextField ref={ref} accessibilityLabel="What should Tandem remember?" placeholder="What should Tandem remember?" value={value} onChangeText={onChange} onBlur={onBlur} editable={!busy} maxLength={160} autoCapitalize="sentences" returnKeyType="next" />{fieldState.error?.message && <Text variant="caption" style={styles.error}>{fieldState.error.message}</Text>}</View>} />
    <Controller control={form.control} name="visibility" render={({ field }) => <View style={styles.section}><Text variant="label">Who can see this?</Text><VisibilitySegment value={field.value} sharedAvailable={connected} disabled={busy} onChange={field.onChange} /><Text tone="secondary">{field.value === 'private' ? 'Only you can see this reminder.' : 'Both of you can see this reminder.'}</Text></View>} />
    {visibility === 'shared' && <Controller control={form.control} name="assigned_to" render={({ field }) => <PersonSelector label="Who’s doing this?" value={field.value} people={members.data ?? []} userId={userId} allowAnyone onChange={field.onChange} disabled={busy} />} />}
    <GroupedPanel>
      <GroupRow icon={CalendarDays} title="Remind me" value={reminderDateLabel(remindAt)} accessibilityLabel="Set reminder time" onPress={() => setTimeOpen((open) => !open)} />
      {timeOpen && <View style={styles.expanded}><Controller control={form.control} name="remind_at" render={({ field }) => <><DatePicker value={field.value} label="Date" prompt="When should it remind you?" allowClear={false} disabled={busy} onChange={(value) => field.onChange(onDate(value, field.value))} /><TimePicker label="Time" value={field.value} onChange={field.onChange} disabled={busy} /></>} /></View>}
      <GroupDivider />
      <GroupRow icon={Repeat} title="Repeat" value={recurrenceLabel(recurrence)} accessibilityLabel="Set repeat" onPress={() => setRepeatOpen((open) => !open)} />
      {repeatOpen && <View style={styles.expanded}><Controller control={form.control} name="recurrence" render={({ field }) => <ChoiceChips label="Repeat" value={field.value} options={reminderRecurrences.map((value) => ({ value, label: recurrenceLabel(value) }))} onChange={field.onChange} disabled={busy} />} /></View>}
      <GroupDivider />
      <GroupRow icon={StickyNote} title="Notes" value={notesOpen ? undefined : 'Add'} accessibilityLabel="Add notes" onPress={() => setNotesOpen((open) => !open)} />
      {notesOpen && <View style={styles.expanded}><Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes" placeholder="Add useful context" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={2000} editable={!busy} />} /></View>}
    </GroupedPanel>
    <Text variant="caption" tone="secondary">Tandem schedules one local alert for this device.</Text>
    {(create.error || update.error) && <Notice error message={reminderErrorMessage(create.error ?? update.error)} />}
    <Button label={reminder ? 'Save changes' : 'Save reminder'} loading={busy} disabled={changedElsewhere || !title?.trim()} onPress={() => void submit()} />
  </View>;
}

const styles = StyleSheet.create({ form: { gap: layout.fieldGap }, hero: { gap: spacing.sm }, section: { gap: spacing.sm }, expanded: { gap: spacing.lg, padding: spacing.lg, paddingTop: 0 }, error: { color: colors.error } });
