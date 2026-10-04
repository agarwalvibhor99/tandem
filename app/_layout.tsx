import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TaskSyncProvider } from '@/providers/task-sync-provider';
import { ListSyncProvider } from '@/providers/list-sync-provider';
import { CalendarSyncProvider } from '@/providers/calendar-sync-provider';
import { ExpenseSyncProvider } from '@/providers/expense-sync-provider';
import { ReminderNotificationProvider } from '@/providers/reminder-notification-provider';
import { ReminderSyncProvider } from '@/providers/reminder-sync-provider';
import { DateIdeaSyncProvider } from '@/providers/date-idea-sync-provider';
import { AppProviders } from '@/components/app-providers';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export const unstable_settings = { initialRouteName: '(auth)' };

function AuthenticatedNavigation() {
  const auth = useAuth();
  if (auth.status === 'restoring') {
    return (
      <Screen title="Welcome to Tandem" description="Getting things ready…" standalone>
        <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Restoring your session" />
      </Screen>
    );
  }
  if (auth.status === 'error') {
    return (
      <Screen title="Let’s reconnect" description="We couldn’t restore your session. Check your connection and try again." standalone>
        <Button label="Try again" onPress={auth.retry} />
      </Screen>
    );
  }
  return (
    <TaskSyncProvider>
    <ListSyncProvider>
    <CalendarSyncProvider>
    <ExpenseSyncProvider>
    <ReminderNotificationProvider>
    <ReminderSyncProvider>
    <DateIdeaSyncProvider>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!auth.session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!auth.session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(connection)" />
        <Stack.Screen name="task" />
        <Stack.Screen name="list" />
        <Stack.Screen name="event" />
        <Stack.Screen name="money" />
        <Stack.Screen name="expense" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="reminder" />
        <Stack.Screen name="dates" />
        <Stack.Screen name="date" />
        <Stack.Screen name="date-planner" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
    </DateIdeaSyncProvider>
    </ReminderSyncProvider>
    </ReminderNotificationProvider>
    </ExpenseSyncProvider>
    </CalendarSyncProvider>
    </ListSyncProvider>
    </TaskSyncProvider>
  );
}

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <Screen title="Let’s try that again" description="Tandem couldn’t open this screen. Please try again." standalone>
        <Button label="Try again" onPress={() => void retry()} />
      </Screen>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="dark" />
        <AuthenticatedNavigation />
      </AppProviders>
    </SafeAreaProvider>
  );
}
