import { format } from 'date-fns';
import { router } from 'expo-router';
import { ArrowUpRight, Coffee } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';
import { dateCategoryLabel, dateCostLabel, type DateIdea } from '@/types/date-idea';
import type { TimeInterval } from '@/types/calendar';

export function DateIdeaSuggestionCard({ idea, freeBlock, loading, error, onRetry }: {
  idea?: DateIdea; freeBlock?: TimeInterval; loading: boolean; error: boolean; onRetry: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={error ? 'Date ideas unavailable. Retry' : 'Open date ideas'} onPress={error ? onRetry : () => router.push('/dates')}>
    <DashboardCard title="Date idea" icon={Coffee} subtitle="Something to look forward to" badge={idea ? dateCostLabel[idea.cost_level] : undefined}>
      <View style={styles.row}><View style={styles.copy}>
        {error ? <Text variant="heading">Date ideas unavailable</Text> : idea ? <><Text variant="heading">{idea.title}</Text><Text variant="caption" tone="secondary">{dateCategoryLabel[idea.category]} · About {idea.duration_minutes} min</Text>{freeBlock && <Text variant="caption" tone="secondary">Fits your shared free time from {format(freeBlock.start, 'h:mm a')}</Text>}</> : <><Text variant="heading">Save somewhere you’d love to go</Text><Text variant="caption" tone="secondary">A little idea now makes planning later easier.</Text></>}
        {error && <Text variant="caption" tone="secondary">Tap to retry</Text>}
      </View>{loading ? <ActivityIndicator color={colors.accent} /> : <ArrowUpRight color={colors.accent} size={layout.iconSize} />}</View>
    </DashboardCard>
  </Pressable>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, copy: { flex: 1, gap: spacing.xs } });
