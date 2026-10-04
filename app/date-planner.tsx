import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { TimePicker } from '@/components/calendar/time-picker';
import { DateIdeaCard } from '@/components/dates/date-idea-card';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DatePicker } from '@/components/ui/date-picker';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarWindow } from '@/hooks/use-calendar';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useDateIdeas } from '@/hooks/use-date-ideas';
import { sharedFreeTimeForEntries } from '@/lib/calendar/free-time';
import { recommendDateIdeas } from '@/lib/dates/planner';
import { datePlanSchema } from '@/lib/validation/date-idea';
import { dateCategories, dateCategoryLabel, dateCostLabel, dateCostLevels, type DateCategory, type DateCostLevel, type DateMood } from '@/types/date-idea';

type Values = { start_at: string; end_at: string; budget: DateCostLevel; category: DateCategory | 'any'; mood: DateMood };
function initialWindow(): Values {
  const start = addDays(startOfDay(new Date()), 1);
  start.setHours(18);
  const end = new Date(start); end.setHours(22);
  return { start_at: start.toISOString(), end_at: end.toISOString(), budget: 2, category: 'any', mood: 'any' };
}
function setDay(current: string, date: string | null) {
  if (!date) return current;
  const selected = new Date(date); const next = new Date(current);
  next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  return next.toISOString();
}
export default function DatePlannerScreen() {
  const userId = useAuth().session?.user.id ?? '';
  const members = useCoupleMembers();
  const ideas = useDateIdeas();
  const [plan, setPlan] = useState<Values | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(datePlanSchema), defaultValues: initialWindow() });
  const startAt = useWatch({ control: form.control, name: 'start_at' });
  const startDay = startOfDay(new Date(startAt));
  const partner = members.data?.find((member) => member.user_id !== userId);
  const connected = !!partner && !!ideas.couple.data;
  const calendar = useCalendarWindow(startDay, addDays(startDay, 1), connected);
  const ready = connected && ideas.query.isSuccess && calendar.isSuccess;
  const blocks = plan && ready ? sharedFreeTimeForEntries(calendar.data, userId, partner.user_id, new Date(plan.start_at), new Date(plan.end_at), 30) : [];
  const matches = plan && ready ? recommendDateIdeas(ideas.query.data ?? [], blocks, { budget: plan.budget, category: plan.category, mood: plan.mood }) : [];
  const submit = form.handleSubmit((values) => setPlan(values));
  return <Screen standalone title="Plan a date" description="Find an idea that fits the time you have together.">
    {(members.isPending || ideas.couple.isPending) && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading shared space" />}
    {(members.isError || ideas.couple.isError) && <><Notice error message="We couldn’t check your connection." /><Button label="Try again" onPress={() => { void members.refetch(); void ideas.couple.refetch(); }} /></>}
    {!members.isPending && !ideas.couple.isPending && !connected && <Surface><Text variant="heading">Plan together after you connect</Text><Text tone="secondary">You can save date ideas now. Connect your partner to find common free time.</Text><Button label={ideas.couple.data ? 'Invite your partner' : 'Create your shared space'} onPress={() => router.push(ideas.couple.data ? '/invite-partner' : '/create-space')} /></Surface>}
    {connected && <>
      <Controller control={form.control} name="start_at" render={({ field }) => <><DatePicker label="Day" value={field.value} prompt="When could you go?" allowClear={false} onChange={(date) => { field.onChange(setDay(field.value, date)); form.setValue('end_at', setDay(form.getValues('end_at'), date)); setPlan(null); }} /><TimePicker label="From" value={field.value} onChange={(value) => { field.onChange(value); setPlan(null); }} /></>} />
      <Controller control={form.control} name="end_at" render={({ field, fieldState }) => <><TimePicker label="Until" value={field.value} onChange={(value) => { field.onChange(value); setPlan(null); }} />{fieldState.error?.message && <Notice error message={fieldState.error.message} />}</>} />
      <Controller control={form.control} name="budget" render={({ field }) => <ChoiceChips label="Budget up to" value={String(field.value)} options={dateCostLevels.map((value) => ({ value: String(value), label: dateCostLabel[value] }))} onChange={(value) => { field.onChange(Number(value)); setPlan(null); }} />} />
      <Controller control={form.control} name="mood" render={({ field }) => <ChoiceChips label="Mood" value={field.value} options={[{ value: 'any', label: 'Anything' }, { value: 'relaxed', label: 'Relaxed' }, { value: 'active', label: 'Active' }, { value: 'explore', label: 'Explore' }]} onChange={(value) => { field.onChange(value); setPlan(null); }} />} />
      <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips label="Kind of plan" value={field.value} options={[{ value: 'any', label: 'Any' }, ...dateCategories.map((value) => ({ value, label: dateCategoryLabel[value] }))]} onChange={(value) => { field.onChange(value); setPlan(null); }} />} />
      <Text variant="caption" tone="secondary">Availability uses events in Tandem. Other calendars and travel time aren’t included yet.</Text>
      {(calendar.isPending || ideas.query.isPending) && <ActivityIndicator color={colors.accent} accessibilityLabel="Checking plans" />}
      {(calendar.isError || ideas.query.isError) && <><Notice error message="We couldn’t check your calendar or saved ideas." /><Button label="Try again" variant="secondary" onPress={() => { void calendar.refetch(); void ideas.query.refetch(); }} /></>}
      <Button label="Find a plan" onPress={() => void submit()} disabled={!ready} />
      {plan && ready && <>
        <Surface><Text variant="heading">Time together</Text>{blocks.length ? <Text tone="secondary">You’re both free {blocks.map((block) => `${format(block.start, 'h:mm a')}–${format(block.end, 'h:mm a')}`).join(', ')}.</Text> : <Text tone="secondary">No common free time in this window. Try a wider time or another day.</Text>}</Surface>
        {!!matches.length ? <><Text variant="title" accessibilityRole="header">Ideas that fit</Text><View style={styles.results}>{matches.slice(0, 5).map(({ idea, slot }) => <View key={idea.id} style={styles.result}><DateIdeaCard idea={idea} /><Text variant="caption" tone="secondary">Fits {format(slot.start, 'h:mm a')}–{format(slot.end, 'h:mm a')}</Text></View>)}</View></> : !!blocks.length && <Surface><Text variant="heading">No saved ideas fit yet</Text><Text tone="secondary">Try a different budget or mood, or save an idea that fits this window.</Text><Button label="Save an idea" onPress={() => router.push('/date/new')} /></Surface>}
      </>}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ results: { gap: spacing.lg }, result: { gap: spacing.xs } });
