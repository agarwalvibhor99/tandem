import { addDays, eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { EventCard } from '@/components/calendar/event-card';
import { FreeTimeCard } from '@/components/calendar/free-time-card';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
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
  return <Screen title="Calendar" description="Your plans, your partner’s time, and room to be together." pageTitle="Calendar">
    <Button label="Add event" onPress={() => router.push('/event/new')} />
    <ChoiceChips label="View" value={view} options={(['Day', 'Week', 'Month'] as const).map((value) => ({ value, label: value }))} onChange={setView} />
    <View style={styles.navigation}><Pressable accessibilityRole="button" accessibilityLabel="Previous period" style={styles.arrow} onPress={() => setAnchor(moveCalendar(anchor, view, -1))}><Text variant="title">‹</Text></Pressable><Text variant="heading" accessibilityLiveRegion="polite">{view === 'Day' ? format(anchor, 'EEEE, MMM d') : view === 'Week' ? `${format(window.start, 'MMM d')}–${format(addDays(window.end, -1), 'MMM d')}` : format(anchor, 'MMMM yyyy')}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next period" style={styles.arrow} onPress={() => setAnchor(moveCalendar(anchor, view, 1))}><Text variant="title">›</Text></Pressable></View>
    {!isSameDay(anchor, new Date()) && <Button label="Go to today" variant="secondary" onPress={() => setAnchor(startOfDay(new Date()))} />}
    {view === 'Week' && <View style={styles.week}>{days.map((day) => { const count = visibleOn(day).length; return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityLabel={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'event' : 'events'}`} accessibilityState={{ selected: isSameDay(day, anchor) }} onPress={() => setAnchor(day)} style={[styles.day, isSameDay(day, anchor) && styles.selected]}><Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'secondary'}>{format(day, 'EEE')}</Text><Text variant="heading" tone={isSameDay(day, anchor) ? 'inverse' : 'default'}>{format(day, 'd')}</Text>{count > 0 && <Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'accent'}>•</Text>}</Pressable>; })}</View>}
    {view === 'Month' && <View style={styles.month}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => <View key={index} style={styles.monthDay}><Text variant="caption" tone="secondary">{label}</Text></View>)}{days.map((day) => { const count = visibleOn(day).length; return <Pressable key={day.toISOString()} accessibilityRole="button" accessibilityLabel={`${format(day, 'EEEE, MMMM d')}, ${count} ${count === 1 ? 'event' : 'events'}`} accessibilityState={{ selected: isSameDay(day, anchor) }} onPress={() => setAnchor(day)} style={[styles.monthDay, isSameDay(day, anchor) && styles.selected]}><Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'default'}>{format(day, 'd')}</Text>{count > 0 && <Text variant="caption" tone={isSameDay(day, anchor) ? 'inverse' : 'accent'}>•</Text>}</Pressable>; })}</View>}
    <ChoiceChips label="Whose plans?" value={filter} options={(['Mine', 'Partner', 'Together'] as const).map((value) => ({ value, label: value }))} onChange={setFilter} />
    {filter === 'Partner' && !partner && <Surface><Text variant="heading">Connect your partner</Text><Text tone="secondary">Once they join, you’ll see when they’re busy without seeing private details.</Text><Button label="Invite partner" variant="secondary" onPress={() => router.push('/invite-partner')} /></Surface>}
    {filter === 'Together' && partner && query.isSuccess && <FreeTimeCard block={best} empty={allDay.length > 0 && free.length === 0} />}
    {query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading calendar" />}
    {query.isError && <><Notice error message="We couldn’t load these dates." /><Button label="Try again" variant="secondary" onPress={() => void query.refetch()} /></>}
    {query.isSuccess && !(filter === 'Partner' && !partner) && <><Text variant="heading" accessibilityRole="header">{format(anchor, 'EEEE, MMMM d')}</Text>{visible.length === 0 ? <Surface><Text variant="heading">{filter === 'Partner' ? 'Nothing on their calendar yet' : filter === 'Together' ? 'No shared plans yet' : 'Your day is clear'}</Text><Text tone="secondary">{filter === 'Mine' ? 'Add a personal or shared event when something comes up.' : 'Plans added to Tandem will appear here.'}</Text>{filter === 'Mine' && <Button label="Add an event" variant="secondary" onPress={() => router.push('/event/new')} />}</Surface> : visible.map((event, index) => <EventCard key={event.id ?? `busy-${event.owner_id}-${event.start_at}-${index}`} event={event} viewerId={userId} ownerName={ownerName(event.owner_id)} />)}</>}
  </Screen>;
}
const styles = StyleSheet.create({ navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, arrow: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft }, week: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs }, day: { flex: 1, minHeight: 72, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.surfaceMuted }, selected: { backgroundColor: colors.accent }, month: { flexDirection: 'row', flexWrap: 'wrap' }, monthDay: { width: `${100 / 7}%`, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm } });
