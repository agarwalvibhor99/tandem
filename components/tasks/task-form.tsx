import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { GroupDivider, GroupedPanel, GroupRow } from '@/components/ui/grouped-rows';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { PersonSelector } from '@/components/ui/person-selector';
import { VisibilitySegment } from '@/components/ui/visibility-segment';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useTaskActions } from '@/hooks/use-tasks';
import { taskErrorMessage } from '@/lib/tasks/errors';
import { taskSchema } from '@/lib/validation/task';
import { taskCategories, taskPriorities, type Task, type TaskInput } from '@/types/task';

function valuesFromTask(task: Task): TaskInput {
  return { title: task.title, description: task.description, due_at: task.due_at, priority: task.priority, category: task.category, visibility: task.visibility, couple_id: task.couple_id, assigned_to: task.assigned_to };
}
function dueLabel(value: string | null) { return value ? format(new Date(value), 'MMM d') : 'None'; }

function TaskDueDateRow({ value, onChange, disabled }: { value: string | null; onChange: (value: string | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(value ? new Date(value) : new Date()));
  const days = eachDayOfInterval({ start: startOfWeek(month), end: endOfWeek(endOfMonth(month)) });
  const choose = (date: Date | null) => { onChange(date ? date.toISOString() : null); setOpen(false); };
  return <>
    <GroupRow icon={CalendarDays} title="Due date" value={dueLabel(value)} accessibilityLabel="Choose due date" disabled={disabled} onPress={() => { setMonth(startOfMonth(value ? new Date(value) : new Date())); setOpen(true); }} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}><View style={styles.dialog} accessibilityViewIsModal>
        <Text variant="title" accessibilityRole="header">When is it due?</Text>
        <View style={styles.quickDates}><Button label="Today" variant="secondary" onPress={() => choose(new Date())} /><Button label="Tomorrow" variant="secondary" onPress={() => choose(addDays(new Date(), 1))} /></View>
        <View style={styles.month}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" style={styles.arrow} onPress={() => setMonth(addMonths(month, -1))}><ChevronLeft color={colors.text} size={layout.iconSize} /></Pressable><Text variant="heading">{format(month, 'MMMM yyyy')}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" style={styles.arrow} onPress={() => setMonth(addMonths(month, 1))}><ChevronRight color={colors.text} size={layout.iconSize} /></Pressable></View>
        <View style={styles.grid}>{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <View key={day} style={styles.day}><Text variant="caption" tone="secondary">{day}</Text></View>)}{days.map((day) => { const selected = !!value && isSameDay(day, new Date(value)); return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityLabel={format(day, 'EEEE, MMMM d, yyyy')} accessibilityState={{ selected }} onPress={() => choose(day)} style={[styles.day, selected && styles.selectedDay]}><Text tone={selected ? 'inverse' : isSameMonth(day, month) ? 'default' : 'secondary'}>{format(day, 'd')}</Text></Pressable>; })}</View>
        <Button label="No due date" variant="secondary" onPress={() => choose(null)} /><Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
      </View></View>
    </Modal>
  </>;
}

