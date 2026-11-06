import { Tabs } from 'expo-router';
import { Navigation } from '@/components/navigation';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false }} tabBar={() => <Navigation />}>
    <Tabs.Screen name="index" options={{ title: 'Today' }} />
    <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
    <Tabs.Screen name="lists" options={{ title: 'Lists' }} />
    <Tabs.Screen name="money" options={{ title: 'Money' }} />
    <Tabs.Screen name="more" options={{ title: 'More' }} />
  </Tabs>;
}
