import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { CalendarEntry, CalendarEvent } from '@/types/calendar';

const MAX_SCHEDULED_CALENDAR_ALERTS = 100;
const eventIdOf = (request: Notifications.NotificationRequest) => {
  const id = request.content.data?.calendarEventId;
  return typeof id === 'string' ? id : null;
};
const scheduledForUserOf = (request: Notifications.NotificationRequest) => {
  const id = request.content.data?.scheduledForUserId;
  return typeof id === 'string' ? id : null;
};

export type CalendarNotificationResult = 'scheduled' | 'none' | 'denied' | 'unsupported' | 'past' | 'limit' | 'unavailable';

async function permission(request: boolean): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!request || current.canAskAgain === false) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

async function scheduledRequests() {
  try { return await Notifications.getAllScheduledNotificationsAsync(); } catch { return []; }
}

function alertDate(event: Pick<CalendarEvent, 'start_at' | 'reminder_offset_minutes'>) {
  if (event.reminder_offset_minutes === null) return null;
  return new Date(new Date(event.start_at).getTime() - event.reminder_offset_minutes * 60_000);
}

export function calendarReminderLabel(offset: CalendarEvent['reminder_offset_minutes']) {
  if (offset === null) return 'No alert';
  if (offset === 0) return 'At start time';
  if (offset === 5) return '5 minutes before';
  if (offset === 10) return '10 minutes before';
  if (offset === 15) return '15 minutes before';
  if (offset === 30) return '30 minutes before';
  if (offset === 60) return '1 hour before';
  return '1 day before';
}

export async function cancelCalendarEventNotifications(eventId: string) {
  if (Platform.OS === 'web') return;
  const requests = await scheduledRequests();
  await Promise.all(requests.filter((request) => eventIdOf(request) === eventId).map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
}

export async function cancelUserCalendarEventNotifications(userId: string) {
  if (Platform.OS === 'web') return;
  const requests = await scheduledRequests();
  await Promise.all(requests
    .filter((request) => !!eventIdOf(request) && scheduledForUserOf(request) === userId)
    .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
}

async function scheduleOne(event: CalendarEvent | CalendarEntry, userId: string) {
  if (!event.id || event.reminder_offset_minutes === null) return 'none' as const;
  const date = alertDate(event);
  if (!date || date.getTime() <= Date.now()) return 'past' as const;
  await Notifications.scheduleNotificationAsync({
    content: { title: event.title, body: 'Calendar event', data: { calendarEventId: event.id, scheduledForUserId: userId }, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
  return 'scheduled' as const;
}

export async function scheduleCalendarEventNotification(event: CalendarEvent, userId: string): Promise<CalendarNotificationResult> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    await cancelCalendarEventNotifications(event.id);
    if (event.reminder_offset_minutes === null) return 'none';
    const date = alertDate(event);
    if (!date || date.getTime() <= Date.now()) return 'past';
    if (!(await permission(true))) return 'denied';
    const alreadyScheduled = (await scheduledRequests()).filter((request) => !!eventIdOf(request) && scheduledForUserOf(request) === userId).length;
    if (alreadyScheduled >= MAX_SCHEDULED_CALENDAR_ALERTS) return 'limit';
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('calendar', { name: 'Calendar', importance: Notifications.AndroidImportance.DEFAULT });
    return await scheduleOne(event, userId);
  } catch {
    return 'unavailable';
  }
}

export async function syncCalendarEventNotifications(events: CalendarEntry[], userId: string) {
  if (Platform.OS === 'web') return;
  try {
    if (!(await permission(false))) return;
    const requests = await scheduledRequests();
    const eligible = events.filter((event) => !!event.id && event.reminder_offset_minutes !== null && new Date(event.start_at).getTime() > Date.now());
    const byId = new Map(eligible.map((event) => [event.id, event]));
    const toCancel = requests.filter((request) => {
      const eventId = eventIdOf(request);
      if (!eventId) return false;
      if (scheduledForUserOf(request) !== userId) return true;
      return !byId.has(eventId);
    });
    await Promise.all(toCancel.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
    const scheduledByEvent = new Map<string, Notifications.NotificationRequest>();
    for (const request of requests) {
      const eventId = eventIdOf(request);
      if (eventId && scheduledForUserOf(request) === userId && byId.has(eventId)) scheduledByEvent.set(eventId, request);
    }
    let scheduled = scheduledByEvent.size;
    for (const event of eligible) {
      if (!event.id || scheduledByEvent.has(event.id) || scheduled >= MAX_SCHEDULED_CALENDAR_ALERTS) continue;
      const result = await scheduleOne(event, userId);
      if (result === 'scheduled') scheduled += 1;
    }
  } catch {
    // A device notification failure must never interrupt normal calendar use.
  }
}
