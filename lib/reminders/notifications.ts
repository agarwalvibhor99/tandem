import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderSchedule } from '@/lib/reminders/recurrence';
import type { Reminder } from '@/types/reminder';

const MAX_SCHEDULED_REMINDERS = 100;
const reminderIdOf = (request: Notifications.NotificationRequest) => {
  const id = request.content.data?.reminderId;
  return typeof id === 'string' ? id : null;
};
const scheduledForUserOf = (request: Notifications.NotificationRequest) => {
  const id = request.content.data?.scheduledForUserId;
  return typeof id === 'string' ? id : null;
};

export type ReminderNotificationResult = 'scheduled' | 'denied' | 'unsupported' | 'past' | 'limit' | 'unavailable';

async function permission(request: boolean): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!request || current.canAskAgain === false) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function triggerFor(reminder: Reminder): Notifications.NotificationTriggerInput {
  const schedule = reminderSchedule(reminder.remind_at, reminder.recurrence);
  if (schedule.kind === 'date') return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: schedule.date };
  if (schedule.kind === 'daily') {
    return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: schedule.hour, minute: schedule.minute };
  }
  if (schedule.kind === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: schedule.weekday,
      hour: schedule.hour,
      minute: schedule.minute,
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
    day: schedule.day,
    hour: schedule.hour,
    minute: schedule.minute,
  };
}

async function scheduledRequests() {
  try { return await Notifications.getAllScheduledNotificationsAsync(); } catch { return []; }
}

export async function cancelReminderNotifications(reminderId: string) {
  if (Platform.OS === 'web') return;
  const requests = await scheduledRequests();
  await Promise.all(requests.filter((request) => reminderIdOf(request) === reminderId).map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
}

export async function cancelUserReminderNotifications(userId: string) {
  if (Platform.OS === 'web') return;
  const requests = await scheduledRequests();
  await Promise.all(requests
    .filter((request) => !!reminderIdOf(request) && scheduledForUserOf(request) === userId)
    .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
}

async function scheduleOne(reminder: Reminder, userId: string) {
  const trigger = triggerFor(reminder);
  if (reminder.recurrence === 'none' && new Date(reminder.remind_at).getTime() <= Date.now()) return 'past' as const;
  await Notifications.scheduleNotificationAsync({
    content: { title: reminder.title, body: reminder.notes || 'Tandem reminder', data: { reminderId: reminder.id, scheduledForUserId: userId }, sound: 'default' },
    trigger,
  });
  return 'scheduled' as const;
}

export async function scheduleReminderNotifications(reminder: Reminder, userId: string): Promise<ReminderNotificationResult> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    await cancelReminderNotifications(reminder.id);
    if (reminder.completed) return 'past';
    if (reminder.recurrence === 'none' && new Date(reminder.remind_at).getTime() <= Date.now()) return 'past';
    if (!(await permission(true))) return 'denied';
    const alreadyScheduled = (await scheduledRequests()).filter((request) => !!reminderIdOf(request) && scheduledForUserOf(request) === userId).length;
    if (alreadyScheduled >= MAX_SCHEDULED_REMINDERS) return 'limit';
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
    return await scheduleOne(reminder, userId);
  } catch {
    return 'unavailable';
  }
}

export async function syncReminderNotifications(reminders: Reminder[], userId: string) {
  if (Platform.OS === 'web') return;
  try {
  if (!(await permission(false))) return;
  const requests = await scheduledRequests();
  const byReminder = new Map<string, Notifications.NotificationRequest>();
  const byId = new Map(reminders.map((reminder) => [reminder.id, reminder]));
  const toCancel = requests.filter((request) => {
    const reminderId = reminderIdOf(request);
    if (!reminderId) return false;
    if (scheduledForUserOf(request) !== userId) return true;
    const reminder = byId.get(reminderId);
    return !reminder || reminder.completed || (reminder.recurrence === 'none' && new Date(reminder.remind_at).getTime() <= Date.now());
  });
  await Promise.all(toCancel.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
  for (const request of requests) {
    const reminderId = reminderIdOf(request);
    if (reminderId && scheduledForUserOf(request) === userId && byId.has(reminderId)) byReminder.set(reminderId, request);
  }
  let scheduled = byReminder.size;
  for (const reminder of reminders) {
    if (reminder.completed || byReminder.has(reminder.id) || scheduled >= MAX_SCHEDULED_REMINDERS) continue;
    const result = await scheduleOne(reminder, userId);
    if (result === 'scheduled') scheduled += 1;
  }
  } catch {
    // A device notification failure must never interrupt normal reminder use.
  }
}
