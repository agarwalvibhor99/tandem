import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useReminders } from '@/hooks/use-reminders';
import { cancelUserReminderNotifications, syncReminderNotifications } from '@/lib/reminders/notifications';

export function ReminderNotificationProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const userId = auth.session?.user.id;
  const lastUserId = useRef<string | null>(null);
  const personal = useReminders('private');
  const shared = useReminders('shared');
  useEffect(() => {
    if (auth.status === 'signedOut' && lastUserId.current) {
      void cancelUserReminderNotifications(lastUserId.current);
      lastUserId.current = null;
      return;
    }
    if (userId && lastUserId.current && lastUserId.current !== userId) void cancelUserReminderNotifications(lastUserId.current);
    if (userId) lastUserId.current = userId;
  }, [auth.status, userId]);
  useEffect(() => {
    const sharedReady = shared.couple.isSuccess && (!shared.couple.data || shared.query.isSuccess);
    if (!userId || !personal.query.isSuccess || !sharedReady) return;
    void syncReminderNotifications([...(personal.query.data ?? []), ...(shared.query.data ?? [])], userId).catch(() => undefined);
  }, [userId, personal.query.data, personal.query.isSuccess, shared.couple.data, shared.couple.isSuccess, shared.query.data, shared.query.isSuccess]);
  return children;
}
