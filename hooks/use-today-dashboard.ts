import { useQuery } from '@tanstack/react-query';
import { useScreenFocus } from '@/hooks/use-screen-focus';
import { addDays, startOfDay } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useCalendarWindow } from '@/hooks/use-calendar';
import { useGroceryCount } from '@/hooks/use-lists';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useProfile } from '@/hooks/use-profile';
import { usePendingCompletions, useTaskActions, useTaskClock, useTasks } from '@/hooks/use-tasks';
import { projectTaskList, taskKeys } from '@/lib/tasks/optimistic';
import { getTaskApi } from '@/services/tasks';
import { mostUsefulFreeTime, sharedFreeTimeForEntries } from '@/lib/calendar/free-time';
import { useExpenseSummary } from '@/hooks/use-expenses';
import { useUpcomingSharedReminders } from '@/hooks/use-reminders';
import { useDateIdeas } from '@/hooks/use-date-ideas';
import { recommendDateIdeas } from '@/lib/dates/planner';

/** One orchestration point. Cards receive props; canonical query keys deduplicate
 * data with Tasks, More, and the existing connection / realtime providers. */
export function useTodayDashboard() {
  const focused = useScreenFocus();
  const userId = useAuth().session?.user.id ?? '';
  const profile = useProfile();
  const couple = useCurrentCouple();
  const members = useCoupleMembers(focused, 30_000);
  const expenseVisibility = (members.data?.length ?? 0) > 1 ? 'shared' as const : 'private' as const;
  const groceries = useGroceryCount(focused && !!couple.data);
  const expenses = useExpenseSummary(expenseVisibility, focused && !members.isPending && (expenseVisibility === 'private' || !!couple.data));
  const reminders = useUpcomingSharedReminders(focused && !!couple.data);
  const dateIdeas = useDateIdeas(focused && !!couple.data);
  const { now, tomorrow } = useTaskClock();
  const calendarStart = startOfDay(now);
  const calendar = useCalendarWindow(calendarStart, addDays(calendarStart, 1), focused && (members.data?.length ?? 0) > 1);
  const today = useTasks('Today', tomorrow, focused);
  const upcoming = useTasks('Upcoming', tomorrow, focused);
  const pending = usePendingCompletions();
  const { complete } = useTaskActions();
  const shared = useQuery({
    queryKey: [...taskKeys.all(userId), 'shared-count'],
    enabled: !!userId && focused && !!couple.data,
    queryFn: ({ signal }) => getTaskApi().countShared(signal),
  });
  const rows = (query: typeof today, filter: 'Today' | 'Upcoming') => projectTaskList(query.data?.pages.flat() ?? [], pending, filter, userId, tomorrow).slice(0, 3);
  const nameFor = (id: string | null) => id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? (id ? 'Partner' : 'Anyone');
  const partner = members.data?.find((member) => member.user_id !== userId);
  const freeStart = new Date(now);
  const morning = startOfDay(now); morning.setHours(8);
  if (freeStart < morning) freeStart.setTime(morning.getTime());
  const freeEnd = startOfDay(now); freeEnd.setHours(22);
  const entries = calendar.data ?? [];
  const freeBlocks = partner && freeStart < freeEnd ? sharedFreeTimeForEntries(entries, userId, partner.user_id, freeStart, freeEnd, 30) : [];
  const bestFreeBlock = entries.length ? mostUsefulFreeTime(freeBlocks) : undefined;
  const dateMatch = bestFreeBlock
    ? recommendDateIdeas(dateIdeas.query.data ?? [], [bestFreeBlock], { budget: 4, category: 'any', mood: 'any' })[0]
    : undefined;
  const suggestedDate = dateMatch?.idea ?? (dateIdeas.query.data ?? []).find((idea) => idea.status === 'want_to_do');
  const refresh = async () => {
    await Promise.all([profile.refetch(), couple.refetch(), members.refetch(), today.refetch(), upcoming.refetch(), expenses.query.refetch(), ...(couple.data ? [shared.refetch(), groceries.refetch(), reminders.query.refetch(), dateIdeas.query.refetch()] : []), ...(partner ? [calendar.refetch()] : [])]);
  };
  return {
    now, userId, profile, couple, members, today, upcoming, shared, groceries, expenses, expenseVisibility, reminders, dateIdeas, suggestedDate, suggestedDateFreeBlock: dateMatch ? bestFreeBlock : undefined, calendar, complete,
    sharedCount: couple.isSuccess && !couple.data ? 0 : shared.data,
    sharedLoading: couple.isPending || (!!couple.data && shared.isPending),
    sharedError: couple.isError || (!!couple.data && shared.isError),
    groceryCount: couple.isSuccess && !couple.data ? 0 : groceries.data,
    groceryLoading: couple.isPending || (!!couple.data && groceries.isPending),
    groceryError: couple.isError || (!!couple.data && groceries.isError),
    todayTasks: rows(today, 'Today'), upcomingTasks: rows(upcoming, 'Upcoming'),
    partner, bestFreeBlock,
    pendingIds: new Set(pending.map(({ task }) => task.id)), nameFor, refresh,
    refreshing: profile.isFetching || couple.isFetching || members.isFetching || today.isFetching || upcoming.isFetching || shared.isFetching || groceries.isFetching || expenses.query.isFetching || reminders.query.isFetching || dateIdeas.query.isFetching || calendar.isFetching,
  };
}
