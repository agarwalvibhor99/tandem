import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
export function SharedTasksCard({ count, loading, error, onRetry }: { count?: number; loading: boolean; error: boolean; onRetry: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Shared task count unavailable. Retry' : `${count ?? 'Loading'} open shared tasks. View shared tasks`} onPress={error ? onRetry : () => router.push({ pathname: '/tasks', params: { filter: 'Shared' } })} style={styles.card}>
    <View style={styles.number}>{loading ? <ActivityIndicator color={colors.accent} /> : <Text variant="display" tone="accent">{error ? '—' : count ?? '—'}</Text>}</View>
    <View style={styles.copy}><Text variant="heading">Shared tasks</Text><Text variant="caption" tone="secondary">{error ? 'Count unavailable · Tap to retry' : 'Open tasks in your shared space'}</Text></View>
    <ArrowUpRight color={colors.accent} size={layout.iconSize} />
  </Pressable>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.accentSoft, padding: spacing.xl, borderRadius: radii.lg, minHeight: layout.minTouchTarget }, number: { minWidth: spacing.xxxl }, copy: { flex: 1, gap: spacing.xs } });
