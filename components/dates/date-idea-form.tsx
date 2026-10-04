import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useDateIdeaActions } from '@/hooks/use-date-ideas';
import { dateIdeaErrorMessage } from '@/lib/dates/errors';
import { dateIdeaSchema } from '@/lib/validation/date-idea';
import { dateCategories, dateCategoryLabel, dateCostLabel, dateCostLevels, dateStatuses, dateStatusLabel, type DateIdea, type DateIdeaInput } from '@/types/date-idea';

function valuesFrom(idea: DateIdea): DateIdeaInput {
  return { couple_id: idea.couple_id, title: idea.title, category: idea.category, cost_level: idea.cost_level,
    duration_minutes: idea.duration_minutes, location: idea.location, notes: idea.notes, status: idea.status };
}
export function DateIdeaForm({ idea }: { idea?: DateIdea }) {
  const couple = useCurrentCouple();
  const { create, update } = useDateIdeaActions();
  const [baseline, setBaseline] = useState(idea);
  const [expanded, setExpanded] = useState(!!idea?.location || !!idea?.notes);
  const form = useForm<DateIdeaInput>({ resolver: zodResolver(dateIdeaSchema), defaultValues: idea ? valuesFrom(idea) : {
    couple_id: couple.data?.id ?? '', title: '', category: 'food', cost_level: 2, duration_minutes: 120,
    location: '', notes: '', status: 'want_to_do',
  } });
  useEffect(() => { if (couple.data?.id) form.setValue('couple_id', couple.data.id); }, [couple.data?.id, form]);
  const busy = create.isPending || update.isPending;
  const changedElsewhere = !!baseline && !!idea && baseline.updated_at !== idea.updated_at;
  const submit = form.handleSubmit((values) => {
    const input = { ...values, couple_id: couple.data?.id ?? values.couple_id };
    if (baseline) update.mutate({ idea: baseline, input }, { onSuccess: () => router.replace('/dates') });
    else create.mutate(input, { onSuccess: () => router.replace('/dates') });
  });
  if (couple.isPending) return <Text tone="secondary">Getting your shared space…</Text>;
  if (couple.isError) return <><Notice error message="We couldn’t load your shared space." /><Button label="Try again" onPress={() => void couple.refetch()} /></>;
  if (!couple.data) return <><Notice message="Create a shared space before saving date ideas together." /><Button label="Create your shared space" onPress={() => router.push('/create-space')} /></>;
  return <>
    {changedElsewhere && <><Notice message="This idea changed while you were editing. Load the latest version before saving." /><Button label="Load latest version" variant="secondary" onPress={() => { if (idea) { setBaseline(idea); form.reset(valuesFrom(idea)); update.reset(); } }} /></>}
    <Controller control={form.control} name="title" render={({ field, fieldState }) => <FormField label="What would you like to do?" placeholder="e.g. Ramen and a waterfront walk" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={160} editable={!busy} />} />
    <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips scrollable label="Kind of date" value={field.value} options={dateCategories.map((value) => ({ value, label: dateCategoryLabel[value] }))} onChange={field.onChange} disabled={busy} />} />
    <Controller control={form.control} name="cost_level" render={({ field }) => <ChoiceChips label="About how much?" value={String(field.value)} options={dateCostLevels.map((value) => ({ value: String(value), label: dateCostLabel[value] }))} onChange={(value) => field.onChange(Number(value))} disabled={busy} />} />
    <Controller control={form.control} name="duration_minutes" render={({ field }) => <ChoiceChips label="How long?" value={String(field.value)} options={[60, 90, 120, 180, 240, 360, ...(![60, 90, 120, 180, 240, 360].includes(field.value) ? [field.value] : [])].map((value) => ({ value: String(value), label: value < 60 ? `${value} min` : value % 60 ? `${Math.floor(value / 60)}½ hr` : `${value / 60} hr` }))} onChange={(value) => field.onChange(Number(value))} disabled={busy} />} />
    {idea && <Controller control={form.control} name="status" render={({ field }) => <ChoiceChips label="Where is this idea?" value={field.value} options={dateStatuses.map((value) => ({ value, label: dateStatusLabel[value] }))} onChange={field.onChange} disabled={busy} />} />}
    <Button label={expanded ? 'Fewer details' : 'Add place or notes'} variant="quiet" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} />
    {expanded && <><Controller control={form.control} name="location" render={({ field, fieldState }) => <FormField label="Place (optional)" placeholder="e.g. The little café by the park" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={300} editable={!busy} />} /><Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes (optional)" placeholder="Anything you want to remember" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={2000} editable={!busy} />} /></>}
    {(create.error || update.error) && <Notice error message={dateIdeaErrorMessage(create.error ?? update.error)} />}
    <Button label={idea ? 'Save changes' : 'Save idea'} loading={busy} disabled={changedElsewhere} onPress={() => void submit()} />
  </>;
}
