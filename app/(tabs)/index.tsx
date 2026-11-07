import { NextPlanCard } from '@/components/dashboard/next-plan-card';
import { format } from 'date-fns';
import { useState } from 'react';
import { DashboardTasksCard } from '@/components/dashboard/dashboard-tasks-card';
import { FreeTimeCard } from '@/components/calendar/free-time-card';
import { AtAGlanceCard } from '@/components/dashboard/at-a-glance-card';
import { PartnerStatusCard } from '@/components/dashboard/partner-status-card';
import { CompletionNotice } from '@/components/tasks/completion-notice';
import { UpcomingRemindersCard } from '@/components/dashboard/upcoming-reminders-card';
import { DateIdeaSuggestionCard } from '@/components/dashboard/date-idea-suggestion-card';
import { PartnerNudge } from '@/components/dashboard/partner-nudge';
import { PartnerNudgeCelebration } from '@/components/dashboard/nudge-celebration';
import { LittleUpdatesActions, LittleUpdatesCard, type LittleUpdate } from '@/components/dashboard/little-updates-card';
import { Screen } from '@/components/ui/screen';
import { useTodayDashboard } from '@/hooks/use-today-dashboard';
import { usePartnerNudges } from '@/hooks/use-partner-nudges';
import type { PartnerNudge as PartnerNudgeRecord, PartnerNudgeType } from '@/types/nudge';
import { dashboardGreeting } from '@/lib/dashboard/greeting';
import type { Task } from '@/types/task';

export default function TodayScreen() {
  const [addUpdatesOpen, setAddUpdatesOpen] = useState(false);
  const [previewNudge, setPreviewNudge] = useState<PartnerNudgeRecord | null>(null);
  const dashboard = useTodayDashboard();
  const nudges = usePartnerNudges(!!dashboard.couple.data);
  const { couple, members, today, upcoming, shared } = dashboard;
  const nextPlan = dashboard.calendar.data?.filter(event => new Date(event.start_at) >= dashboard.now).sort((a, b) => a.start_at.localeCompare(b.start_at))[0];
  const taskProps = { pendingIds: dashboard.pendingIds, nameFor: dashboard.nameFor, onComplete: (task: Task) => dashboard.complete.mutate({ task, status: 'completed' }) };
  const latestPartnerNudge = nudges.query.data?.find((nudge) => nudge.created_by !== dashboard.userId);
  const shownNudge = previewNudge ?? latestPartnerNudge;
  const sendNudge = (type: PartnerNudgeType) => { if (dashboard.couple.data) nudges.send.mutate(type); };
  const preview = (type: PartnerNudgeType) => {
    setPreviewNudge({ id: `preview-${Date.now()}`, couple_id: '', created_by: 'local-preview', type, status: 'visible', created_at: new Date().toISOString() });
    setAddUpdatesOpen(false);
  };
  const littleUpdates = [
    dashboard.todayTasks.length > 0 ? { id: 'tasks', glyph: '☑', title: `${dashboard.todayTasks.length} to-do${dashboard.todayTasks.length === 1 ? '' : 's'} left`, detail: 'Keep the day moving', href: '/tasks' } : undefined,
    dashboard.groceryCount && dashboard.groceryCount > 0 ? { id: 'groceries', glyph: '🛒', title: `${dashboard.groceryCount} groceries to get`, detail: 'Shared shopping list', href: '/lists' } : undefined,
    nextPlan ? { id: 'plan', glyph: '♡', title: nextPlan.title, detail: `${format(new Date(nextPlan.start_at), 'EEE · h:mm a')} · Coming up`, href: nextPlan.id ? '/calendar' : undefined } : undefined,
    dashboard.reminders.query.data?.[0] ? { id: 'reminder', glyph: '⌁', title: dashboard.reminders.query.data[0].title, detail: 'Next shared reminder', href: '/reminders' } : undefined,
  ].filter(Boolean).slice(0, 3) as LittleUpdate[];
  return <Screen variant="home" overlay={shownNudge ? <PartnerNudgeCelebration key={shownNudge.id} nudge={shownNudge} /> : undefined} headerContent={<PartnerStatusCard ownName={dashboard.profile.data?.name} loading={couple.isPending || members.isPending} error={couple.isError || members.isError} partnerName={dashboard.partner?.name} spaceName={couple.data?.name} hasSpace={!!couple.data} onRetry={() => { void couple.refetch(); void members.refetch(); }} />} eyebrow="Today" pageTitle="Today" title={dashboardGreeting(dashboard.profile.data?.name, dashboard.now.getHours()).replace(' ✨', '')} description={format(dashboard.now, 'EEEE, MMMM d')} refreshing={dashboard.refreshing || nudges.query.isFetching} onRefresh={() => { void dashboard.refresh(); void nudges.query.refetch(); }}>
    {shownNudge && <PartnerNudge key={shownNudge.id} nudge={shownNudge} senderName={previewNudge ? "Local preview" : dashboard.partner?.name ?? "Partner"} onDismiss={() => previewNudge ? setPreviewNudge(null) : nudges.dismiss.mutate(shownNudge.id)} />}
    <NextPlanCard event={nextPlan} />
    <AtAGlanceCard sharedCount={dashboard.sharedCount} sharedLoading={dashboard.sharedLoading} sharedError={dashboard.sharedError} onSharedRetry={() => { void couple.refetch(); if (couple.data) void shared.refetch(); }} groceryCount={dashboard.groceryCount} groceryLoading={dashboard.groceryLoading} groceryError={dashboard.groceryError} onGroceryRetry={() => { void couple.refetch(); if (couple.data) void dashboard.groceries.refetch(); }} spending={dashboard.expenses.query.data} spendingVisibility={dashboard.expenseVisibility} spendingLoading={dashboard.expenses.query.isPending} spendingError={dashboard.expenses.query.isError} onSpendingRetry={() => { void couple.refetch(); void dashboard.expenses.query.refetch(); }} />
    {addUpdatesOpen ? <LittleUpdatesActions onClose={() => setAddUpdatesOpen(false)} onSendNudge={sendNudge} onPreviewNudge={__DEV__ ? preview : undefined} canSendNudge={!!dashboard.partner} /> : <LittleUpdatesCard updates={littleUpdates} onAdd={() => setAddUpdatesOpen(true)} />}
    {dashboard.partner && <FreeTimeCard block={dashboard.bestFreeBlock} empty={!!dashboard.calendar.data?.length} loading={dashboard.calendar.isPending} error={dashboard.calendar.isError} onRetry={() => void dashboard.calendar.refetch()} />}
    <CompletionNotice />
    <DashboardTasksCard section="today" tasks={dashboard.todayTasks} loading={today.isPending} error={today.isError} onRetry={() => void today.refetch()} {...taskProps} />
    {couple.data && (dashboard.reminders.query.data?.length || dashboard.reminders.query.isError) ? <UpcomingRemindersCard reminders={dashboard.reminders.query.data} loading={dashboard.reminders.query.isPending} error={dashboard.reminders.query.isError} onRetry={() => void dashboard.reminders.query.refetch()} /> : null}
    {couple.data && (dashboard.suggestedDate || dashboard.dateIdeas.query.isError) ? <DateIdeaSuggestionCard idea={dashboard.suggestedDate} freeBlock={dashboard.suggestedDateFreeBlock} loading={dashboard.dateIdeas.query.isPending} error={dashboard.dateIdeas.query.isError} onRetry={() => void dashboard.dateIdeas.query.refetch()} /> : null}
    {(dashboard.upcomingTasks.length > 0 || upcoming.isError) && <DashboardTasksCard section="upcoming" tasks={dashboard.upcomingTasks} loading={upcoming.isPending} error={upcoming.isError} onRetry={() => void upcoming.refetch()} {...taskProps} />}
  </Screen>;
}
