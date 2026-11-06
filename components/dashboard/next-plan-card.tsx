import { format } from 'date-fns';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, reference, spacing } from '@/constants/theme';
import type { CalendarEntry } from '@/types/calendar';

export function NextPlanCard({ event }: { event?: CalendarEntry }) {
  return <View style={styles.section}>
    <Text variant="heading" accessibilityRole="header">Coming up</Text>
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text variant="heading">{event?.title ?? 'Make a little time for you two'}</Text>
        <Text variant="caption" tone="secondary">{event ? `${format(new Date(event.start_at), 'h:mm a')} · ${event.visibility === 'shared' ? 'Together' : 'Personal time'}` : 'A shared plan starts with a little space.'}</Text>
        <Button label={event?.id ? 'See plan ↗' : 'View calendar →'} variant="ghost" size="compact" onPress={() => event?.id ? router.push({ pathname: '/event/[id]', params: { id: event?.id } }) : router.push('/calendar')} />
      </View>
      {event && <View style={styles.date}><Text variant="eyebrow" tone="secondary">{format(new Date(event.start_at), 'MMM')}</Text><Text variant="title">{format(new Date(event.start_at), 'd')}</Text></View>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: spacing.md },
  banner: { flexDirection: 'row', gap: spacing.lg, padding: reference.bannerPadding, borderRadius: reference.bannerRadius, backgroundColor: colors.sand },
  copy: { flex: 1, gap: spacing.sm, alignItems: 'flex-start' },
  date: { minWidth: layout.iconContainerSize, height: reference.bannerDateHeight, padding: spacing.sm, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