export function TaskForm({ task }: { task?: Task }) {
  const userId = useAuth().session!.user.id;
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const { create, edit } = useTaskActions();
  const [baseline, setBaseline] = useState(task);
  const [expanded, setExpanded] = useState(!!task?.description || task?.priority === 'high');
  const form = useForm<TaskInput>({ resolver: zodResolver(taskSchema), defaultValues: task ? valuesFromTask(task) : { title: '', description: '', due_at: null, priority: 'normal', category: 'Other', visibility: 'private', couple_id: null, assigned_to: userId } });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const title = useWatch({ control: form.control, name: 'title' });
  const busy = create.isPending || edit.isPending;
  const failure = create.error ?? edit.error;
  const creator = !baseline || baseline.created_by === userId;
  const people = [{ user_id: userId, name: 'You' }, ...(members.data ?? []).filter((member) => member.user_id !== userId)];
  const changedElsewhere = !!baseline && !!task && baseline.updated_at !== task.updated_at;
  const submit = form.handleSubmit((input) => {
    const onSuccess = (saved: Task) => router.replace({ pathname: '/task/[id]', params: { id: saved.id } });
    if (baseline) edit.mutate({ task: baseline, input }, { onSuccess });
    else create.mutate(input, { onSuccess });
  });
  return <View style={styles.form}>
    {changedElsewhere && <>
      <Notice message="This task changed while you were editing. Load the latest version before saving." />
      <Button label="Load latest version" variant="secondary" onPress={() => { if (task) { setBaseline(task); form.reset(valuesFromTask(task)); edit.reset(); } }} />
    </>}
    <Controller control={form.control} name="title" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <View style={styles.hero}>
      <HeroTextField ref={ref} accessibilityLabel="What needs doing?" placeholder="What needs doing?" value={value} onChangeText={onChange} onBlur={onBlur} editable={!busy} maxLength={160} autoCapitalize="sentences" returnKeyType="next" />
      {fieldState.error?.message && <Text variant="caption" style={styles.error}>{fieldState.error.message}</Text>}
    </View>} />
    {creator ? <Controller control={form.control} name="visibility" render={({ field }) => <View style={styles.section}>
      <Text variant="label">Who can see this?</Text>
      <VisibilitySegment value={field.value} sharedAvailable={!!couple.data} disabled={busy} onChange={(value) => { form.setValue('couple_id', value === 'shared' ? couple.data?.id ?? null : null); if (value === 'private') form.setValue('assigned_to', userId); field.onChange(value); }} />
      <Text tone="secondary">{field.value === 'private' ? 'Only you can see this task, including its title and notes.' : 'Both of you can see and manage this task.'}</Text>
    </View>} /> : <Text tone="secondary">Shared · Both of you can see and edit this task. Only its creator can change visibility.</Text>}
    {form.formState.errors.visibility?.message && <Notice error message={form.formState.errors.visibility.message} />}
    {!couple.data && <Text variant="caption" tone="secondary">Create a shared space from More when you’re ready to share tasks.</Text>}
    {visibility === 'shared' && <>
      <Controller control={form.control} name="assigned_to" render={({ field }) => <PersonSelector label="Who’s doing this?" value={field.value} people={people} userId={userId} allowAnyone disabled={busy} onChange={field.onChange} />} />
      {members.isError && <Notice error message="We couldn’t load your partner. Try reopening this screen when connected." />}
      {(members.data?.length ?? 0) < 2 && !members.isPending && !members.isError && <Text variant="caption" tone="secondary">You can assign tasks to your partner once they join your space.</Text>}
    </>}
    <GroupedPanel>
      <Controller control={form.control} name="due_at" render={({ field }) => <TaskDueDateRow value={field.value} onChange={field.onChange} disabled={busy} />} />
      <GroupDivider />
      <GroupRow icon={SlidersHorizontal} title="More options" accessibilityLabel="More options" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} trailing={<ChevronDown color={colors.muted} size={layout.iconSize} />} />
      {expanded && <View style={styles.expanded}>
        <Controller control={form.control} name="description" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <FormField ref={ref} label="Notes" placeholder="Anything else worth knowing?" multiline numberOfLines={4} value={value} onChangeText={onChange} onBlur={onBlur} error={fieldState.error?.message} editable={!busy} maxLength={4000} />} />
        <Controller control={form.control} name="priority" render={({ field }) => <ChoiceChips label="Priority" value={field.value} options={taskPriorities.map((priority) => ({ value: priority, label: priority[0]!.toUpperCase() + priority.slice(1) }))} onChange={field.onChange} disabled={busy} />} />
        <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips label="Category" value={field.value} options={taskCategories.map((category) => ({ value: category, label: category }))} onChange={field.onChange} disabled={busy} />} />
      </View>}
    </GroupedPanel>
    {failure && <Notice error message={taskErrorMessage(failure)} />}
    <Button label={baseline ? 'Save changes' : 'Create task'} loading={busy} disabled={changedElsewhere || !title?.trim()} onPress={() => void submit()} />
  </View>;
}

const styles = StyleSheet.create({
  form: { gap: layout.fieldGap },
  hero: { gap: spacing.sm },
  error: { color: colors.error },
  section: { gap: spacing.sm },
  expanded: { gap: spacing.lg, padding: spacing.lg, paddingTop: 0 },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  dialog: { gap: spacing.lg, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radii.lg, width: '100%', maxWidth: layout.dialogMaxWidth, maxHeight: '90%' },
  quickDates: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  month: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrow: { minHeight: layout.minTouchTarget, minWidth: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: `${100 / 7}%`, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  selectedDay: { backgroundColor: colors.accent },
});
