import { addDays, eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EventCard } from '@/components/calendar/event-card';
import { FreeTimeCard } from '@/components/calendar/free-time-card';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarWindow } from '@/hooks/use-calendar';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useScreenFocus } from '@/hooks/use-screen-focus';
import { mostUsefulFreeTime, sharedFreeTimeForEntries } from '@/lib/calendar/free-time';
import { calendarWindow, eventsOnDay, filterCalendar, moveCalendar, type CalendarFilter, type CalendarView } from '@/lib/calendar/view';

export default function CalendarScreen() {
  const [view, setView] = useState<CalendarView>('Day');
  const [filter, setFilter] = useState<CalendarFilter>('Mine');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const focused = useScreenFocus();
  const userId = useAuth().session?.user.id ?? '';
  const members = useCoupleMembers();
  const window = calendarWindow(anchor, view);
  const query = useCalendarWindow(window.start, window.end, focused);
  const allDay = eventsOnDay(query.data ?? [], anchor);
  const partner = members.data?.find((member) => member.user_id !== userId);
  const visibleOn = (day: Date) => filter === 'Partner' && !partner ? [] : filterCalendar(eventsOnDay(query.data ?? [], day), filter, userId);
  const visible = visibleOn(anchor);
  const ownerName = (id: string) => id === userId ? 'You' : partner?.name ?? 'Partner';
  const dayStart = startOfDay(anchor);
  dayStart.setHours(8);
  const dayEnd = startOfDay(anchor);
  dayEnd.setHours(22);
  const free = partner ? sharedFreeTimeForEntries(allDay, userId, partner.user_id, dayStart, dayEnd, 30) : [];
  const best = allDay.length ? mostUsefulFreeTime(free) : undefined;
  const days = view === 'Day' ? [] : eachDayOfInterval({ start: window.start, end: addDays(window.end, -1) });
  const periodLabel = view === 'Day' ? format(anchor, 'EEEE, MMM d') : view === 'Week' ? `${format(window.start, 'MMM d')}–${format(addDays(window.end, -1), 'MMM d')}` : format(anchor, 'MMMM yyyy');
  return <Screen title="Calendar" description="See what belongs to you, what’s shared, and when both of you are free." pageTitle="Calendar" refreshing={query.isFetching} onRefresh={() => void query.refetch()} headerAction={<PressableScale accessibilityRole="button" accessibilityLabel="Add event" onPress={() => router.push('/event/new')} style={styles.headerAction}><CalendarPlus color={colors.accent} size={layout.iconSize} strokeWidth={1.75} /></PressableScale>}>
    <Surface variant="panel" style={styles.controlPanel}>
      <ChoiceChips label="View" value={view} options={(['Day', 'Week', 'Month'] as const).map((value) => ({ value, label: value }))} onChange={setView} />
      <View style={styles.navigation}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Previous period" style={styles.arrow} onPress={() => setAnchor(moveCalendar(anchor, view, -1))}><Text variant="title">‹</Text></PressableScale>
        <View style={styles.periodCopy}>
          <Text variant="title" accessibilityLiveRegion="polite">{periodLabel}</Text>
          <Text variant="caption" tone="secondary">{visible.length} {visible.length === 1 ? 'plan' : 'plans'} shown</Text>
        </View>
        <PressableScale accessibilityRole="button" accessibilityLabel="Next period" style={styles.arrow} onPress={() => setAnchor(moveCalendar(anchor, view, 1))}><Text variant="title">›</Text></PressableScale>
      </View>
      {!isSameDay(anchor, new Date()) && <Button label="Go to today" variant="ghost" size="compact" onPress={() => setAnchor(startOfDay(new Date()))} />}
      {view === 'Week' && <View style={styles.week}>{days.map((day) => { const count = visibleOn(day).length; const selected = isSameDay(day, anchor); return <PressableScale key={day.toISOString()} accessibilityRole="button" accessibilityLabel={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'event' : 'events'}`} accessibilityState={{ selected }} onPress={() => setAnchor(day)} style={[styles.day, selected && styles.selected]}><Text variant="caption" tone={selected ? 'inverse' : 'secondary'}>{format(day, 'EEE')}</Text><Text variant="heading" tone={selected ? 'inverse' : 'default'}>{format(day, 'd')}</Text>{count > 0 && <View style={[styles.dot, selected && styles.dotSelected]} />}</PressableScale>; })}</View>}
      {view === 'Month' && <View style={styles.month}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <View key={index} style={styles.monthDay}><Text variant="caption" tone="secondary">{label}</Text></View>)}{days.map((day) => { const count = visibleOn(day).length; const selected = isSameDay(day, anchor); return <PressableScale key={day.toISOString()} accessibilityRole="button" accessibilityLabel={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'event' : 'events'}`} accessibilityState={{ selected }} onPress={() => setAnchor(day)} style={[styles.monthDay, selected && styles.selected]}><Text variant="caption" tone={selected ? 'inverse' : isSameDay(day, new Date()) ? 'accent' : 'default'}>{format(day, 'd')}</Text>{count > 0 && <View style={[styles.monthDot, selected && styles.dotSelected]} />}</PressableScale>; })}</View>}
      <ChoiceChips label="Whose plans?" value={filter} options={(['Mine', 'Partner', 'Together'] as const).map((value) => ({ value, label: value }))} onChange={setFilter} />
    </Surface>
    {filter === 'Partner' && !partner && <EmptyState title="Connect your partner" description="Once they join, you’ll see when they’re busy without seeing private details." action={{ label: 'Invite partner', onPress: () => router.push('/invite-partner') }} />}
    {filter === 'Together' && partner && query.isSuccess && <FreeTimeCard block={best} empty={allDay.length > 0 && free.length === 0} />}
    {query.isPending && <LoadingState label="Loading calendar" />}
    {query.isError && <ErrorState message="We couldn’t load these dates." onRetry={() => void query.refetch()} />}
    {query.isSuccess && !(filter === 'Partner' && !partner) && <View style={styles.agenda}><View style={styles.agendaHeader}><Text variant="heading" accessibilityRole="header">{format(anchor, 'EEEE, MMMM d')}</Text><Text variant="caption" tone="secondary">{filter}</Text></View>{visible.length === 0 ? <EmptyState title={filter === 'Partner' ? 'Nothing on their calendar yet' : filter === 'Together' ? 'No shared plans yet' : 'Your day is clear'} description={filter === 'Mine' ? 'Add a personal or shared event when something comes up.' : 'Plans added to Tandem will appear here.'} action={filter === 'Mine' ? { label: 'Add event', onPress: () => router.push('/event/new') } : undefined} /> : visible.map((event, index) => <EventCard key={event.id ?? `busy-${event.owner_id}-${event.start_at}-${index}`} event={event} viewerId={userId} ownerName={ownerName(event.owner_id)} />)}</View>}
  </Screen>;
}
const styles = StyleSheet.create({
  headerAction: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accentSoft },
  controlPanel: { gap: spacing.lg },
  navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  periodCopy: { flex: 1, alignItems: 'center', gap: spacing.xs },
  arrow: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, borderWidth: borders.thin, borderColor: colors.border },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  day: { flex: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', borderRadius: radii.lg, backgroundColor: colors.surfaceMuted, borderWidth: borders.thin, borderColor: colors.border, gap: spacing.xs },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  dotSelected: { backgroundColor: colors.onAccent },
  month: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.xs, borderRadius: radii.lg, backgroundColor: colors.surfaceMuted },
  monthDay: { width: `${100 / 7}%`, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, gap: 2 },
  monthDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  agenda: { gap: spacing.md },
  agendaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
});
