import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Bell, CalendarDays, ChevronDown, Clock3, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TimePicker } from '@/components/calendar/time-picker';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { GroupDivider, GroupedPanel, GroupRow } from '@/components/ui/grouped-rows';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { PersonSelector } from '@/components/ui/person-selector';
import { VisibilitySegment } from '@/components/ui/visibility-segment';
import { colors, layout, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useTaskActions } from '@/hooks/use-tasks';
import { scheduleTaskNotification, taskReminderLabel } from '@/lib/tasks/notifications';
import { taskErrorMessage } from '@/lib/tasks/errors';
import { taskReminderOffsets, taskSchema } from '@/lib/validation/task';
import { taskCategories, taskPriorities, type Task, type TaskInput } from '@/types/task';

function valuesFromTask(task: Task): TaskInput {
  return { title: task.title, description: task.description, due_at: task.due_at, reminder_offset_minutes: task.reminder_offset_minutes, priority: task.priority, category: task.category, visibility: task.visibility, couple_id: task.couple_id, assigned_to: task.assigned_to };
}
function dueLabel(value: string | null) { return value ? format(new Date(value), 'MMM d') : 'None'; }
function dueTimeLabel(value: string | null) { return value ? format(new Date(value), 'h:mm a') : 'Add time'; }
function withDefaultTaskTime(day: Date, current: string | null) { const next = current ? new Date(current) : new Date(day); next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate()); if (!current) next.setHours(9, 0, 0, 0); return next.toISOString(); }

function TaskDueDateRow({ value, onChange, disabled }: { value: string | null; onChange: (value: string | null) => void; disabled?: boolean }) {
  return <DatePicker value={value} onChange={(next) => onChange(next ? withDefaultTaskTime(new Date(next), value) : null)} disabled={disabled} renderTrigger={(open) => <GroupRow icon={CalendarDays} title="Due date" value={dueLabel(value)} accessibilityLabel="Choose due date" disabled={disabled} onPress={open} />} />;
}

export function TaskForm({ task }: { task?: Task }) {
  const userId = useAuth().session!.user.id;
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const { create, edit } = useTaskActions();
  const [baseline, setBaseline] = useState(task);
  const [expanded, setExpanded] = useState(!!task?.description || task?.priority === 'high');
  const [timeOpen, setTimeOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const form = useForm<TaskInput>({ resolver: zodResolver(taskSchema), defaultValues: task ? valuesFromTask(task) : { title: '', description: '', due_at: null, reminder_offset_minutes: null, priority: 'normal', category: 'Other', visibility: 'private', couple_id: null, assigned_to: userId } });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const title = useWatch({ control: form.control, name: 'title' });
  const dueAt = useWatch({ control: form.control, name: 'due_at' });
  const reminderOffset = useWatch({ control: form.control, name: 'reminder_offset_minutes' });
  const busy = create.isPending || edit.isPending;
  const failure = create.error ?? edit.error;
  const creator = !baseline || baseline.created_by === userId;
  const people = [{ user_id: userId, name: 'You' }, ...(members.data ?? []).filter((member) => member.user_id !== userId)];
  const changedElsewhere = !!baseline && !!task && baseline.updated_at !== task.updated_at;
  const ensureDueAt = () => {
    const current = form.getValues('due_at');
    if (current) return current;
    const next = new Date();
    next.setHours(9, 0, 0, 0);
    const iso = next.toISOString();
    form.setValue('due_at', iso, { shouldValidate: true });
    return iso;
  };
  const submit = form.handleSubmit((input) => {
    const onSuccess = async (saved: Task) => { const notification = await scheduleTaskNotification(saved, userId); router.replace({ pathname: '/task/[id]', params: { id: saved.id, notification } }); };
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
      <Controller control={form.control} name="due_at" render={({ field }) => <TaskDueDateRow value={field.value} onChange={(value) => { field.onChange(value); if (!value) form.setValue('reminder_offset_minutes', null); }} disabled={busy} />} />
      <GroupDivider />
      <GroupRow icon={Clock3} title="Due time" value={dueTimeLabel(dueAt)} accessibilityLabel="Set due time" disabled={busy} onPress={() => { ensureDueAt(); setTimeOpen((open) => !open); }} trailing={<ChevronDown color={colors.muted} size={layout.iconSize} />} />
      {timeOpen && <Controller control={form.control} name="due_at" render={({ field }) => <TimePicker label="Due time" value={field.value ?? ensureDueAt()} onChange={field.onChange} disabled={busy} autoOpen hideTrigger onDismiss={() => setTimeOpen(false)} />} />}
      <GroupDivider />
      <GroupRow icon={Bell} title="Alert" value={dueAt ? taskReminderLabel(reminderOffset) : 'Choose due date first'} accessibilityLabel="Set task alert" disabled={busy} onPress={() => { ensureDueAt(); setAlertOpen((open) => !open); }} trailing={<ChevronDown color={colors.muted} size={layout.iconSize} />} />
      {alertOpen && <View style={styles.expanded}><Controller control={form.control} name="reminder_offset_minutes" render={({ field }) => <ChoiceChips label="Alert" value={field.value === null ? 'none' : String(field.value)} options={[{ value: 'none', label: 'No alert' }, ...taskReminderOffsets.map((value) => ({ value: String(value), label: taskReminderLabel(value) }))]} onChange={(value) => field.onChange(value === 'none' ? null : Number(value))} disabled={busy} />} /></View>}
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
});
