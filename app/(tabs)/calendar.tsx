import { addDays, eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EventCard } from '@/components/calendar/event-card';
import { FreeTimeCard } from '@/components/calendar/free-time-card';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
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
  return <Screen title="Calendar" description="Your plans, your partner’s time, and room to be together." pageTitle="Calendar" refreshing={query.isFetching} onRefresh={() => void query.refetch()} headerAction={<Pressable accessibilityRole="button" accessibilityLabel="Add event" onPress={() => router.push('/event/new')} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}><CalendarPlus color={colors.accent} size={layout.iconSize} strokeWidth={1.75} /></Pressable>}>
    <ChoiceChips label="View" value={view} options={(['Day', 'Week', 'Month'] as const).map((value) => ({ value, label: value }))} onChange={setView} />
    <View style={styles.navigation}><Pressable accessibilityRole="button" accessibilityLabel="Previous period" style={styles.arrow} onPress={() => setAnchor(moveCalendar(anchor, view, -1))}><Text variant="title">‹</Text></Pressable><Text variant="heading" accessibilityLiveRegion="polite">{view === 'Day' ? format(anchor, 'EEEE, MMM d') : view === 'Week' ? `${format(window.start, 'MMM d')}–${format(addDays(window.end, -1), 'MMM d')}` : format(anchor, 'MMMM yyyy')}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next period" style={styles.arrow} onPress={() => setAnchor(moveCalendar(anchor, view, 1))}><Text variant="title">›</Text></Pressable></View>
    {!isSameDay(anchor, new Date()) && <Button label="Go to today" variant="quiet" onPress={() => setAnchor(startOfDay(new Date()))} />}
    {view === 'Week' && <View style={styles.week}>{days.map((day) => { const count = visibleOn(day).length; return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityLabel={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'event' : 'events'}`} accessibilityState={{ selected: isSameDay(day, anchor) }} onPress={() => setAnchor(day)} style={[styles.day, isSameDay(day, anchor) && styles.selected]}><Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'secondary'}>{format(day, 'EEE')}</Text><Text variant="heading" tone={isSameDay(day, anchor) ? 'inverse' : 'default'}>{format(day, 'd')}</Text>{count > 0 && <Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'accent'}>•</Text>}</Pressable>; })}</View>}
    {view === 'Month' && <View style={styles.month}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <View key={index} style={styles.monthDay}><Text variant="caption" tone="secondary">{label}</Text></View>)}{days.map((day) => { const count = visibleOn(day).length; return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityLabel={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'event' : 'events'}`} accessibilityState={{ selected: isSameDay(day, anchor) }} onPress={() => setAnchor(day)} style={[styles.monthDay, isSameDay(day, anchor) && styles.selected]}><Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'default'}>{format(day, 'd')}</Text>{count > 0 && <Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'accent'}>•</Text>}</Pressable>; })}</View>}
    <ChoiceChips label="Whose plans?" value={filter} options={(['Mine', 'Partner', 'Together'] as const).map((value) => ({ value, label: value }))} onChange={setFilter} />
    {filter === 'Partner' && !partner && <EmptyState title="Connect your partner" description="Once they join, you’ll see when they’re busy without seeing private details." action={{ label: 'Invite partner', onPress: () => router.push('/invite-partner') }} />}
    {filter === 'Together' && partner && query.isSuccess && <FreeTimeCard block={best} empty={allDay.length > 0 && free.length === 0} />}
    {query.isPending && <LoadingState label="Loading calendar" />}
    {query.isError && <ErrorState message="We couldn’t load these dates." onRetry={() => void query.refetch()} />}
    {query.isSuccess && !(filter === 'Partner' && !partner) && <><Text variant="heading" accessibilityRole="header">{format(anchor, 'EEEE, MMMM d')}</Text>{visible.length === 0 ? <EmptyState title={filter === 'Partner' ? 'Nothing on their calendar yet' : filter === 'Together' ? 'No shared plans yet' : 'Your day is clear'} description={filter === 'Mine' ? 'Add a personal or shared event when something comes up.' : 'Plans added to Tandem will appear here.'} action={filter === 'Mine' ? { label: 'Add event', onPress: () => router.push('/event/new') } : undefined} /> : visible.map((event, index) => <EventCard key={event.id ?? `busy-${event.owner_id}-${event.start_at}-${index}`} event={event} viewerId={userId} ownerName={ownerName(event.owner_id)} />)}</>}
  </Screen>;
}
const styles = StyleSheet.create({ headerAction: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, backgroundColor: colors.accentSoft }, pressed: { opacity: 0.7 }, navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, arrow: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft }, week: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }, day: { flex: 1, minHeight: layout.groupedRowHeight, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.surfaceMuted }, selected: { backgroundColor: colors.accent }, month: { flexDirection: 'row', flexWrap: 'wrap' }, monthDay: { width: `${100 / 7}%`, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm } });
