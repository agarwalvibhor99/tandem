import { format } from 'date-fns';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { DashboardTasksCard } from '@/components/dashboard/dashboard-tasks-card';
import { FreeTimeCard } from '@/components/calendar/free-time-card';
import { GroceryCountCard } from '@/components/dashboard/grocery-count-card';
import { PartnerStatusCard } from '@/components/dashboard/partner-status-card';
import { PlaceholderCard } from '@/components/dashboard/placeholder-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { SharedTasksCard } from '@/components/dashboard/shared-tasks-card';
import { CompletionNotice } from '@/components/tasks/completion-notice';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { layout, spacing } from '@/constants/theme';
import { useTodayDashboard } from '@/hooks/use-today-dashboard';
import { dashboardGreeting } from '@/lib/dashboard/greeting';
import type { Task } from '@/types/task';
import { dashboardPlaceholders } from '@/lib/dashboard/model';

export default function TodayScreen() {
  const dashboard = useTodayDashboard();
  const { fontScale } = useWindowDimensions();
  const { couple, members, today, upcoming, shared } = dashboard;
  const taskProps = { pendingIds: dashboard.pendingIds, nameFor: dashboard.nameFor, onComplete: (task: Task) => dashboard.complete.mutate({ task, status: 'completed' }) };
  return <Screen eyebrow="Today" pageTitle="Today" title={dashboardGreeting(dashboard.profile.data?.name, dashboard.now.getHours())} description={format(dashboard.now, 'EEEE, MMMM d, yyyy')}>
    <PartnerStatusCard loading={couple.isPending || members.isPending} error={couple.isError || members.isError} partnerName={dashboard.partner?.name} spaceName={couple.data?.name} hasSpace={!!couple.data} onRetry={() => { void couple.refetch(); void members.refetch(); }} />
    {dashboard.partner && <FreeTimeCard block={dashboard.bestFreeBlock} empty={!!dashboard.calendar.data?.length} loading={dashboard.calendar.isPending} error={dashboard.calendar.isError} onRetry={() => void dashboard.calendar.refetch()} />}
    <QuickActions />
    <CompletionNotice />
    <DashboardTasksCard section="today" tasks={dashboard.todayTasks} loading={today.isPending} error={today.isError} onRetry={() => void today.refetch()} {...taskProps} />
    <SharedTasksCard count={dashboard.sharedCount} loading={dashboard.sharedLoading} error={dashboard.sharedError} onRetry={() => { void couple.refetch(); if (couple.data) void shared.refetch(); }} />
    <GroceryCountCard count={dashboard.groceryCount} loading={dashboard.groceryLoading} error={dashboard.groceryError} onRetry={() => { void couple.refetch(); if (couple.data) void dashboard.groceries.refetch(); }} />
    <DashboardTasksCard section="upcoming" tasks={dashboard.upcomingTasks} loading={upcoming.isPending} error={upcoming.isError} onRetry={() => void upcoming.refetch()} {...taskProps} />
    <View style={styles.future}>
      <View style={styles.sectionHeading}><Text variant="title" accessibilityRole="header">A little more, soon</Text><Text tone="secondary">More ways to keep everyday life in sync.</Text></View>
      <View style={styles.tiles}>{dashboardPlaceholders.map((feature) => <View key={feature.id} style={[styles.tile, fontScale > 1.3 && styles.fullWidth]}><PlaceholderCard feature={feature} /></View>)}</View>
    </View>
    <Button label="Refresh Today" variant="secondary" loading={dashboard.refreshing} onPress={() => void dashboard.refresh()} />
  </Screen>;
}
const styles = StyleSheet.create({ tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }, tile: { flexBasis: '46%', flexGrow: 1, minWidth: layout.dashboardTileMinWidth }, fullWidth: { flexBasis: '100%' }, future: { gap: spacing.lg }, sectionHeading: { gap: spacing.sm } });
