import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task, TaskReminderOffsetMinutes } from '@/types/task';

const MAX_SCHEDULED_TASK_ALERTS = 100;
const taskIdOf = (request: Notifications.NotificationRequest) => {
  const id = request.content.data?.taskId;
  return typeof id === 'string' ? id : null;
};
const scheduledForUserOf = (request: Notifications.NotificationRequest) => {
  const id = request.content.data?.scheduledForUserId;
  return typeof id === 'string' ? id : null;
};

export type TaskNotificationResult = 'scheduled' | 'none' | 'denied' | 'unsupported' | 'past' | 'limit' | 'unavailable';

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

function alertDate(task: Pick<Task, 'due_at' | 'reminder_offset_minutes'>) {
  if (!task.due_at || task.reminder_offset_minutes === null) return null;
  return new Date(new Date(task.due_at).getTime() - task.reminder_offset_minutes * 60_000);
}

export function taskReminderLabel(offset: TaskReminderOffsetMinutes) {
  if (offset === null) return 'No alert';
  if (offset === 0) return 'At due time';
  if (offset === 5) return '5 minutes before';
  if (offset === 10) return '10 minutes before';
  if (offset === 15) return '15 minutes before';
  if (offset === 30) return '30 minutes before';
  if (offset === 60) return '1 hour before';
  return '1 day before';
}

export async function cancelTaskNotifications(taskId: string) {
  if (Platform.OS === 'web') return;
  const requests = await scheduledRequests();
  await Promise.all(requests.filter((request) => taskIdOf(request) === taskId).map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
}

export async function cancelUserTaskNotifications(userId: string) {
  if (Platform.OS === 'web') return;
  const requests = await scheduledRequests();
  await Promise.all(requests
    .filter((request) => !!taskIdOf(request) && scheduledForUserOf(request) === userId)
    .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier).catch(() => undefined)));
}

async function scheduleOne(task: Task, userId: string) {
  const date = alertDate(task);
  if (!date || date.getTime() <= Date.now()) return 'past' as const;
  await Notifications.scheduleNotificationAsync({
    content: { title: task.title, body: task.description || 'Task due', data: { taskId: task.id, scheduledForUserId: userId }, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
  return 'scheduled' as const;
}

export async function scheduleTaskNotification(task: Task, userId: string): Promise<TaskNotificationResult> {
  if (Platform.OS === 'web') return 'unsupported';
  try {
    await cancelTaskNotifications(task.id);
    if (task.status === 'completed') return 'none';
    if (!task.due_at || task.reminder_offset_minutes === null) return 'none';
    const date = alertDate(task);
    if (!date || date.getTime() <= Date.now()) return 'past';
    if (!(await permission(true))) return 'denied';
    const alreadyScheduled = (await scheduledRequests()).filter((request) => !!taskIdOf(request) && scheduledForUserOf(request) === userId).length;
    if (alreadyScheduled >= MAX_SCHEDULED_TASK_ALERTS) return 'limit';
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('tasks', { name: 'Tasks', importance: Notifications.AndroidImportance.DEFAULT });
    return await scheduleOne(task, userId);
  } catch {
    return 'unavailable';
  }
}
