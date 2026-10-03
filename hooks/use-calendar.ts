import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getCalendarApi } from '@/services/calendar';
import type { CalendarEvent, CalendarEventInput } from '@/types/calendar';

export const calendarKeys = {
  all: (userId: string) => ['calendar', userId] as const,
  window: (userId: string, start: string, end: string) => [...calendarKeys.all(userId), 'window', start, end] as const,
  detail: (userId: string, id: string) => [...calendarKeys.all(userId), 'detail', id] as const,
};
export function useCalendarWindow(start: Date, end: Date, active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const from = start.toISOString();
  const to = end.toISOString();
  return useQuery({ queryKey: calendarKeys.window(userId, from, to), enabled: !!userId && active,
    queryFn: ({ signal }) => getCalendarApi().window(from, to, signal) });
}
export function useCalendarEvent(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: calendarKeys.detail(userId, id), enabled: !!userId && !!id,
    queryFn: ({ signal }) => getCalendarApi().get(id, signal) });
}
export function useCalendarActions() {
  const userId = useAuth().session?.user.id ?? '';
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: calendarKeys.all(userId) });
  const create = useMutation({ mutationFn: (input: CalendarEventInput) => getCalendarApi().create(input), networkMode: 'always', onSuccess: refresh });
  const edit = useMutation({ mutationFn: ({ event, input }: { event: CalendarEvent; input: CalendarEventInput }) => getCalendarApi().edit(event, input), networkMode: 'always', onSuccess: refresh });
  const remove = useMutation({ mutationFn: (event: CalendarEvent) => getCalendarApi().remove(event), networkMode: 'always', onSuccess: refresh });
  return { create, edit, remove };
}
