import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { calculateCustomSplit, calculateEqualSplit, calculateOnePayerSplit, toCents, fromCents } from '@/lib/expenses/calculations';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { PersonSelector } from '@/components/ui/person-selector';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useExpenseActions } from '@/hooks/use-expenses';
import { expenseErrorMessage } from '@/lib/expenses/errors';
import { expenseFormSchema } from '@/lib/validation/expense';
import { expenseCategories, type ExpenseInput, type ExpenseSplitMode, type ExpenseVisibility } from '@/types/expense';

type Values = { title: string; amountText: string; category: (typeof expenseCategories)[number]; paid_by: string; splitMode: ExpenseSplitMode; expense_date: string; notes: string };
const today = () => format(new Date(), 'yyyy-MM-dd');

export function ExpenseForm({ initialVisibility }: { initialVisibility?: ExpenseVisibility }) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const { create } = useExpenseActions();
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [moreOpen, setMoreOpen] = useState(false);
  const memberIds = useMemo(() => (members.data ?? []).map((member) => member.user_id), [members.data]);
  const form = useForm<Values & { visibility: ExpenseVisibility }>({ resolver: zodResolver(expenseFormSchema), defaultValues: { title: '', amountText: '', category: 'Other', paid_by: userId, splitMode: 'equal', expense_date: today(), notes: '', visibility: initialVisibility ?? 'private' } });
  const splitMode = useWatch({ control: form.control, name: 'splitMode' });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const connected = (members.data?.length ?? 0) > 1;
  useEffect(() => { if (!form.getValues('paid_by') && userId) form.setValue('paid_by', userId); }, [form, userId]);
  useEffect(() => { if (!members.isPending && !members.isError && visibility === 'shared' && !connected) form.setValue('visibility', 'private'); }, [connected, form, members.isPending, members.isError, visibility]);
  const busy = create.isPending;

  const submit = form.handleSubmit((values) => {
    try {
      const amountCents = toCents(values.amountText);
      const splits = values.visibility === 'private'
        ? [{ userId, amountCents }]
        : values.splitMode === 'custom'
        ? calculateCustomSplit(amountCents, memberIds.map((id) => ({ userId: id, amountCents: toCents(customAmounts[id] || '0') })))
        : values.splitMode === 'one_payer'
          ? calculateOnePayerSplit(amountCents, values.paid_by, memberIds)
          : calculateEqualSplit(amountCents, memberIds);
      const input: ExpenseInput = {
        couple_id: values.visibility === 'shared' ? couple.data?.id ?? null : null, title: values.title, amount: fromCents(amountCents), currency: 'USD', category: values.category,
        expense_date: values.expense_date, notes: values.notes, paid_by: values.visibility === 'private' ? userId : values.paid_by, visibility: values.visibility,
        splits: splits.map((split) => ({ user_id: split.userId, amount: fromCents(split.amountCents) })),
      };
      create.mutate(input, { onSuccess: (id) => router.replace({ pathname: '/expense/[id]', params: { id } }) });
    } catch (error) {
      form.setError('amountText', { message: error instanceof Error ? error.message : 'Check the split amounts' });
    }
  });

  if (couple.isPending || members.isPending) return <Text tone="secondary">Loading your shared space…</Text>;
  return <>
    <Controller control={form.control} name="amountText" render={({ field, fieldState }) => <FormField label="Amount" placeholder="0.00" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} editable={!busy} />} />
    <Controller control={form.control} name="title" render={({ field, fieldState }) => <FormField label="What was it?" placeholder="e.g. Weekly groceries" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={160} editable={!busy} />} />
    <Controller control={form.control} name="visibility" render={({ field }) => <VisibilitySelector value={field.value} sharedAvailable={connected} showUnavailableShared sharedLabel="Couple" label="Spending" onChange={field.onChange} disabled={busy} privateHint={connected ? 'Only you can see this expense.' : 'Only you can see this expense. Connect your partner to add couple spending.'} sharedHint="Both of you can see this expense and its split." />} />
    <Controller control={form.control} name="category" render={({ field }) => <ChoiceChips scrollable label="Category" value={field.value} options={expenseCategories.map((value) => ({ value, label: value }))} onChange={field.onChange} disabled={busy} />} />
    {visibility === 'shared' && <><Controller control={form.control} name="paid_by" render={({ field, fieldState }) => <><PersonSelector label="Paid by" value={field.value} people={members.data ?? []} userId={userId} onChange={(value) => { if (value) field.onChange(value); }} disabled={busy} />{fieldState.error?.message && <Text tone="secondary">{fieldState.error.message}</Text>}</>} /><Controller control={form.control} name="splitMode" render={({ field }) => <ChoiceChips label="How should it be shared?" value={field.value} options={[{ value: 'equal' as const, label: '50 / 50' }, { value: 'one_payer' as const, label: 'One person pays' }, { value: 'custom' as const, label: 'Custom amounts' }]} onChange={field.onChange} disabled={busy} />} />{splitMode === 'custom' && <View style={styles.custom}><Text variant="caption" tone="secondary">Add each person’s share. The total must match the amount above.</Text>{(members.data ?? []).map((member) => <FormField key={member.user_id} label={`${member.user_id === userId ? 'Your' : member.name} share`} placeholder="0.00" keyboardType="decimal-pad" value={customAmounts[member.user_id] ?? ''} onChangeText={(value) => setCustomAmounts((current) => ({ ...current, [member.user_id]: value }))} editable={!busy} />)}</View>}</>}
    <Button label={moreOpen ? 'Fewer details' : 'Date or notes'} variant="quiet" accessibilityState={{ expanded: moreOpen }} onPress={() => setMoreOpen(!moreOpen)} />
    {moreOpen && <><Controller control={form.control} name="expense_date" render={({ field }) => <DatePicker value={`${field.value}T12:00:00`} label="Expense date" prompt="When was it?" allowClear={false} disabled={busy} onChange={(value) => { if (value) field.onChange(format(new Date(value), 'yyyy-MM-dd')); }} />} />
    <Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Notes (optional)" placeholder="Anything useful to remember" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={2000} editable={!busy} />} /></>}
    {create.error && <Notice error message={expenseErrorMessage(create.error)} />}
    <Button label="Save expense" loading={busy} onPress={() => void submit()} />
  </>;
}
const styles = { custom: { gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surfaceMuted, borderRadius: 16 } };
