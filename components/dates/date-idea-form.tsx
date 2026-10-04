import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, SlidersHorizontal, Timer } from 'lucide-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { GroupDivider, GroupedPanel, GroupRow } from '@/components/ui/grouped-rows';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { IconTile } from '@/components/ui/icon-tile';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useDateIdeaActions } from '@/hooks/use-date-ideas';
import { dateIdeaErrorMessage } from '@/lib/dates/errors';
import { dateIdeaSchema } from '@/lib/validation/date-idea';
import { colors, layout, spacing } from '@/constants/theme';
import { dateCategories, dateCategoryLabel, dateCostLabel, dateCostLevels, dateStatuses, dateStatusLabel, type DateCategory, type DateIdea, type DateIdeaInput } from '@/types/date-idea';

const dateCategoryIcons: Record<DateCategory, string> = { food: '🍜', outdoor: '🌿', entertainment: '🎟️', trip: '✈️', at_home: '🛋️', activity: '🎳', other: '✨' };

function valuesFrom(idea: DateIdea): DateIdeaInput {
  return { couple_id: idea.couple_id, title: idea.title, category: idea.category, cost_level: idea.cost_level,
    duration_minutes: idea.duration_minutes, location: idea.location, notes: idea.notes, status: idea.status };
}
function durationLabel(value: number) { return value < 60 ? `${value} min` : value % 60 ? `${Math.floor(value / 60)}½ hr` : `${value / 60} hr`; }

export function DateIdeaForm({ idea }: { idea?: DateIdea }) {
  const couple = useCurrentCouple();
  const { create, update } = useDateIdeaActions();
  const [baseline, setBaseline] = useState(idea);
  const [optionsOpen, setOptionsOpen] = useState(!!idea);
  const [detailsOpen, setDetailsOpen] = useState(!!idea?.location || !!idea?.notes);
  const form = useForm<DateIdeaInput>({ resolver: zodResolver(dateIdeaSchema), defaultValues: idea ? valuesFrom(idea) : {
    couple_id: couple.data?.id ?? '', title: '', category: 'food', cost_level: 2, duration_minutes: 120,
    location: '', notes: '', status: 'want_to_do',
  } });
  const title = useWatch({ control: form.control, name: 'title' });
  const duration = useWatch({ control: form.control, name: 'duration_minutes' });
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
  return <View style={styles.form}>
    {changedElsewhere && <><Notice message="This idea changed while you were editing. Load the latest version before saving." /><Button label="Load latest version" variant="secondary" onPress={() => { if (idea) { setBaseline(idea); form.reset(valuesFrom(idea)); update.reset(); } }} /></>}
    <Controller control={form.control} name="title" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <View style={styles.hero}><HeroTextField ref={ref} accessibilityLabel="What should you try together?" placeholder="What should you try together?" value={value} onChangeText={onChange} onBlur={onBlur} editable={!busy} maxLength={160} autoCapitalize="sentences" returnKeyType="next" />{fieldState.error?.message && <Text variant="caption" style={styles.error}>{fieldState.error.message}</Text>}</View>} />
    <Controller control={form.control} name="category" render={({ field }) => <View style={styles.section} accessibilityRole="radiogroup"><Text variant="label">Mood</Text><View style={styles.tiles}>{dateCategories.map((value) => <IconTile key={value} icon={dateCategoryIcons[value]} label={dateCategoryLabel[value]} selected={field.value === value} disabled={busy} onPress={() => field.onChange(value)} />)}</View></View>} />
    <GroupedPanel>
      <GroupRow icon={Timer} title="Time" value={durationLabel(duration)} accessibilityLabel="Set duration" onPress={() => setOptionsOpen((open) => !open)} />
      {optionsOpen && <View style={styles.expanded}>
        <Controller control={form.control} name="duration_minutes" render={({ field }) => <ChoiceChips label="How long?" value={String(field.value)} options={[60, 90, 120, 180, 240, 360, ...(![60, 90, 120, 180, 240, 360].includes(field.value) ? [field.value] : [])].map((value) => ({ value: String(value), label: durationLabel(value) }))} onChange={(value) => field.onChange(Number(value))} disabled={busy} />} />
        <Controller control={form.control} name="cost_level" render={({ field }) => <ChoiceChips label="Budget" value={String(field.value)} options={dateCostLevels.map((value) => ({ value: String(value), label: dateCostLabel[value] }))} onChange={(value) => field.onChange(Number(value))} disabled={busy} />} />
        {idea && <Controller control={form.control} name="status" render={({ field }) => <ChoiceChips label="Status" value={field.value} options={dateStatuses.map((value) => ({ value, label: dateStatusLabel[value] }))} onChange={field.onChange} disabled={busy} />} />}
      </View>}
      <GroupDivider />
      <GroupRow icon={MapPin} title="Place and notes" value={detailsOpen ? undefined : 'Add'} accessibilityLabel="Add place or notes" onPress={() => setDetailsOpen((open) => !open)} />
      {detailsOpen && <View style={styles.expanded}><Controller control={form.control} name="location" render={({ field, fieldState }) => <FormField label="Place" placeholder="e.g. The little café by the park" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={300} editable={!busy} />} /><Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes" placeholder="Anything you want to remember" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={2000} editable={!busy} />} /></View>}
      <GroupDivider />
      <GroupRow icon={SlidersHorizontal} title="Saved for both of you" value="Ours" accessibilityLabel="Shared date idea" disabled />
    </GroupedPanel>
    {(create.error || update.error) && <Notice error message={dateIdeaErrorMessage(create.error ?? update.error)} />}
    <Button label={idea ? 'Save changes' : 'Save idea'} loading={busy} disabled={changedElsewhere || !title?.trim()} onPress={() => void submit()} />
  </View>;
}

const styles = StyleSheet.create({ form: { gap: layout.fieldGap }, hero: { gap: spacing.sm }, section: { gap: spacing.sm }, tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, expanded: { gap: spacing.lg, padding: spacing.lg, paddingTop: 0 }, error: { color: colors.error } });
