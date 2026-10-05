import { format } from 'date-fns';
import { router } from 'expo-router';
import { CalendarDays, LockKeyhole, UsersRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import type { CalendarEntry } from '@/types/calendar';

export function EventCard({ event, ownerName, viewerId }: { event: CalendarEntry; ownerName: string; viewerId: string }) {
  const busy = event.visibility === 'private' && event.owner_id !== viewerId;
  const Icon = busy ? LockKeyhole : event.visibility === 'shared' ? UsersRound : CalendarDays;
  return <Pressable accessibilityRole={event.id ? 'button' : 'text'} accessibilityLabel={`${event.title}, ${format(new Date(event.start_at), 'h:mm a')} to ${format(new Date(event.end_at), 'h:mm a')}, ${ownerName}`} disabled={!event.id} onPress={() => { if (event.id) router.push({ pathname: '/event/[id]', params: { id: event.id } }); }} style={[styles.card, busy && styles.busy]}>
    <View style={styles.icon}><Icon color={colors.accent} size={layout.iconSize} /></View>
    <View style={styles.copy}><Text variant="heading">{busy ? 'Busy' : event.title}</Text><Text variant="caption" tone="secondary">{format(new Date(event.start_at), 'h:mm a')}–{format(new Date(event.end_at), 'h:mm a')} · {ownerName}{event.visibility === 'shared' ? ' · Together' : ''}</Text>{!busy && !!event.location && <Text variant="caption" tone="secondary">{event.location}</Text>}</View>
  </Pressable>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', minHeight: layout.eventCardHeight, gap: spacing.md, padding: spacing.lg, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: borders.thin, borderColor: colors.border }, busy: { backgroundColor: colors.surfaceMuted }, icon: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: spacing.xs } });
