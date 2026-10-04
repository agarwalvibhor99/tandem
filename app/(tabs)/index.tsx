import { format } from 'date-fns';
import { DashboardTasksCard } from '@/components/dashboard/dashboard-tasks-card';
import { FreeTimeCard } from '@/components/calendar/free-time-card';
import { AtAGlanceCard } from '@/components/dashboard/at-a-glance-card';
import { PartnerStatusCard } from '@/components/dashboard/partner-status-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { CompletionNotice } from '@/components/tasks/completion-notice';
import { UpcomingRemindersCard } from '@/components/dashboard/upcoming-reminders-card';
import { DateIdeaSuggestionCard } from '@/components/dashboard/date-idea-suggestion-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useTodayDashboard } from '@/hooks/use-today-dashboard';
import { dashboardGreeting } from '@/lib/dashboard/greeting';
import type { Task } from '@/types/task';

export default function TodayScreen() {
  const dashboard = useTodayDashboard();
  const { couple, members, today, upcoming, shared } = dashboard;
  const taskProps = { pendingIds: dashboard.pendingIds, nameFor: dashboard.nameFor, onComplete: (task: Task) => dashboard.complete.mutate({ task, status: 'completed' }) };
  return <Screen eyebrow="Today" pageTitle="Today" title={dashboardGreeting(dashboard.profile.data?.name, dashboard.now.getHours())} description={format(dashboard.now, 'EEEE, MMMM d, yyyy')}>
    <PartnerStatusCard loading={couple.isPending || members.isPending} error={couple.isError || members.isError} partnerName={dashboard.partner?.name} spaceName={couple.data?.name} hasSpace={!!couple.data} onRetry={() => { void couple.refetch(); void members.refetch(); }} />
    {dashboard.partner && <FreeTimeCard block={dashboard.bestFreeBlock} empty={!!dashboard.calendar.data?.length} loading={dashboard.calendar.isPending} error={dashboard.calendar.isError} onRetry={() => void dashboard.calendar.refetch()} />}
    <QuickActions />
    <CompletionNotice />
    <DashboardTasksCard section="today" tasks={dashboard.todayTasks} loading={today.isPending} error={today.isError} onRetry={() => void today.refetch()} {...taskProps} />
    <AtAGlanceCard sharedCount={dashboard.sharedCount} sharedLoading={dashboard.sharedLoading} sharedError={dashboard.sharedError} onSharedRetry={() => { void couple.refetch(); if (couple.data) void shared.refetch(); }} groceryCount={dashboard.groceryCount} groceryLoading={dashboard.groceryLoading} groceryError={dashboard.groceryError} onGroceryRetry={() => { void couple.refetch(); if (couple.data) void dashboard.groceries.refetch(); }} spending={dashboard.expenses.query.data} spendingVisibility={dashboard.expenseVisibility} spendingLoading={dashboard.expenses.query.isPending} spendingError={dashboard.expenses.query.isError} onSpendingRetry={() => { void couple.refetch(); void dashboard.expenses.query.refetch(); }} />
    {couple.data && (dashboard.reminders.query.data?.length || dashboard.reminders.query.isError) ? <UpcomingRemindersCard reminders={dashboard.reminders.query.data} loading={dashboard.reminders.query.isPending} error={dashboard.reminders.query.isError} onRetry={() => void dashboard.reminders.query.refetch()} /> : null}
    {couple.data && (dashboard.suggestedDate || dashboard.dateIdeas.query.isError) ? <DateIdeaSuggestionCard idea={dashboard.suggestedDate} freeBlock={dashboard.suggestedDateFreeBlock} loading={dashboard.dateIdeas.query.isPending} error={dashboard.dateIdeas.query.isError} onRetry={() => void dashboard.dateIdeas.query.refetch()} /> : null}
    {(dashboard.upcomingTasks.length > 0 || upcoming.isError) && <DashboardTasksCard section="upcoming" tasks={dashboard.upcomingTasks} loading={upcoming.isPending} error={upcoming.isError} onRetry={() => void upcoming.refetch()} {...taskProps} />}
    <Button label="Refresh Today" variant="quiet" loading={dashboard.refreshing} onPress={() => void dashboard.refresh()} />
  </Screen>;
}
