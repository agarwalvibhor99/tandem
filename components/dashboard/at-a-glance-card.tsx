import { router } from 'expo-router';
import { ArrowUpRight, ListChecks, ShoppingBasket, Wallet } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';
import type { ExpenseSummary, ExpenseVisibility } from '@/types/expense';

type Metric = { label: string; detail: string; href: '/tasks' | '/lists' | '/money'; loading: boolean; error: boolean; onRetry: () => void; icon: typeof ListChecks };
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

export function AtAGlanceCard({ sharedCount, sharedLoading, sharedError, onSharedRetry, groceryCount, groceryLoading, groceryError, onGroceryRetry, spending, spendingVisibility, spendingLoading, spendingError, onSpendingRetry }: {
  sharedCount?: number; sharedLoading: boolean; sharedError: boolean; onSharedRetry: () => void;
  groceryCount?: number; groceryLoading: boolean; groceryError: boolean; onGroceryRetry: () => void;
  spending?: ExpenseSummary; spendingVisibility: ExpenseVisibility; spendingLoading: boolean; spendingError: boolean; onSpendingRetry: () => void;
}) {
  const metrics: Metric[] = [
    { label: 'Shared tasks', detail: `${sharedCount ?? 0} open`, href: '/tasks', loading: sharedLoading, error: sharedError, onRetry: onSharedRetry, icon: ListChecks },
    { label: 'Groceries', detail: `${groceryCount ?? 0} to get`, href: '/lists', loading: groceryLoading, error: groceryError, onRetry: onGroceryRetry, icon: ShoppingBasket },
    { label: spendingVisibility === 'shared' ? 'Shared spending' : 'Personal spending', detail: `${money(spending?.totalAmount ?? 0)} this month`, href: '/money', loading: spendingLoading, error: spendingError, onRetry: onSpendingRetry, icon: Wallet },
  ];
  return <DashboardCard title="At a glance" compact>
    {metrics.map(({ label, detail, href, loading, error, onRetry, icon: Icon }) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${error ? 'unavailable, retry' : loading ? 'loading' : detail}`} onPress={error ? onRetry : () => router.push(href)} style={styles.row}>
      <Icon color={colors.accent} size={layout.iconSize} strokeWidth={1.5} />
      <View style={styles.copy}><Text variant="label">{label}</Text><Text variant="caption" tone="secondary">{error ? 'Unavailable · Tap to retry' : loading ? 'Loading…' : detail}</Text></View>
      {loading ? <ActivityIndicator color={colors.accent} /> : <ArrowUpRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />}
    </Pressable>)}
  </DashboardCard>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: layout.minTouchTarget }, copy: { flex: 1, gap: spacing.xs } });
