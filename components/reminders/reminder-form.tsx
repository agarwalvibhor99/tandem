import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TimePicker } from '@/components/calendar/time-picker';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { PersonSelector } from '@/components/ui/person-selector';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useReminderActions } from '@/hooks/use-reminders';
import { scheduleReminderNotifications } from '@/lib/reminders/notifications';
import { reminderErrorMessage } from '@/lib/reminders/errors';
import { reminderSchema } from '@/lib/validation/reminder';
import { reminderRecurrences, type Reminder, type ReminderInput, type ReminderVisibility } from '@/types/reminder';

type Values = ReminderInput;
function initialTime() { const value = new Date(); value.setMinutes(0, 0, 0); value.setHours(value.getHours() + 1); return value.toISOString(); }
function valuesFrom(reminder: Reminder): Values { return { couple_id: reminder.couple_id, assigned_to: reminder.assigned_to, title: reminder.title, notes: reminder.notes, remind_at: reminder.remind_at, visibility: reminder.visibility, recurrence: reminder.recurrence }; }

export function ReminderForm({ reminder, initialVisibility }: { reminder?: Reminder; initialVisibility?: ReminderVisibility }) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const { create, update } = useReminderActions();
  const [baseline, setBaseline] = useState(reminder);
  const defaultVisibility = reminder?.visibility ?? initialVisibility ?? 'private';
  const form = useForm<Values>({ resolver: zodResolver(reminderSchema), defaultValues: reminder ? valuesFrom(reminder) : { couple_id: defaultVisibility === 'shared' ? couple.data?.id ?? null : null, assigned_to: null, title: '', notes: '', remind_at: initialTime(), visibility: defaultVisibility, recurrence: 'none' } });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
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
  return <>
    {changedElsewhere && <><Notice message="This reminder changed while you were editing. Load the latest version before saving." /><Button label="Load latest version" variant="secondary" onPress={() => { if (reminder) { setBaseline(reminder); form.reset(valuesFrom(reminder)); update.reset(); } }} /></>}
    <Controller control={form.control} name="title" render={({ field, fieldState }) => <FormField label="What should Tandem remind you about?" placeholder="e.g. Take out the bins" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={160} editable={!busy} />} />
    <Controller control={form.control} name="visibility" render={({ field }) => <VisibilitySelector value={field.value} sharedAvailable={connected} onChange={field.onChange} disabled={busy} privateHint="Only you can see this reminder." sharedHint="Both of you can see this reminder." />} />
    {visibility === 'shared' && <Controller control={form.control} name="assigned_to" render={({ field }) => <PersonSelector label="Who’s doing this?" value={field.value} people={members.data ?? []} userId={userId} allowAnyone onChange={field.onChange} disabled={busy} />} />}
    <Controller control={form.control} name="remind_at" render={({ field }) => <><DatePicker value={field.value} label="Reminder date" prompt="When should it remind you?" allowClear={false} disabled={busy} onChange={(value) => { if (value) { const next = new Date(field.value); const day = new Date(value); next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate()); field.onChange(next.toISOString()); } }} /><TimePicker label="Reminder time" value={field.value} onChange={field.onChange} disabled={busy} /></>} />
    <Controller control={form.control} name="recurrence" render={({ field }) => <ChoiceChips label="Repeat" value={field.value} options={reminderRecurrences.map((value) => ({ value, label: value === 'none' ? 'None' : value.charAt(0).toUpperCase() + value.slice(1) }))} onChange={field.onChange} disabled={busy} />} />
    <Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes (optional)" placeholder="Add useful context" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={2000} editable={!busy} />} />
    <Text variant="caption" tone="secondary">Tandem schedules one local alert for this device. Repeating reminders use the same time each day, week, or month.</Text>
    {(create.error || update.error) && <Notice error message={reminderErrorMessage(create.error ?? update.error)} />}
    <Button label={reminder ? 'Save changes' : 'Save reminder'} loading={busy} disabled={changedElsewhere} onPress={() => void submit()} />
  </>;
}
