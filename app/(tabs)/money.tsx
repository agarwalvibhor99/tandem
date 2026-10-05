import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useExpenseSummary, useExpenses } from '@/hooks/use-expenses';
import { categoryBreakdown, costTier, expenseTotal, expensesInPeriod, payerBreakdown, periodLabel, type ExpensePeriod } from '@/lib/expenses/analytics';
import type { Expense, ExpenseVisibility } from '@/types/expense';

const money = (value: number, currency = 'USD') => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
const periodOptions: { value: ExpensePeriod; label: string }[] = [{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' }];
const categoryEmoji: Record<string, string> = { Groceries: '🛒', Dining: '🍽️', Household: '🏠', Travel: '✈️', Entertainment: '🎟️', Transportation: '🚗', Utilities: '💡', Shopping: '🛍️', Other: '✨' };

function tierStyles(expense: Expense) {
  const tier = costTier(Number(expense.amount));
  if (tier === 'large') return { dot: styles.dotLarge, label: 'Large' };
  if (tier === 'medium') return { dot: styles.dotMedium, label: 'Medium' };
  return { dot: styles.dotSmall, label: 'Small' };
}

export default function MoneyScreen() {
  const userId = useAuth().session?.user.id ?? '';
  const members = useCoupleMembers();
  const connected = (members.data?.length ?? 0) > 1;
  const [view, setView] = useState<ExpenseVisibility>('shared');
  const [period, setPeriod] = useState<ExpensePeriod>('month');
  const selectedView: ExpenseVisibility = connected ? view : 'private';
  const summary = useExpenseSummary(selectedView);
  const history = useExpenses(selectedView);
  const periodExpenses = useMemo(() => expensesInPeriod(history.query.data ?? [], period), [history.query.data, period]);
  const categories = useMemo(() => categoryBreakdown(periodExpenses), [periodExpenses]);
  const payers = useMemo(() => payerBreakdown(periodExpenses), [periodExpenses]);
  const periodTotal = useMemo(() => expenseTotal(periodExpenses), [periodExpenses]);
  const topCategories = categories.slice(0, 4);
  const otherCategoryCount = Math.max(0, categories.length - topCategories.length);
  const nameFor = (id: string) => id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? 'Partner';
  const shared = selectedView === 'shared';
  const refreshing = members.isFetching || summary.query.isFetching || history.query.isFetching;
  const refresh = () => { void members.refetch(); void summary.query.refetch(); void history.query.refetch(); };
  const newExpense = () => router.push({ pathname: '/expense/new', params: { visibility: selectedView } });
  const settlement = shared && period === 'month' && summary.query.data?.members.length
    ? summary.query.data.members.find((member) => member.net_amount < 0)
    : undefined;
  const topPayer = payers[0];

  return <Screen title="Money" description="A clear view of what you spend, alone or together." refreshing={refreshing} onRefresh={refresh} headerAction={<Pressable accessibilityRole="button" accessibilityLabel="Add expense" onPress={newExpense} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}><Wallet color={colors.accent} size={layout.iconSize} strokeWidth={1.75} /></Pressable>}>
    <VisibilitySelector label="Spending" value={selectedView} sharedAvailable={connected} showUnavailableShared sharedLabel="Couple" onChange={setView} />
    <ChoiceChips label="Period" value={period} options={periodOptions} onChange={setPeriod} />

    {!connected && !members.isPending && !members.isError && <Notice message="Your spending is private. Connect your partner to track couple spending." />}
    {summary.query.isError && <Notice error message="We couldn’t load this month’s balance." />}

    <Surface>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryCopy}>
          <Text variant="label" tone="accent">{shared ? 'Couple spending' : 'Personal spending'} · {periodLabel(period)}</Text>
          {history.query.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading spending summary" /> : history.query.isError ? <Button label="Try again" variant="quiet" onPress={() => void history.query.refetch()} /> : <Text variant="title">{money(periodTotal)}</Text>}
        </View>
        <View style={styles.countPill}><Text variant="caption" tone="accent">{periodExpenses.length} {periodExpenses.length === 1 ? 'expense' : 'expenses'}</Text></View>
      </View>
      <View style={styles.insights}>
        {shared && period === 'month' && summary.query.isPending && <Text variant="caption" tone="secondary">Checking split…</Text>}
        {shared && period === 'month' && settlement && <View style={styles.insightRow}><Text variant="caption" tone="secondary">To settle</Text><Text variant="label">{nameFor(settlement.user_id)} owes {money(-settlement.net_amount)}</Text></View>}
        {shared && period === 'month' && summary.query.data?.members.length && !settlement && <View style={styles.insightRow}><Text variant="caption" tone="secondary">To settle</Text><Text variant="label">Nothing right now</Text></View>}
        {topPayer && <View style={styles.insightRow}><Text variant="caption" tone="secondary">Paid most</Text><Text variant="label">{nameFor(topPayer.userId)} · {money(topPayer.amount)}</Text></View>}
      </View>
    </Surface>

    <Surface>
      <Text variant="heading" accessibilityRole="header">Spending by category</Text>
      {history.query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading category spending" />}
      {history.query.isError && <Notice error message="We couldn’t load category spending." />}
      {history.query.isSuccess && categories.length === 0 && <Text tone="secondary">No {shared ? 'couple' : 'personal'} spending in {periodLabel(period).toLowerCase()}.</Text>}
      <View style={styles.categoryList}>{topCategories.map((entry) => <View key={entry.category} style={styles.categoryRow}>
        <View style={styles.categoryTop}><Text variant="label">{categoryEmoji[entry.category]} {entry.category}</Text><Text variant="label">{money(entry.amount)}</Text></View>
        <View style={styles.barTrack}><View style={[styles.barFill, { width: `${Math.max(6, entry.percentage * 100)}%` }]} /></View>
        <Text variant="caption" tone="secondary">{entry.count} {entry.count === 1 ? 'expense' : 'expenses'} · {Math.round(entry.percentage * 100)}%</Text>
      </View>)}</View>
      {otherCategoryCount > 0 && <Text variant="caption" tone="secondary">+ {otherCategoryCount} more {otherCategoryCount === 1 ? 'category' : 'categories'}</Text>}
    </Surface>

    <View style={styles.history}>
      <Text variant="heading" accessibilityRole="header">Recent expenses</Text>
      {history.query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading expenses" />}
      {history.query.isError && <><Notice error message="We couldn’t load your expenses." /><Button label="Try again" variant="quiet" onPress={() => void history.query.refetch()} /></>}
      {history.query.isSuccess && history.query.data.length === 0 && <Surface><Text variant="heading">Nothing recorded yet</Text><Text tone="secondary">Add your first {shared ? 'couple' : 'personal'} expense to see it here.</Text></Surface>}
      {history.query.data?.slice(0, 8).map((expense) => { const tier = tierStyles(expense); return <Pressable key={expense.id} accessibilityRole="button" accessibilityLabel={`${expense.title}, ${money(expense.amount, expense.currency)}, ${tier.label} spend`} onPress={() => router.push({ pathname: '/expense/[id]', params: { id: expense.id } })} style={styles.expense}>
        <View style={[styles.costDot, tier.dot]} />
        <View style={styles.expenseCopy}><Text variant="label">{expense.title}</Text><Text variant="caption" tone="secondary">{categoryEmoji[expense.category]} {expense.category} · {format(parseISO(expense.expense_date), 'MMM d')}</Text></View>
        <Text variant="label">{money(expense.amount, expense.currency)}</Text>
        <ChevronRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />
      </Pressable>; })}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  headerAction: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accentSoft },
  pressed: { opacity: 0.7 },
  summaryHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  summaryCopy: { flex: 1, gap: spacing.sm },
  countPill: { minHeight: 32, justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accentSoft, paddingHorizontal: spacing.md },
  insights: { gap: spacing.xs, paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  insightRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  categoryList: { gap: spacing.md },
  categoryRow: { gap: spacing.xs },
  categoryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  barTrack: { height: 10, borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radii.pill, backgroundColor: colors.accent },
  history: { gap: spacing.md },
  expense: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.minTouchTarget, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  costDot: { width: 8, height: 28, borderRadius: radii.pill },
  dotSmall: { backgroundColor: colors.success },
  dotMedium: { backgroundColor: colors.accent },
  dotLarge: { backgroundColor: colors.danger },
  expenseCopy: { flex: 1, gap: spacing.xs },
});
