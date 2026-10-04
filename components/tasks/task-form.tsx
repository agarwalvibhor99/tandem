import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import { useTaskActions } from '@/hooks/use-tasks';
import { taskErrorMessage } from '@/lib/tasks/errors';
import { taskSchema } from '@/lib/validation/task';
import { taskCategories, taskPriorities, type Task, type TaskInput } from '@/types/task';

function valuesFromTask(task: Task): TaskInput {
  return { title: task.title, description: task.description, due_at: task.due_at, priority: task.priority, category: task.category, visibility: task.visibility, couple_id: task.couple_id, assigned_to: task.assigned_to };
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
  return <>
    {changedElsewhere && <>
      <Notice message="This task changed while you were editing. Load the latest version before saving." />
      <Button label="Load latest version" variant="secondary" onPress={() => { if (task) { setBaseline(task); form.reset(valuesFromTask(task)); edit.reset(); } }} />
    </>}
    <Controller control={form.control} name="title" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <FormField ref={ref} label="What needs doing?" placeholder="e.g. Book the car service" value={value} onChangeText={onChange} onBlur={onBlur} error={fieldState.error?.message} editable={!busy} maxLength={160} autoCapitalize="sentences" returnKeyType="next" />} />
    {creator ? <Controller control={form.control} name="visibility" render={({ field }) => <VisibilitySelector value={field.value} sharedAvailable={!!couple.data} disabled={busy} privateHint="Only you can see this task, including its title and notes." sharedHint="Both of you can see and manage this task." onChange={(value) => { form.setValue('couple_id', value === 'shared' ? couple.data?.id ?? null : null); if (value === 'private') form.setValue('assigned_to', userId); field.onChange(value); }} />} /> : <Text tone="secondary">Shared · Both of you can see and edit this task. Only its creator can change visibility.</Text>}
    {form.formState.errors.visibility?.message && <Notice error message={form.formState.errors.visibility.message} />}
    {!couple.data && <Text variant="caption" tone="secondary">Create a shared space from More when you’re ready to share tasks.</Text>}
    {visibility === 'shared' && <>
      <Controller control={form.control} name="assigned_to" render={({ field }) => <PersonSelector label="Who’s doing this?" value={field.value} people={people} userId={userId} allowAnyone disabled={busy} onChange={field.onChange} />} />
      {members.isError && <Notice error message="We couldn’t load your partner. Try reopening this screen when connected." />}
      {(members.data?.length ?? 0) < 2 && !members.isPending && !members.isError && <Text variant="caption" tone="secondary">You can assign tasks to your partner once they join your space.</Text>}
    </>}
    <Controller control={form.control} name="due_at" render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} disabled={busy} />} />
    <Button label={expanded ? 'Fewer options' : 'More options'} variant="quiet" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} />
    {expanded && <>
      <Controller control={form.control} name="description" render={({ field: { ref, onChange, onBlur, value }, fieldState }) => <FormField ref={ref} label="Notes" placeholder="Anything else worth knowing?" multiline numberOfLines={4} value={value} onChangeText={onChange} onBlur={onBlur} error={fieldState.error?.message} editable={!busy} maxLength={4000} />} />
      <Controller control={form.control} name="priority" render={({ field }) => <ChoiceChips label="Priority" value={field.value} options={taskPriorities.map((priority) => ({ value: priority, label: priority[0]!.toUpperCase() + priority.slice(1) }))} onChange={field.onChange} disabled={busy} />} />
      <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips scrollable label="Category" value={field.value} options={taskCategories.map((category) => ({ value: category, label: category }))} onChange={field.onChange} disabled={busy} />} />
    </>}
    {failure && <Notice error message={taskErrorMessage(failure)} />}
    <Button label={baseline ? 'Save changes' : 'Create task'} loading={busy} disabled={changedElsewhere} onPress={() => void submit()} />
  </>;
}
