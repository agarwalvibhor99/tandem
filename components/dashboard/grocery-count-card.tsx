import { router } from 'expo-router';
import { ArrowUpRight, ShoppingBasket } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
export function GroceryCountCard({ count, loading, error, onRetry }: { count?: number; loading: boolean; error: boolean; onRetry: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Grocery count unavailable. Retry' : `${count ?? 'Loading'} groceries remaining. Open lists`} onPress={error ? onRetry : () => router.push('/lists')} style={styles.card}>
    <View style={styles.icon}><ShoppingBasket color={colors.accent} size={layout.iconSize} /></View>
    <View style={styles.copy}><Text variant="heading">Groceries</Text><Text variant="caption" tone="secondary">{error ? 'Count unavailable · Tap to retry' : count === 0 ? 'Your grocery lists are clear' : count === 1 ? '1 item left to get' : `${count ?? '…'} items left to get`}</Text></View>
    {loading ? <ActivityIndicator color={colors.accent} /> : <ArrowUpRight color={colors.accent} size={layout.iconSize} />}
  </Pressable>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, borderRadius: radii.lg, minHeight: 88 }, icon: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: spacing.xs } });
