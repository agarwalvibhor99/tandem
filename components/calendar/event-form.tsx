import { zodResolver } from '@hookform/resolvers/zod';
import { addHours } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TimePicker } from '@/components/calendar/time-picker';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarActions } from '@/hooks/use-calendar';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { calendarErrorMessage } from '@/lib/calendar/errors';
import { calendarEventSchema } from '@/lib/validation/calendar';
import type { CalendarEvent, CalendarEventInput } from '@/types/calendar';

function initialStart() { const date = new Date(); date.setMinutes(0, 0, 0); return addHours(date, 1); }
function valuesFrom(event: CalendarEvent): CalendarEventInput { return { couple_id: event.couple_id, title: event.title, start_at: event.start_at, end_at: event.end_at, visibility: event.visibility, location: event.location, notes: event.notes }; }
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
  const start = initialStart();
  const form = useForm<CalendarEventInput>({ resolver: zodResolver(calendarEventSchema), defaultValues: event ? valuesFrom(event) : { couple_id: null, title: '', start_at: start.toISOString(), end_at: addHours(start, 1).toISOString(), visibility: 'private', location: '', notes: '' } });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const busy = create.isPending || edit.isPending;
  const changedElsewhere = !!baseline && !!event && baseline.updated_at !== event.updated_at;
  const updateStart = (iso: string) => {
    form.setValue('start_at', iso, { shouldValidate: true });
    if (Date.parse(form.getValues('end_at')) <= Date.parse(iso)) form.setValue('end_at', addHours(new Date(iso), 1).toISOString(), { shouldValidate: true });
  };
  const submit = form.handleSubmit((input) => {
    if (baseline) edit.mutate({ event: baseline, input }, { onSuccess: (saved) => router.replace({ pathname: '/event/[id]', params: { id: saved.id } }) });
    else create.mutate(input, { onSuccess: (saved) => router.replace({ pathname: '/event/[id]', params: { id: saved.id } }) });
  });
  return <>
    {changedElsewhere && <><Notice message="This event changed while you were editing. Load the latest version before saving." /><Button label="Load latest version" variant="secondary" onPress={() => { if (event) { setBaseline(event); form.reset(valuesFrom(event)); edit.reset(); } }} /></>}
    <Controller control={form.control} name="title" render={({ field, fieldState }) => <FormField label="What’s happening?" placeholder="e.g. Dinner with friends" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={160} editable={!busy} />} />
    <Controller control={form.control} name="visibility" render={({ field }) => <ChoiceChips label="Who can see the details?" value={field.value} options={[{ value: 'private' as const, label: 'Just me' }, ...(couple.data ? [{ value: 'shared' as const, label: 'Both of us' }] : [])]} onChange={(value) => { form.setValue('couple_id', value === 'shared' ? couple.data?.id ?? null : null); field.onChange(value); }} disabled={busy} />} />
    <Text variant="caption" tone="secondary">{visibility === 'private' ? 'Only you see the title, place and notes. Your partner sees “Busy” at this time.' : 'Both of you can see this plan. Only its creator can change it.'}</Text>
    {!couple.data && <Text variant="caption" tone="secondary">Create a shared space when you’re ready to plan together.</Text>}
    <Controller control={form.control} name="start_at" render={({ field }) => <><DatePicker value={field.value} label="Start date" prompt="When does it start?" allowClear={false} onChange={(value) => updateStart(onDate(value, field.value))} disabled={busy} /><TimePicker label="Start time" value={field.value} onChange={updateStart} disabled={busy} /></>} />
    <Controller control={form.control} name="end_at" render={({ field, fieldState }) => <><DatePicker value={field.value} label="End date" prompt="When does it end?" allowClear={false} onChange={(value) => field.onChange(onDate(value, field.value))} disabled={busy} /><TimePicker label="End time" value={field.value} onChange={field.onChange} disabled={busy} />{fieldState.error?.message && <Notice error message={fieldState.error.message} />}</>} />
    <Button label={expanded ? 'Fewer details' : 'Add place or notes'} variant="secondary" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} />
    {expanded && <><Controller control={form.control} name="location" render={({ field, fieldState }) => <FormField label="Place (optional)" placeholder="e.g. The neighborhood café" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={300} editable={!busy} />} /><Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes (optional)" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={4000} editable={!busy} />} /></>}
    {(create.error || edit.error) && <Notice error message={calendarErrorMessage(create.error ?? edit.error)} />}
    <Button label={event ? 'Save changes' : 'Add event'} loading={busy} disabled={changedElsewhere || (!!event && event.owner_id !== userId)} onPress={() => void submit()} />
    <Button label="Cancel" variant="secondary" disabled={busy} onPress={() => router.canGoBack() ? router.back() : router.replace('/calendar')} />
  </>;
}
