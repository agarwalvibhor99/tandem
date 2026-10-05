import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, radii, spacing } from '@/constants/theme';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useAuth } from '@/hooks/use-auth';
import { useExpense } from '@/hooks/use-expenses';
import { calculateCoupleBalance, fromCents, toCents, userNetPositions } from '@/lib/expenses/calculations';
import type { ExpenseDetail } from '@/types/expense';

const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
function settlementFor(expense: ExpenseDetail, nameFor: (id: string) => string) {
  if (expense.visibility === 'private') return 'Only you';
  const balance = calculateCoupleBalance(userNetPositions([{ paidBy: expense.paid_by, amountCents: toCents(expense.amount), splits: expense.splits.map((split) => ({ userId: split.user_id, amountCents: toCents(split.amount) })) }]));
  if (!balance) return 'Nothing to settle';
  return `${nameFor(balance.debtorId)} owes ${nameFor(balance.creditorId).toLowerCase()} ${money(fromCents(balance.amountCents), expense.currency)}`;
}
export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expense = useExpense(id ?? '');
  const members = useCoupleMembers();
  const userId = useAuth().session?.user.id ?? '';
  const nameFor = (id: string) => id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? 'Partner';
  return <Screen standalone title={expense.data?.title ?? 'Expense'} description={expense.data ? `${expense.data.visibility === 'private' ? 'Personal' : 'Couple'} · ${expense.data.category} · ${expense.data.expense_date}` : 'Expense details'}>
    {expense.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading expense" />}
    {expense.isError && <><Notice error message="We couldn’t load this expense." /><Button label="Try again" onPress={() => void expense.refetch()} /></>}
    {expense.isSuccess && !expense.data && <Surface><Text variant="heading">Expense unavailable</Text><Text tone="secondary">It may have been removed, or you may no longer have access.</Text></Surface>}
    {expense.data && <>
      <Surface>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text variant="display">{money(expense.data.amount, expense.data.currency)}</Text>
            <Text variant="heading">Paid by {nameFor(expense.data.paid_by)}</Text>
          </View>
          <View style={styles.settlementPill}><Text variant="caption" tone="accent" style={styles.settlementText}>{settlementFor(expense.data, nameFor)}</Text></View>
        </View>
        {expense.data.notes ? <Text tone="secondary">{expense.data.notes}</Text> : null}
      </Surface>
      {expense.data.visibility === 'shared' && <Surface><Text variant="heading">Each person’s share</Text><View style={styles.rows}>{expense.data.splits.map((split) => <View key={split.id} style={styles.row}><Text>{nameFor(split.user_id)}</Text><Text variant="label">{money(split.amount, expense.data!.currency)}</Text></View>)}</View></Surface>}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  heroCopy: { flex: 1, gap: spacing.xs },
  settlementPill: { maxWidth: 190, borderRadius: radii.lg, backgroundColor: colors.accentSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  settlementText: { textAlign: 'right' },
  rows: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
});
