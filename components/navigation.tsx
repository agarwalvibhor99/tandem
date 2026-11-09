import { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { CalendarDays, Home, ListChecks, Plus, Wallet } from 'lucide-react-native';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dialog } from '@/components/ui/dialog';
import { UnifiedCapture } from '@/components/capture/unified-capture';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, reference, shadows, spacing } from '@/constants/theme';

const destinations = [
  { href: '/' as const, label: 'Today', icon: Home },
  { href: '/money' as const, label: 'Money', icon: Wallet },
  { href: '/calendar' as const, label: 'Calendar', icon: CalendarDays },
  { href: '/lists' as const, label: 'Lists', icon: ListChecks },
];
export function Navigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [capture, setCapture] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const links = destinations.map(({ href, label, icon: Icon }) => <PressableScale key={href} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: pathname === href }} onPress={() => router.navigate(href)} style={styles.link}>
    <Icon color={pathname === href ? colors.accent : colors.muted} size={layout.iconSize} strokeWidth={pathname === href ? 2 : 1.5} />
    <Text variant="tab" tone={pathname === href ? 'accent' : 'secondary'}>{label}</Text>
  </PressableScale>);
  return <>
    {!keyboardOpen && <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, spacing.page) }]}>
      <View style={styles.bar}>
        {links.slice(0, 2)}
        <PressableScale accessibilityRole="button" accessibilityLabel="Quick capture: add a task, event, expense or grocery item" onPress={() => setCapture(true)} style={styles.capture}><Plus color={colors.onAccent} size={layout.featureIconSize} /></PressableScale>
        {links.slice(2)}
      </View>
    </View>}
    <Dialog visible={capture} title="What’s on your mind?" eyebrow="Tell Tandem" onClose={() => setCapture(false)} variant="sheet">
      <Text variant="caption" tone="secondary">Write it naturally. Check what Tandem understood before saving.</Text>
      <UnifiedCapture onAction={() => setCapture(false)} />
      <View style={styles.actionDivider}>
        <View style={styles.dividerLine} />
        <Text variant="caption" tone="secondary">Or choose an action</Text>
        <View style={styles.dividerLine} />
      </View>
      <QuickActions hideTitle onAction={() => setCapture(false)} />
    </Dialog>
  </>;
}
const styles = StyleSheet.create({
  shell: { backgroundColor: colors.background, borderTopWidth: borders.thin, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', maxWidth: layout.contentMaxWidth, width: '100%', alignSelf: 'center', minHeight: layout.tabBarHeight - spacing.lg },
  link: { flex: 1, minHeight: layout.minTouchTarget, justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  capture: { width: layout.tabCaptureSize, height: layout.tabCaptureSize, marginHorizontal: spacing.sm, top: -spacing.lg, borderRadius: reference.stripRadius, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  actionDivider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: borders.thin, backgroundColor: colors.border },
});
