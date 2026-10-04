import { addDays } from 'date-fns';
import { useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCalendarWindow } from '@/hooks/use-calendar';
import { cancelUserCalendarEventNotifications, syncCalendarEventNotifications } from '@/lib/calendar/notifications';

export function CalendarNotificationProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const userId = auth.session?.user.id;
  const lastUserId = useRef<string | null>(null);
  const window = useMemo(() => {
    const start = new Date();
    return { start, end: addDays(start, 30) };
  }, [userId]);
  const events = useCalendarWindow(window.start, window.end, !!userId);
  useEffect(() => {
    if (auth.status === 'signedOut' && lastUserId.current) {
      void cancelUserCalendarEventNotifications(lastUserId.current);
      lastUserId.current = null;
      return;
    }
    if (userId && lastUserId.current && lastUserId.current !== userId) void cancelUserCalendarEventNotifications(lastUserId.current);
    if (userId) lastUserId.current = userId;
  }, [auth.status, userId]);
  useEffect(() => {
    if (!userId || !events.isSuccess) return;
    void syncCalendarEventNotifications(events.data ?? [], userId).catch(() => undefined);
  }, [userId, events.data, events.isSuccess]);
  return children;
}
