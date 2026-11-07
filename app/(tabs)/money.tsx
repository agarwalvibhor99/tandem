import { Reveal } from '@/components/ui/motion';
import { format, parseISO } from 'date-fns';
import { router } from 'expo-router';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import { colors, layout, radii, reference, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useExpenseActions, useExpenseBalance, useExpenseSummary, useExpenses } from '@/hooks/use-expenses';
import { categoryBreakdown, costTier, expenseTotal, expensesInPeriod, payerBreakdown, periodLabel, type ExpensePeriod } from '@/lib/expenses/analytics';
import { fromCents } from '@/lib/expenses/calculations';
import { expenseExportFilename, expensesToCsv } from '@/lib/expenses/export';
import { filterExpenses } from '@/lib/expenses/filters';
import { expenseCategories, type Expense, type ExpenseCategory, type ExpenseVisibility } from '@/types/expense';

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
  const [expenseName, setExpenseName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleNotice, setSettleNotice] = useState<string | null>(null);
  const [settleError, setSettleError] = useState<string | null>(null);
  const selectedView: ExpenseVisibility = connected ? view : 'private';
  const summary = useExpenseSummary(selectedView);
  const history = useExpenses(selectedView);
  const balance = useExpenseBalance(selectedView, !members.isPending && (selectedView === 'private' || connected));
  const { create: createExpense } = useExpenseActions();
  const periodExpenses = useMemo(() => expensesInPeriod(history.query.data ?? [], period), [history.query.data, period]);
  const historyTotal = useMemo(() => expenseTotal(history.query.data ?? []), [history.query.data]);
  const allTimeTotal = balance.query.data?.totalAmount ?? historyTotal;
  const allTimeCount = history.query.data?.length ?? 0;
  const categories = useMemo(() => categoryBreakdown(periodExpenses), [periodExpenses]);
  const payers = useMemo(() => payerBreakdown(periodExpenses), [periodExpenses]);
  const periodTotal = useMemo(() => expenseTotal(periodExpenses), [periodExpenses]);
  const filteredExpenses = useMemo(
    () => filterExpenses(history.query.data ?? [], expenseName, categoryFilter),
    [categoryFilter, expenseName, history.query.data],
  );
  const topCategories = categories.slice(0, 4);
  const otherCategoryCount = Math.max(0, categories.length - topCategories.length);
  const nameFor = (id: string) => id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? 'Partner';
  const partnerId = members.data?.find((member) => member.user_id !== userId)?.user_id;
  const youPaid = payers.find((payer) => payer.userId === userId)?.amount ?? 0;
  const partnerPaid = partnerId ? payers.find((payer) => payer.userId === partnerId)?.amount ?? 0 : 0;
  const shared = selectedView === 'shared';
  const allTimeBalance = balance.query.data?.balance;
  const refreshing = members.isFetching || summary.query.isFetching || history.query.isFetching || balance.query.isFetching;
  const refresh = () => { void members.refetch(); void summary.query.refetch(); void history.query.refetch(); void balance.query.refetch(); };
  const newExpense = () => router.push({ pathname: '/expense/new', params: { visibility: selectedView } });
  const settlement = shared && period === 'month' && summary.query.data?.members.length
    ? summary.query.data.members.find((member) => member.net_amount < 0)
    : undefined;
  const topPayer = payers[0];
  const filtersActive = !!expenseName.trim() || categoryFilter !== 'all';
  const clearFilters = () => { setExpenseName(''); setCategoryFilter('all'); };
  const settlePayment = () => {
    if (!allTimeBalance || !balance.couple.data?.id) return;
    setSettleError(null);
    createExpense.mutate({
      couple_id: balance.couple.data.id,
      title: 'Settlement payment',
      amount: fromCents(allTimeBalance.amountCents),
      currency: 'USD',
      category: 'Other',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      notes: `${nameFor(allTimeBalance.debtorId)} paid ${nameFor(allTimeBalance.creditorId)} to settle the shared balance.`,
      paid_by: allTimeBalance.debtorId,
      visibility: 'shared',
      splits: [
        { user_id: allTimeBalance.debtorId, amount: 0 },
        { user_id: allTimeBalance.creditorId, amount: fromCents(allTimeBalance.amountCents) },
      ],
    }, {
      onSuccess: () => {
        setSettleOpen(false);
        setSettleNotice('Payment recorded. Nothing to settle.');
      },
      onError: () => setSettleError('We couldn’t record the payment. Try again.'),
    });
  };
  const exportExpenses = async () => {
    setExportNotice(null);
    setExportError(null);
    if (filteredExpenses.length === 0) {
      setExportError(filtersActive ? 'No matching expenses to export.' : 'Add an expense before exporting.');
      return;
    }

    const csv = expensesToCsv(filteredExpenses, nameFor);
    const filename = expenseExportFilename(selectedView);
    try {
      setExporting(true);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: filename, message: csv });
      }
      setExportNotice(`Exported ${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'expense' : 'expenses'}.`);
    } catch {
      setExportError('We couldn’t export expenses. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return <Screen title="Money" description="Clarity without keeping score." refreshing={refreshing} onRefresh={refresh} headerAction={<Pressable accessibilityRole="button" accessibilityLabel="Add expense" onPress={newExpense} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}><Wallet color={colors.accent} size={layout.iconSize} strokeWidth={1.75} /></Pressable>}>
    <VisibilitySelector label="Spending" value={selectedView} sharedAvailable={connected} showUnavailableShared sharedLabel="Couple" onChange={setView} />
    <Surface variant="bare" style={styles.allTimeSummary}>
      <View style={styles.allTimeHeader}>
        <Text variant="caption" tone="secondary">All-time {shared ? 'couple' : 'personal'} spending</Text>
        {balance.query.isPending || history.query.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading all-time spending" /> : <View style={styles.allTimeValues}><Text variant="label">{money(allTimeTotal)}</Text><Text variant="caption" tone="secondary">· {allTimeCount} {allTimeCount === 1 ? 'expense' : 'expenses'}</Text></View>}
      </View>
      {!balance.query.isPending && <View style={styles.balanceRow}>
        <Text variant="caption" tone={allTimeBalance ? 'accent' : 'secondary'} numberOfLines={1} style={styles.balanceCopy}>
          {balance.query.isError ? 'Balance unavailable — try refreshing' : allTimeBalance ? `${nameFor(allTimeBalance.debtorId)} owes ${nameFor(allTimeBalance.creditorId)} ${money(fromCents(allTimeBalance.amountCents))}` : shared ? 'Nothing to settle' : 'Personal spending only'}
        </Text>
        {allTimeBalance && !balance.query.isError && <Button label="Settle payment" variant="secondary" size="compact" disabled={createExpense.isPending} onPress={() => { setSettleError(null); setSettleOpen(true); }} />}
      </View>}
    </Surface>
    {settleNotice && <Notice message={settleNotice} />}
    {settleError && <Notice error message={settleError} />}
    <Dialog visible={settleOpen} title="Settle payment" eyebrow="Shared balance" onClose={() => { if (!createExpense.isPending) setSettleOpen(false); }}>
      {allTimeBalance && <>
        <Text>{nameFor(allTimeBalance.debtorId)} paid {nameFor(allTimeBalance.creditorId)} {money(fromCents(allTimeBalance.amountCents))}.</Text>
        <Text tone="secondary">This records the payment in Tandem and clears the shared balance. Confirm only after the payment has been made.</Text>
        <Button label="Record payment" loading={createExpense.isPending} onPress={settlePayment} />
      </>}
    </Dialog>

    <SegmentedControl label="Period" value={period} options={periodOptions} onChange={setPeriod} />

    {!connected && !members.isPending && !members.isError && <Notice message="Your spending is private. Connect your partner to track couple spending." />}
    {summary.query.isError && <Notice error message="We couldn’t load this month’s balance." />}

    <Surface variant="inset" style={styles.spendingSummary}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryCopy}>
          <Text variant="label" tone="accent">{shared ? 'Couple spending' : 'Personal spending'} · {periodLabel(period)}</Text>
          {history.query.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading spending summary" /> : history.query.isError ? <Button label="Try again" variant="quiet" onPress={() => void history.query.refetch()} /> : <Text variant="display">{money(periodTotal)}</Text>}
        </View>
        <View style={styles.countPill}><Text variant="caption" tone="accent">{periodExpenses.length} {periodExpenses.length === 1 ? 'expense' : 'expenses'}</Text></View>
      </View>
      <View style={styles.summaryStats}>
        <View style={styles.stat}><Text variant="caption" tone="secondary">You paid</Text><Text variant="label">{money(youPaid)}</Text></View>
        {shared ? <View style={styles.stat}><Text variant="caption" tone="secondary">{partnerId ? nameFor(partnerId) : 'Partner'} paid</Text><Text variant="label">{money(partnerPaid)}</Text></View> : <View style={styles.stat}><Text variant="caption" tone="secondary">Entries</Text><Text variant="label">{periodExpenses.length}</Text></View>}
        <View style={styles.stat}><Text variant="caption" tone="secondary">{shared && period === 'month' ? 'To settle' : 'Paid most'}</Text><Text variant="label" numberOfLines={2}>{shared && period === 'month' && settlement ? `${nameFor(settlement.user_id)} owes ${money(-settlement.net_amount)}` : shared && period === 'month' ? 'Nothing to settle' : topPayer ? nameFor(topPayer.userId) : '—'}</Text></View>
      </View>
    </Surface>

    <Surface variant="bare">
      <Text variant="heading" accessibilityRole="header">Spending by category</Text>
      {history.query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading category spending" />}
      {history.query.isError && <Notice error message="We couldn’t load category spending." />}
      {history.query.isSuccess && categories.length === 0 && <Text tone="secondary">No {shared ? 'couple' : 'personal'} spending in {periodLabel(period).toLowerCase()}.</Text>}
      <View style={styles.chart}>{topCategories.map((entry, index) => <View key={entry.category} style={styles.chartColumn} accessible accessibilityLabel={`${entry.category}: ${money(entry.amount)}, ${Math.round(entry.percentage * 100)} percent`}>
        <Text variant="micro">{money(entry.amount)}</Text>
        <View style={styles.chartTrack}><Reveal variant="chart" style={[styles.chartBar, { height: `${Math.max(8, entry.amount / Math.max(...topCategories.map(category => category.amount)) * 100)}%`, backgroundColor: reference.chartColors[index] }]} /></View>
        <Text variant="micro" tone="secondary" style={styles.chartLabel}>{entry.category}</Text>
      </View>)}</View>
      {otherCategoryCount > 0 && <Text variant="caption" tone="secondary">+ {otherCategoryCount} more {otherCategoryCount === 1 ? 'category' : 'categories'}</Text>}
    </Surface>

    <View style={styles.history}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTitle}>
          <Text variant="heading" accessibilityRole="header">Recent expenses</Text>
          <Text variant="caption" tone="secondary">Export uses the visible filters.</Text>
        </View>
        <Button label="Export" variant="quiet" size="compact" loading={exporting} disabled={history.query.isPending} onPress={() => void exportExpenses()} />
      </View>
      {exportNotice && <Notice message={exportNotice} />}
      {exportError && <Notice error message={exportError} />}
      <FormField label="Search expenses" placeholder="Search by name" value={expenseName} onChangeText={setExpenseName} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
      <View style={styles.historyHeader}><Button label={filtersOpen ? 'Hide categories' : categoryFilter === 'all' ? 'Filter by category' : categoryFilter} variant="quiet" onPress={() => setFiltersOpen(!filtersOpen)} />{filtersActive && <Button label="Clear filters" variant="quiet" onPress={clearFilters} />}</View>
      {filtersOpen && <ChoiceChips label="Category" value={categoryFilter} options={[{ value: 'all', label: 'All' }, ...expenseCategories.map((category) => ({ value: category, label: category }))]} onChange={setCategoryFilter} />}
      {history.query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading expenses" />}
      {history.query.isError && <><Notice error message="We couldn’t load your expenses." /><Button label="Try again" variant="quiet" onPress={() => void history.query.refetch()} /></>}
      {history.query.isSuccess && history.query.data.length === 0 && <EmptyState title="Nothing recorded yet" description={`Add your first ${shared ? 'couple' : 'personal'} expense to see it here.`} action={{ label: 'Add expense', onPress: newExpense }} />}
      {history.query.isSuccess && history.query.data.length > 0 && filteredExpenses.length === 0 && <EmptyState title="No expenses match" description="Try another name or category." action={{ label: 'Clear filters', onPress: clearFilters }} />}
      {filteredExpenses.slice(0, 8).map((expense) => { const tier = tierStyles(expense); return <Pressable key={expense.id} accessibilityRole="button" accessibilityLabel={`${expense.title}, ${money(expense.amount, expense.currency)}, ${tier.label} spend`} onPress={() => router.push({ pathname: '/expense/[id]', params: { id: expense.id } })} style={styles.expense}>
        <View style={[styles.costDot, tier.dot]} />
        <View style={styles.expenseCopy}><Text variant="label">{expense.title}</Text><Text variant="caption" tone="secondary">{categoryEmoji[expense.category]} {expense.category} · {format(parseISO(expense.expense_date), 'MMM d')}</Text><Text variant="caption" tone="secondary">Paid by {nameFor(expense.paid_by)}</Text></View>
        <Text variant="label">{money(expense.amount, expense.currency)}</Text>
        <ChevronRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />
      </Pressable>; })}
      {filtersActive && filteredExpenses.length > 0 && <Text variant="caption" tone="secondary">Showing {Math.min(filteredExpenses.length, 8)} of {filteredExpenses.length} matching {filteredExpenses.length === 1 ? 'expense' : 'expenses'}.</Text>}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  spendingSummary: { backgroundColor: colors.hero, borderWidth: 0, padding: spacing.xl },
  allTimeSummary: { gap: spacing.xs, paddingVertical: spacing.xs },
  allTimeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  balanceCopy: { flex: 1 },
  allTimeValues: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerAction: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accentSoft },
  pressed: { opacity: 0.7 },
  summaryHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  summaryCopy: { flex: 1, gap: spacing.sm },
  countPill: { minHeight: layout.smallControlHeight, justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accentSoft, paddingHorizontal: spacing.md },
  summaryStats: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  stat: { flex: 1, gap: spacing.xs, minWidth: 0 },
  insights: { gap: spacing.xs, paddingTop: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderColor: colors.border },
  insightRow: { minHeight: layout.smallControlHeight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  chart: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md },
  chartColumn: { flex: 1, alignItems: 'center', gap: spacing.sm },
  chartTrack: { width: '100%', height: reference.chartHeight, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderTopLeftRadius: radii.sm, borderTopRightRadius: radii.sm },
  chartLabel: { textAlign: 'center' },
  history: { gap: spacing.md },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  historyTitle: { flex: 1, gap: spacing.xs },
  expense: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.minTouchTarget, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  costDot: { width: layout.spendingMarkerWidth, height: layout.spendingMarkerHeight, borderRadius: radii.pill },
  dotSmall: { backgroundColor: colors.sage },
  dotMedium: { backgroundColor: colors.accent },
  dotLarge: { backgroundColor: colors.warning },
  expenseCopy: { flex: 1, gap: spacing.xs },
});
