import { router } from 'expo-router';
import { ArrowUpRight, Wallet } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';
import type { ExpenseSummary, ExpenseVisibility } from '@/types/expense';

const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
export function ExpenseSummaryCard({ summary, loading, error, visibility, onRetry }: { summary?: ExpenseSummary; loading: boolean; error: boolean; visibility: ExpenseVisibility; onRetry: () => void }) {
  const label = error ? 'Spending summary unavailable · Tap to retry' : summary ? `${money(summary.totalAmount)} ${visibility === 'shared' ? 'together' : 'personal'} this month` : `No ${visibility === 'shared' ? 'shared' : 'personal'} spending yet`;
  return <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Money summary unavailable. Retry' : 'Open money dashboard'} onPress={error ? onRetry : () => router.push('/money')}>
    <DashboardCard title="Money" icon={Wallet} subtitle="A clear view of what you handle together" badge="This month">
      <View style={styles.row}><View style={styles.copy}><Text variant="title">{label}</Text><Text variant="caption" tone="secondary">{visibility === 'shared' ? 'See who paid and where the balance stands.' : 'Only you can see personal spending.'}</Text></View>{loading ? <ActivityIndicator color={colors.accent} /> : <ArrowUpRight color={colors.accent} size={layout.iconSize} />}</View>
    </DashboardCard>
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, copy: { flex: 1, gap: spacing.xs } });
