import { Tabs } from 'expo-router';
import { CalendarDays, CircleCheck, Ellipsis, ShoppingBasket, Sun } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing, typography } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarActiveBackgroundColor: colors.accentSoft,
        tabBarLabelStyle: typography.tab,
        tabBarItemStyle: { paddingVertical: spacing.xs },
        tabBarStyle: {
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Sun color={color} size={size} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: ({ color, size }) => <CircleCheck color={color} size={size} /> }} />
      <Tabs.Screen name="lists" options={{ title: 'Lists', tabBarIcon: ({ color, size }) => <ShoppingBasket color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} /> }} />
    </Tabs>
  );
}
