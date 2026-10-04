import { router } from 'expo-router';
import { ArrowUpRight, Bell } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';
import type { UpcomingReminder } from '@/types/reminder';

export function UpcomingRemindersCard({ reminders, loading, error, onRetry }: { reminders?: UpcomingReminder[]; loading: boolean; error: boolean; onRetry: () => void }) {
  const first = reminders?.[0];
  return <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Reminders unavailable. Retry' : 'Open reminders'} onPress={error ? onRetry : () => router.push('/reminders')}>
    <DashboardCard title="Reminders" icon={Bell} subtitle="The next shared nudge" badge={first ? `${reminders?.length ?? 0} upcoming` : undefined}>
      <View style={styles.row}><View style={styles.copy}>{error ? <Text variant="heading">Reminders unavailable</Text> : first ? <><Text variant="heading">{first.title}</Text><Text variant="caption" tone="secondary">{new Date(first.next_occurrence_at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</Text></> : <Text variant="heading">No upcoming shared reminders</Text>}<Text variant="caption" tone="secondary">{error ? 'Tap to retry' : 'Open reminders to see the full list.'}</Text></View>{loading ? <ActivityIndicator color={colors.accent} /> : <ArrowUpRight color={colors.accent} size={layout.iconSize} />}</View>
    </DashboardCard>
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, copy: { flex: 1, gap: spacing.xs } });
