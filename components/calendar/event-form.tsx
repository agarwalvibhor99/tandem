import { zodResolver } from '@hookform/resolvers/zod';
import { addHours, format } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TimePicker } from '@/components/calendar/time-picker';
import { CalendarDays, Bell, Clock3, MapPin } from 'lucide-react-native';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Button } from '@/components/ui/button';
import { GroupDivider, GroupedPanel, GroupRow } from '@/components/ui/grouped-rows';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { VisibilitySegment } from '@/components/ui/visibility-segment';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarActions, useCalendarWindow } from '@/hooks/use-calendar';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { calendarConflictMessage, findCalendarConflicts } from '@/lib/calendar/conflicts';
import { calendarErrorMessage } from '@/lib/calendar/errors';
import { calendarReminderLabel, scheduleCalendarEventNotification } from '@/lib/calendar/notifications';
import { calendarReminderOffsets, createCalendarEventSchema } from '@/lib/validation/calendar';
import { colors, layout, spacing } from '@/constants/theme';
import type { CalendarEvent, CalendarEventInput } from '@/types/calendar';

function initialStart() { const date = new Date(); date.setMinutes(0, 0, 0); return addHours(date, 1); }
function valuesFrom(event: CalendarEvent): CalendarEventInput { return { couple_id: event.couple_id, title: event.title, start_at: event.start_at, end_at: event.end_at, visibility: event.visibility, location: event.location, notes: event.notes, reminder_offset_minutes: event.reminder_offset_minutes }; }
function eventDateLabel(value: string) { return format(new Date(value), 'MMM d · h:mm a'); }
function onDate(value: string | null, current: string) {
  if (!value) return current;
  const selected = new Date(value);
  const next = new Date(current);
  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  return next.toISOString();
}
export function EventForm({ event }: { event?: CalendarEvent }) {
  const userId = useAuth().session?.user.id;
  const couple = useCurrentCouple();
  const { create, edit } = useCalendarActions();
  const [baseline, setBaseline] = useState(event);
  const [expanded, setExpanded] = useState(!!event?.location || !!event?.notes);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const start = initialStart();
  const form = useForm<CalendarEventInput>({ resolver: zodResolver(createCalendarEventSchema()), defaultValues: event ? valuesFrom(event) : { couple_id: null, title: '', start_at: start.toISOString(), end_at: addHours(start, 1).toISOString(), visibility: 'private', location: '', notes: '', reminder_offset_minutes: null } });
  const startAt = useWatch({ control: form.control, name: 'start_at' });
  const endAt = useWatch({ control: form.control, name: 'end_at' });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const title = useWatch({ control: form.control, name: 'title' });
  const reminderOffset = useWatch({ control: form.control, name: 'reminder_offset_minutes' });
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  const canCheckConflicts = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  const conflictWindow = useCalendarWindow(canCheckConflicts ? new Date(startMs) : new Date(), canCheckConflicts ? new Date(endMs) : addHours(new Date(), 1), canCheckConflicts);
  const busy = create.isPending || edit.isPending;
  const changedElsewhere = !!baseline && !!event && baseline.updated_at !== event.updated_at;
  const conflicts = canCheckConflicts && userId ? findCalendarConflicts({ start_at: startAt, end_at: endAt, visibility }, conflictWindow.data ?? [], userId, event?.id) : [];
  const conflictMessage = calendarConflictMessage(conflicts);
  const updateStart = (iso: string) => {
    setConflictError(null);
    form.setValue('start_at', iso, { shouldValidate: true });
    if (Date.parse(form.getValues('end_at')) <= Date.parse(iso)) form.setValue('end_at', addHours(new Date(iso), 1).toISOString(), { shouldValidate: true });
  };
  const submit = form.handleSubmit((input) => {
    const nextConflicts = userId ? findCalendarConflicts(input, conflictWindow.data ?? [], userId, event?.id) : [];
    const nextConflictMessage = calendarConflictMessage(nextConflicts);
    if (nextConflictMessage) {
      setConflictError(nextConflictMessage);
      return;
    }
    setConflictError(null);
    if (baseline) edit.mutate({ event: baseline, input }, { onSuccess: async (saved) => { const notification = userId ? await scheduleCalendarEventNotification(saved, userId) : 'none'; router.replace({ pathname: '/event/[id]', params: { id: saved.id, notification } }); } });
    else create.mutate(input, { onSuccess: async (saved) => { const notification = userId ? await scheduleCalendarEventNotification(saved, userId) : 'none'; router.replace({ pathname: '/event/[id]', params: { id: saved.id, notification } }); } });
  });
  return <View style={styles.form}>
    {changedElsewhere && <><Notice message="This event changed while you were editing. Load the latest version before saving." /><Button label="Load latest version" variant="secondary" onPress={() => { if (event) { setBaseline(event); form.reset(valuesFrom(event)); edit.reset(); } }} /></>}
    <Controller control={form.control} name="title" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <View style={styles.hero}><HeroTextField ref={ref} accessibilityLabel="What’s happening?" placeholder="What’s happening?" value={value} onChangeText={onChange} onBlur={onBlur} editable={!busy} maxLength={160} autoCapitalize="sentences" returnKeyType="next" />{fieldState.error?.message && <Text variant="caption" style={styles.error}>{fieldState.error.message}</Text>}</View>} />
    <Controller control={form.control} name="visibility" render={({ field }) => <View style={styles.section}><Text variant="label">Who can see this?</Text><VisibilitySegment value={field.value} sharedAvailable={!!couple.data} disabled={busy} onChange={(value) => { form.setValue('couple_id', value === 'shared' ? couple.data?.id ?? null : null); field.onChange(value); }} /><Text tone="secondary">{field.value === 'private' ? 'Only you see the title, place and notes. Your partner sees Busy.' : 'Both of you can see this plan.'}</Text></View>} />
    {!couple.data && <Text variant="caption" tone="secondary">Create a shared space when you’re ready to plan together.</Text>}
    <GroupedPanel>
      <GroupRow icon={CalendarDays} title="Start" value={eventDateLabel(startAt)} accessibilityLabel="Set start time" onPress={() => setStartOpen((open) => !open)} />
      {startOpen && <View style={styles.expanded}><Controller control={form.control} name="start_at" render={({ field, fieldState }) => <><DatePicker value={field.value} label="Start date" prompt="When does it start?" allowClear={false} onChange={(value) => updateStart(onDate(value, field.value))} disabled={busy} /><TimePicker label="Start time" value={field.value} onChange={updateStart} disabled={busy} />{fieldState.error?.message && <Notice error message={fieldState.error.message} />}</>} /></View>}
      <GroupDivider />
      <GroupRow icon={Clock3} title="End" value={eventDateLabel(endAt)} accessibilityLabel="Set end time" onPress={() => setEndOpen((open) => !open)} />
      {endOpen && <View style={styles.expanded}><Controller control={form.control} name="end_at" render={({ field, fieldState }) => <><DatePicker value={field.value} label="End date" prompt="When does it end?" allowClear={false} onChange={(value) => { setConflictError(null); field.onChange(onDate(value, field.value)); }} disabled={busy} /><TimePicker label="End time" value={field.value} onChange={(value) => { setConflictError(null); field.onChange(value); }} disabled={busy} />{fieldState.error?.message && <Notice error message={fieldState.error.message} />}</>} /></View>}
      <GroupDivider />
      <GroupRow icon={Bell} title="Reminder" value={calendarReminderLabel(reminderOffset)} accessibilityLabel="Set reminder" onPress={() => setReminderOpen((open) => !open)} />
      {reminderOpen && <View style={styles.expanded}><Controller control={form.control} name="reminder_offset_minutes" render={({ field }) => <ChoiceChips label="Remind me" value={field.value === null ? 'none' : String(field.value)} options={[{ value: 'none', label: 'No alert' }, ...calendarReminderOffsets.map((value) => ({ value: String(value), label: calendarReminderLabel(value) }))]} onChange={(value) => field.onChange(value === 'none' ? null : Number(value))} disabled={busy} />} /></View>}
      <GroupDivider />
      <GroupRow icon={MapPin} title="More details" accessibilityLabel="More details" onPress={() => setExpanded(!expanded)} />
      {expanded && <View style={styles.expanded}><Controller control={form.control} name="location" render={({ field, fieldState }) => <FormField label="Place" placeholder="e.g. The neighborhood café" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={300} editable={!busy} />} /><Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={4000} editable={!busy} />} /></View>}
    </GroupedPanel>
    {(conflictError ?? conflictMessage) && <Notice error message={conflictError ?? conflictMessage ?? ''} />}
    {(create.error || edit.error) && <Notice error message={calendarErrorMessage(create.error ?? edit.error)} />}
    <Button label={event ? 'Save changes' : 'Add event'} loading={busy} disabled={changedElsewhere || (!!event && event.owner_id !== userId) || !title?.trim()} onPress={() => void submit()} />
  </View>;
}

const styles = StyleSheet.create({ form: { gap: layout.fieldGap }, hero: { gap: spacing.sm }, section: { gap: spacing.sm }, expanded: { gap: spacing.lg, padding: spacing.lg, paddingTop: 0 }, error: { color: colors.error } });
