import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { CompactAction } from '@/components/ui/compact-action';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { colors, layout, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useExpenseSummary, useExpenses } from '@/hooks/use-expenses';
import type { ExpenseVisibility } from '@/types/expense';

const money = (value: number, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);

export default function MoneyScreen() {
  const userId = useAuth().session?.user.id ?? '';
  const members = useCoupleMembers();
  const connected = (members.data?.length ?? 0) > 1;
  const [view, setView] = useState<ExpenseVisibility>('shared');
  const selectedView: ExpenseVisibility = connected ? view : 'private';
  const summary = useExpenseSummary(selectedView);
  const history = useExpenses(selectedView);
  const nameFor = (id: string) => id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? 'Partner';
  const shared = selectedView === 'shared';

  return <Screen standalone title="Money" description="A clear view of what you spend, alone or together.">
    <VisibilitySelector label="Spending" value={selectedView} sharedAvailable={connected} showUnavailableShared sharedLabel="Couple" onChange={setView} />
    <CompactAction icon={Wallet} label="New expense" description={shared ? 'Add couple spending' : 'Add personal spending'} onPress={() => router.push({ pathname: '/expense/new', params: { visibility: selectedView } })} />

    {!connected && !members.isPending && !members.isError && <Notice message="Your spending is private. Connect your partner to track couple spending." />}
    {summary.query.isError && <Notice error message="We couldn’t load this month’s spending." />}
    <Surface>
      <Text variant="label" tone="accent">{shared ? 'Couple spending' : 'Personal spending'} · This month</Text>
      {summary.query.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading spending summary" /> : summary.query.isError ? <Button label="Try again" variant="secondary" onPress={() => void summary.query.refetch()} /> : <Text variant="title">{money(summary.query.data?.totalAmount ?? 0)}</Text>}
      {shared && !!summary.query.data?.members.length && <View style={styles.breakdown}>
        {summary.query.data.members.map((member) => <View key={member.user_id} style={styles.member}>
          <Text variant="label">{nameFor(member.user_id)}</Text>
          <Text variant="caption" tone="secondary">Paid {money(member.paid_amount)} · Share {money(member.share_amount)}</Text>
          <Text variant="caption" tone="accent">{member.net_amount > 0 ? `Owed ${money(member.net_amount)}` : member.net_amount < 0 ? `Owes ${money(-member.net_amount)}` : 'Settled'}</Text>
        </View>)}
      </View>}
    </Surface>

    <View style={styles.history}>
      <Text variant="heading" accessibilityRole="header">Recent expenses</Text>
      {history.query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading expenses" />}
      {history.query.isError && <><Notice error message="We couldn’t load your expenses." /><Button label="Try again" variant="secondary" onPress={() => void history.query.refetch()} /></>}
      {history.query.isSuccess && history.query.data.length === 0 && <Surface><Text variant="heading">Nothing recorded yet</Text><Text tone="secondary">Add your first {shared ? 'couple' : 'personal'} expense to see it here.</Text></Surface>}
      {history.query.data?.map((expense) => <Pressable key={expense.id} accessibilityRole="button" accessibilityLabel={`${expense.title}, ${money(expense.amount, expense.currency)}`} onPress={() => router.push({ pathname: '/expense/[id]', params: { id: expense.id } })} style={styles.expense}>
        <View style={styles.expenseCopy}><Text variant="label">{expense.title}</Text><Text variant="caption" tone="secondary">{expense.category} · {format(parseISO(expense.expense_date), 'MMM d')}</Text></View>
        <Text variant="label">{money(expense.amount, expense.currency)}</Text>
        <ChevronRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />
      </Pressable>)}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  breakdown: { gap: spacing.sm },
  member: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border },
  history: { gap: spacing.md },
  expense: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.minTouchTarget, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  expenseCopy: { flex: 1, gap: spacing.xs },
});
