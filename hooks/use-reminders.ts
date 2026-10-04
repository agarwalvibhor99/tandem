import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { getReminderApi } from '@/services/reminders';
import type { Reminder, ReminderInput, ReminderVisibility, UpcomingReminder } from '@/types/reminder';
import { nextReminderOccurrence } from '@/lib/reminders/recurrence';

export const reminderKeys = {
  all: (userId: string) => ['reminders', userId] as const,
  list: (userId: string, visibility: ReminderVisibility, coupleId: string) => [...reminderKeys.all(userId), 'list', visibility, coupleId] as const,
  upcoming: (userId: string, coupleId: string) => [...reminderKeys.all(userId), 'upcoming', coupleId] as const,
  detail: (userId: string, id: string) => [...reminderKeys.all(userId), 'detail', id] as const,
};

export function useReminders(visibility: ReminderVisibility = 'private', active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const query = useQuery({ queryKey: reminderKeys.list(userId, visibility, coupleId), enabled: !!userId && active && (visibility === 'private' || !!coupleId), queryFn: ({ signal }) => getReminderApi().all(visibility, visibility === 'shared' ? coupleId : null, signal) });
  return { couple, query };
}

export function useUpcomingSharedReminders(active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const query = useQuery({ queryKey: reminderKeys.upcoming(userId, coupleId), enabled: !!userId && !!coupleId && active, queryFn: async ({ signal }) => {
    const now = new Date();
    const rows = await getReminderApi().upcomingShared(coupleId, now.toISOString(), signal);
    return rows.map((reminder) => ({ reminder, nextAt: nextReminderOccurrence(reminder.remind_at, reminder.recurrence, now) }))
      .filter((entry): entry is { reminder: Reminder; nextAt: Date } => entry.nextAt !== null)
      .sort((a, b) => a.nextAt.getTime() - b.nextAt.getTime())
      .slice(0, 3)
      .map(({ reminder, nextAt }): UpcomingReminder => ({ ...reminder, next_occurrence_at: nextAt.toISOString() }));
  } });
  return { couple, query };
}

export function useReminder(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: reminderKeys.detail(userId, id), enabled: !!userId && !!id, queryFn: ({ signal }) => getReminderApi().get(id, signal) });
}

export function useReminderActions() {
  const userId = useAuth().session?.user.id ?? '';
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: reminderKeys.all(userId) });
  const create = useMutation({ mutationFn: (input: ReminderInput) => getReminderApi().create(input), networkMode: 'always', onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ reminder, input }: { reminder: Reminder; input: ReminderInput }) => getReminderApi().update(reminder, input), networkMode: 'always', onSuccess: refresh });
  const complete = useMutation({ mutationFn: ({ reminder, completed }: { reminder: Reminder; completed: boolean }) => getReminderApi().complete(reminder, completed), networkMode: 'always', onSettled: refresh });
  const remove = useMutation({ mutationFn: (reminder: Reminder) => getReminderApi().remove(reminder), networkMode: 'always', onSuccess: refresh });
  return { create, update, complete, remove };
}
