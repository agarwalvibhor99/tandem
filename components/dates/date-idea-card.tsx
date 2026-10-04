import { formatDuration } from 'date-fns';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { spacing } from '@/constants/theme';
import { dateCategoryLabel, dateCostLabel, dateStatusLabel, type DateIdea } from '@/types/date-idea';

export function DateIdeaCard({ idea, onDone, saving = false }: { idea: DateIdea; onDone?: () => void; saving?: boolean }) {
  return <Surface>
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${idea.title}`} onPress={() => router.push({ pathname: '/date/[id]/edit', params: { id: idea.id } })} style={styles.copy}>
      <Text variant="heading">{idea.title}</Text>
      <View style={styles.meta}>
        <Text variant="caption" tone="secondary">{dateCategoryLabel[idea.category]}</Text>
        <Text variant="caption" tone="secondary">{dateCostLabel[idea.cost_level]}</Text>
        <Text variant="caption" tone="secondary">{formatDuration({ hours: Math.floor(idea.duration_minutes / 60), minutes: idea.duration_minutes % 60 })}</Text>
      </View>
      {idea.location && <Text tone="secondary">{idea.location}</Text>}
      <Text variant="caption" tone="secondary">{dateStatusLabel[idea.status]}</Text>
    </Pressable>
    {onDone && <Button label="Mark as done" variant="secondary" loading={saving} onPress={onDone} />}
  </Surface>;
}
const styles = StyleSheet.create({ copy: { gap: spacing.sm }, meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } });
