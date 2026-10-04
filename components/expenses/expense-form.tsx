import { zodResolver } from '@hookform/resolvers/zod';
import { format, subDays } from 'date-fns';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { calculateCustomSplit, calculateEqualSplit, calculateOnePayerSplit, toCents, fromCents } from '@/lib/expenses/calculations';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DatePicker } from '@/components/ui/date-picker';
import { FormField } from '@/components/ui/form-field';
import { IconTile } from '@/components/ui/icon-tile';
import { Notice } from '@/components/ui/notice';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useExpenseActions } from '@/hooks/use-expenses';
import { expenseErrorMessage } from '@/lib/expenses/errors';
import { expenseFormSchema } from '@/lib/validation/expense';
import { expenseCategories, type ExpenseCategory, type ExpenseInput, type ExpenseSplitMode, type ExpenseVisibility } from '@/types/expense';

type Values = { title: string; amountText: string; category: ExpenseCategory; paid_by: string; splitMode: ExpenseSplitMode; expense_date: string; notes: string };
const today = () => format(new Date(), 'yyyy-MM-dd');
const yesterday = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');
const money = (cents: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(fromCents(cents));
const categoryEmoji: Record<ExpenseCategory, string> = {
  Groceries: '🛒', Dining: '🍽️', Household: '🏠', Travel: '✈️', Entertainment: '🎟️', Transportation: '🚗', Utilities: '💡', Shopping: '🛍️', Other: '✨',
};

function safeCents(value: string) { try { return toCents(value); } catch { return 0; } }
function nameFor(id: string, userId: string, members: { user_id: string; name: string }[]) { return id === userId ? 'You' : members.find((member) => member.user_id === id)?.name ?? 'Partner'; }
function splitSummary({ amountCents, visibility, splitMode, paidBy, memberIds, userId, members }: { amountCents: number; visibility: ExpenseVisibility; splitMode: ExpenseSplitMode; paidBy: string; memberIds: string[]; userId: string; members: { user_id: string; name: string }[] }) {
  if (amountCents <= 0) return 'Enter an amount to see the split.';
  if (visibility === 'private') return 'Only you can see this expense.';
  if (memberIds.length < 2) return 'Connect your partner to split expenses.';
  if (splitMode === 'custom') return 'Enter custom shares to see the result.';
  const splits = splitMode === 'one_payer' ? calculateOnePayerSplit(amountCents, paidBy, memberIds) : calculateEqualSplit(amountCents, memberIds);
  const paidShare = splits.find((split) => split.userId === paidBy)?.amountCents ?? 0;
  const owedToPayer = amountCents - paidShare;
  if (owedToPayer <= 0) return 'Nothing to settle.';
  const other = memberIds.find((id) => id !== paidBy);
  if (!other) return 'Nothing to settle.';
  return `${nameFor(other, userId, members)} owes ${nameFor(paidBy, userId, members).toLowerCase()} ${money(owedToPayer)}.`;
}

export function ExpenseForm({ initialVisibility }: { initialVisibility?: ExpenseVisibility }) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  const { create } = useExpenseActions();
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [dateOpen, setDateOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const memberRows = useMemo(() => members.data ?? [], [members.data]);
  const memberIds = useMemo(() => memberRows.map((member) => member.user_id), [memberRows]);
  const form = useForm<Values & { visibility: ExpenseVisibility }>({ resolver: zodResolver(expenseFormSchema), defaultValues: { title: '', amountText: '', category: 'Groceries', paid_by: userId, splitMode: 'equal', expense_date: today(), notes: '', visibility: initialVisibility ?? 'private' } });
  const amountText = useWatch({ control: form.control, name: 'amountText' });
  const splitMode = useWatch({ control: form.control, name: 'splitMode' });
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const paidBy = useWatch({ control: form.control, name: 'paid_by' });
  const expenseDate = useWatch({ control: form.control, name: 'expense_date' });
  const connected = memberRows.length > 1;
  useEffect(() => { if (!form.getValues('paid_by') && userId) form.setValue('paid_by', userId); }, [form, userId]);
  useEffect(() => { if (!members.isPending && !members.isError && visibility === 'shared' && !connected) form.setValue('visibility', 'private'); }, [connected, form, members.isPending, members.isError, visibility]);
  const busy = create.isPending;
  const amountCents = safeCents(amountText);
  const summary = splitSummary({ amountCents, visibility, splitMode, paidBy, memberIds, userId, members: memberRows });

  const submit = form.handleSubmit((values) => {
    try {
      const expenseCents = toCents(values.amountText);
      const splits = values.visibility === 'private'
        ? [{ userId, amountCents: expenseCents }]
        : values.splitMode === 'custom'
        ? calculateCustomSplit(expenseCents, memberIds.map((id) => ({ userId: id, amountCents: toCents(customAmounts[id] || '0') })))
        : values.splitMode === 'one_payer'
          ? calculateOnePayerSplit(expenseCents, values.paid_by, memberIds)
          : calculateEqualSplit(expenseCents, memberIds);
      const input: ExpenseInput = {
        couple_id: values.visibility === 'shared' ? couple.data?.id ?? null : null, title: values.title, amount: fromCents(expenseCents), currency: 'USD', category: values.category,
        expense_date: values.expense_date, notes: values.notes, paid_by: values.visibility === 'private' ? userId : values.paid_by, visibility: values.visibility,
        splits: splits.map((split) => ({ user_id: split.userId, amount: fromCents(split.amountCents) })),
      };
      create.mutate(input, { onSuccess: (id) => router.replace({ pathname: '/expense/[id]', params: { id } }) });
    } catch (error) {
      form.setError('amountText', { message: error instanceof Error ? error.message : 'Check the split amounts' });
    }
  });

  if (couple.isPending || members.isPending) return <Text tone="secondary">Loading your shared space…</Text>;
  return <View style={styles.form}>
    <Controller control={form.control} name="amountText" render={({ field, fieldState }) => <View style={styles.hero}>
      <Text variant="label" tone="secondary">Amount</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currency}>$</Text>
        <TextInput accessibilityLabel="Amount" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} placeholder="0.00" placeholderTextColor={colors.textSecondary} selectionColor={colors.accent} style={styles.amountInput} />
      </View>
      {fieldState.error?.message && <Text variant="caption" style={styles.error}>{fieldState.error.message}</Text>}
    </View>} />
    <Controller control={form.control} name="title" render={({ field, fieldState }) => <FormField label="What was it?" placeholder="e.g. Weekly groceries" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={160} editable={!busy} />} />
    <Controller control={form.control} name="category" render={({ field }) => <View style={styles.section}>
      <Text variant="label">Category</Text>
      <View style={styles.tileGrid}>{expenseCategories.map((category) => {
        const selected = field.value === category;
        return <IconTile key={category} icon={categoryEmoji[category]} label={category === 'Entertainment' ? 'Fun' : category === 'Transportation' ? 'Transport' : category} selected={selected} onPress={() => field.onChange(category)} />;
      })}</View>
    </View>} />
    <Controller control={form.control} name="visibility" render={({ field }) => <View style={styles.section}>
      <Text variant="label">Spending</Text>
      <View style={styles.segment}><Pressable accessibilityRole="button" accessibilityState={{ selected: field.value === 'private' }} onPress={() => field.onChange('private')} style={[styles.segmentItem, field.value === 'private' && styles.segmentSelected]}><Text variant="label" tone={field.value === 'private' ? 'inverse' : 'secondary'}>Personal</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: field.value === 'shared', disabled: !connected }} disabled={!connected} onPress={() => field.onChange('shared')} style={[styles.segmentItem, field.value === 'shared' && styles.segmentSelected, !connected && styles.disabled]}><Text variant="label" tone={field.value === 'shared' ? 'inverse' : 'secondary'}>Shared</Text></Pressable></View>
      <Text variant="caption" tone="secondary">{field.value === 'shared' ? 'Both of you can see this expense and the split.' : connected ? 'Only you can see this expense.' : 'Only you can see this expense. Connect your partner to add couple spending.'}</Text>
    </View>} />
    {visibility === 'shared' && <View style={styles.panel}>
      <Controller control={form.control} name="paid_by" render={({ field }) => <View style={styles.section}><Text variant="label">Who paid?</Text><View style={styles.peopleRow}>{memberRows.map((member) => { const selected = field.value === member.user_id; return <Pressable key={member.user_id} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => field.onChange(member.user_id)} style={[styles.personCard, selected && styles.personSelected]}><View style={[styles.avatar, selected && styles.avatarSelected]}><Text variant="label" tone={selected ? 'inverse' : 'default'}>{member.user_id === userId ? 'Y' : member.name.slice(0, 1).toUpperCase()}</Text></View><Text variant="label" tone={selected ? 'accent' : 'default'}>{member.user_id === userId ? 'You' : member.name}</Text></Pressable>; })}</View></View>} />
      <Controller control={form.control} name="splitMode" render={({ field }) => <ChoiceChips label="How do you split it?" value={field.value} options={[{ value: 'equal' as const, label: 'Equally' }, { value: 'one_payer' as const, label: `All on ${nameFor(paidBy, userId, memberRows).replace('You', 'you')}` }, { value: 'custom' as const, label: 'Custom' }]} onChange={field.onChange} disabled={busy} />} />
      {splitMode === 'custom' && <View style={styles.custom}><Text variant="caption" tone="secondary">Shares must add up to {amountCents > 0 ? money(amountCents) : 'the amount'}.</Text>{memberRows.map((member) => <FormField key={member.user_id} label={`${member.user_id === userId ? 'Your' : member.name} share`} placeholder="0.00" keyboardType="decimal-pad" value={customAmounts[member.user_id] ?? ''} onChangeText={(value) => setCustomAmounts((current) => ({ ...current, [member.user_id]: value }))} editable={!busy} />)}</View>}
    </View>}
    <View style={styles.section}><Text variant="label">When</Text><View style={styles.chipRow}>{[{ label: 'Today', value: today() }, { label: 'Yesterday', value: yesterday() }].map((option) => <Pressable key={option.label} accessibilityRole="button" accessibilityState={{ selected: expenseDate === option.value }} onPress={() => form.setValue('expense_date', option.value)} style={[styles.softChip, expenseDate === option.value && styles.softChipSelected]}><Text variant="label" tone={expenseDate === option.value ? 'inverse' : 'default'}>{option.label}</Text></Pressable>)}<Pressable accessibilityRole="button" accessibilityState={{ selected: dateOpen }} onPress={() => setDateOpen((open) => !open)} style={styles.softChip}><Text variant="label">Pick a date</Text></Pressable></View>{dateOpen && <Controller control={form.control} name="expense_date" render={({ field }) => <DatePicker value={`${field.value}T12:00:00`} label="Expense date" prompt="When was it?" allowClear={false} disabled={busy} onChange={(value) => { if (value) field.onChange(format(new Date(value), 'yyyy-MM-dd')); }} />} />}</View>
    {notesOpen ? <Controller control={form.control} name="notes" render={({ field, fieldState }) => <FormField label="Note" placeholder="Anything useful to remember" multiline numberOfLines={3} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} maxLength={2000} editable={!busy} />} /> : <Button label="+ Add a note" variant="quiet" onPress={() => setNotesOpen(true)} />}
    <View style={styles.summary}><Text variant="heading">{summary}</Text></View>
    {create.error && <Notice error message={expenseErrorMessage(create.error)} />}
    <Button label="Save expense" loading={busy} disabled={amountCents <= 0} onPress={() => void submit()} />
  </View>;
}

const styles = StyleSheet.create({
  form: { gap: 26 },
  hero: { alignItems: 'center', gap: spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, minWidth: 240 },
  currency: { ...typography.display, fontSize: 44, lineHeight: 64, color: colors.textSecondary },
  amountInput: { ...typography.display, fontSize: 64, lineHeight: 76, minWidth: 180, color: colors.text, textAlign: 'center', fontVariant: ['tabular-nums'] },
  error: { color: colors.error },
  section: { gap: spacing.sm },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segment: { flexDirection: 'row', padding: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, gap: spacing.xs },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.accent },
  disabled: { opacity: 0.45 },
  panel: { gap: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  peopleRow: { flexDirection: 'row', gap: spacing.sm },
  personCard: { flex: 1, minHeight: 64, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  personSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  avatar: { width: layout.avatarSize, height: layout.avatarSize, borderRadius: layout.avatarSize / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  avatarSelected: { backgroundColor: colors.accent },
  custom: { gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surfaceMuted, borderRadius: radii.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  softChip: { minHeight: 44, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.lg, justifyContent: 'center' },
  softChipSelected: { backgroundColor: colors.accent },
  summary: { alignItems: 'center', paddingVertical: spacing.md },
});
