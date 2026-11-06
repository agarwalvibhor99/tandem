import { format } from 'date-fns';
import { router } from 'expo-router';
import { LockKeyhole, UsersRound } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, shadows, spacing } from '@/constants/theme';
import type { CalendarEntry } from '@/types/calendar';

export function EventCard({ event, ownerName, viewerId }: { event: CalendarEntry; ownerName: string; viewerId: string }) {
  const busy = event.visibility === 'private' && event.owner_id !== viewerId;
  const Icon = event.visibility === 'shared' ? UsersRound : LockKeyhole;
  return <PressableScale accessibilityRole={event.id ? 'button' : 'text'} accessibilityLabel={`${event.title}, ${format(new Date(event.start_at), 'h:mm a')} to ${format(new Date(event.end_at), 'h:mm a')}, ${ownerName}`} disabled={!event.id} onPress={() => { if (event.id) router.push({ pathname: '/event/[id]', params: { id: event.id } }); }} style={[styles.card, busy && styles.busy]}>
    <View style={[styles.rail, event.visibility === 'shared' && styles.sharedRail, busy && styles.busyRail]} />
    <View style={styles.time}><Text variant="caption" tone="secondary">{format(new Date(event.start_at), 'h:mm a')}</Text><Icon color={colors.muted} size={layout.iconSize} strokeWidth={1.5} /></View>
    <View style={styles.copy}>
      <View style={styles.titleRow}><Text variant="label">{busy ? 'Busy' : event.title}</Text><Text variant="caption" tone="secondary">{event.visibility === 'shared' ? 'Ours' : busy ? 'Private' : 'Mine'}</Text></View>
      <Text variant="caption" tone="secondary">{format(new Date(event.start_at), 'h:mm a')}–{format(new Date(event.end_at), 'h:mm a')} · {ownerName}</Text>
      {!busy && !!event.location && <Text variant="caption" tone="secondary">{event.location}</Text>}
    </View>
  </PressableScale>;
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', minHeight: layout.eventCardHeight, gap: spacing.md, padding: spacing.lg, paddingLeft: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: borders.thin, borderColor: colors.border, overflow: 'hidden', ...shadows.soft },
  busy: { backgroundColor: colors.surfaceMuted },
  rail: { width: layout.calendarRailWidth, alignSelf: 'stretch', borderRadius: radii.pill, backgroundColor: colors.accent },
  sharedRail: { backgroundColor: colors.sand },
  busyRail: { backgroundColor: colors.muted },
  time: { width: layout.calendarTimeWidth, gap: spacing.sm, alignItems: 'flex-start' },
  copy: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
