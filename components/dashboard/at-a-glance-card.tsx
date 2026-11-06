import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, reference, spacing } from '@/constants/theme';
import type { ExpenseSummary, ExpenseVisibility } from '@/types/expense';

type Metric = { label: string; detail: string; href: '/tasks' | '/lists' | '/money' | '/calendar'; loading: boolean; error: boolean; onRetry: () => void; glyph: string; badge?: string };
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);

export function AtAGlanceCard({ sharedCount, sharedLoading, sharedError, onSharedRetry, groceryCount, groceryLoading, groceryError, onGroceryRetry, spending, spendingVisibility, spendingLoading, spendingError, onSpendingRetry }: {
  sharedCount?: number; sharedLoading: boolean; sharedError: boolean; onSharedRetry: () => void;
  groceryCount?: number; groceryLoading: boolean; groceryError: boolean; onGroceryRetry: () => void;
  spending?: ExpenseSummary; spendingVisibility: ExpenseVisibility; spendingLoading: boolean; spendingError: boolean; onSpendingRetry: () => void;
}) {
  const metrics: Metric[] = [
    { label: 'To-dos', badge: `${sharedCount ?? 0} shared`, detail: 'Keep the day moving', href: '/tasks', loading: sharedLoading, error: sharedError, onRetry: onSharedRetry, glyph: '☑' },
    { label: 'Groceries', badge: `${groceryCount ?? 0} to get`, detail: 'Shared shopping list', href: '/lists', loading: groceryLoading, error: groceryError, onRetry: onGroceryRetry, glyph: '🛒' },
    { label: 'Money', detail: `${money(spending?.totalAmount ?? 0)} ${spendingVisibility === 'shared' ? 'shared' : 'personal'} this month`, href: '/money', loading: spendingLoading, error: spendingError, onRetry: onSpendingRetry, glyph: '↗' },
    { label: 'Plans', detail: 'Make time for what matters', href: '/calendar', loading: false, error: false, onRetry: () => {}, glyph: '▦' },
  ];
  return <View style={styles.section}><View style={styles.sectionHeader}><Text variant="heading" accessibilityRole="header">Our everyday</Text><PressableScale accessibilityRole="button" accessibilityLabel="See all features" onPress={() => router.push('/more')} style={styles.sectionAction}><Text variant="caption" tone="accent">See all →</Text></PressableScale></View>
    <View style={styles.grid}>
    {metrics.map(({ label, detail, href, loading, error, onRetry, glyph, badge }) => <PressableScale key={label} accessibilityRole="button" accessibilityLabel={`${label}: ${error ? 'unavailable, retry' : loading ? 'loading' : detail}`} onPress={error ? onRetry : () => router.push(href)} style={styles.row}>
      <View style={styles.top}><Text variant="glyph" accessibilityElementsHidden>{glyph}</Text>{loading ? <ActivityIndicator color={colors.accent} /> : !error && badge ? <View style={styles.badge}><Text variant="count" tone="accent">{badge}</Text></View> : null}</View>
      <View style={styles.copy}><Text variant="tileTitle">{label}</Text><Text variant="micro" tone="secondary">{error ? 'Unavailable · Tap to retry' : loading ? 'Loading…' : detail}</Text></View>
    </PressableScale>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: reference.tileGap },
  row: { flexGrow: 1, flexBasis: '45%', minWidth: layout.dashboardTileMinWidth, gap: spacing.md, minHeight: layout.metricHeight, padding: reference.tilePadding, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: borders.thin, borderColor: colors.border },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: radii.pill, backgroundColor: colors.hero, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionAction: { minHeight: layout.minTouchTarget, justifyContent: 'center' },
  copy: { gap: spacing.xs },
});
