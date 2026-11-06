import Head from 'expo-router/head';
import { router, usePathname } from 'expo-router';
import { ArrowLeft, RefreshCw, Sparkle } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Brand } from '@/components/ui/brand';
import { ScreenEntrance } from '@/components/ui/motion';
import { PressableScale } from '@/components/ui/pressable-scale';
import { colors, layout, radii, reference, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{ title: string; description: string; standalone?: boolean; eyebrow?: string; pageTitle?: string; headerAction?: ReactNode; headerContent?: ReactNode; variant?: 'default' | 'home'; refreshing?: boolean; onRefresh?: () => void }>;
export function Screen({ title, description, standalone = false, eyebrow, pageTitle, headerAction, headerContent, variant = 'default', refreshing = false, onRefresh, children }: Props) {
  const pathname = usePathname();
  const featurePage = standalone && !['/', '/welcome', '/login', '/sign-up'].includes(pathname);
  const backDestination = pathname.startsWith('/task') ? '/tasks' as const : pathname.startsWith('/list') ? '/lists' as const : pathname.startsWith('/event') ? '/calendar' as const : pathname.startsWith('/expense') ? '/money' as const : pathname.startsWith('/reminder/') ? '/reminders' as const : pathname.startsWith('/date/') || pathname === '/date-planner' ? '/dates' as const : '/more' as const;
  const mainPage = ['/', '/calendar', '/tasks', '/lists', '/money', '/more'].includes(pathname);
  const sectionLabel = ({ '/calendar': 'Our time', '/tasks': 'The everyday', '/lists': 'Little things, together', '/money': 'Shared, not complicated', '/more': 'Your space' } as Record<string, string>)[pathname];
  const home = variant === 'home';
  return <SafeAreaView style={styles.safeArea} edges={standalone ? undefined : ['top', 'left', 'right']}>
    <Head><title>{pageTitle ?? title} · Tandem</title></Head>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} /> : undefined}>
        <ScreenEntrance style={styles.content}>
          <View style={[styles.headerBlock, home && styles.homeHeader]}>
            {!featurePage && <View style={styles.masthead}>
              <Brand />
              <View style={styles.topActions}>
                {onRefresh && <PressableScale accessibilityRole="button" accessibilityLabel={`Refresh ${pageTitle ?? title}`} accessibilityState={{ busy: refreshing }} disabled={refreshing} onPress={onRefresh} style={styles.iconTarget}><View style={styles.iconButton}>{refreshing ? <ActivityIndicator color={colors.accent} /> : <RefreshCw color={colors.accent} size={layout.iconSize} strokeWidth={reference.iconStroke} />}</View></PressableScale>}
                {mainPage && pathname !== '/more' && <PressableScale accessibilityRole="button" accessibilityLabel="Open more and settings" onPress={() => router.navigate('/more')} style={styles.iconTarget}><View style={styles.iconButton}><Sparkle color={colors.accent} size={layout.iconSize} fill={colors.accent} strokeWidth={1} /></View></PressableScale>}
              </View>
            </View>}
            {!!title && <View style={styles.heading}>
              {(sectionLabel || home || (eyebrow && eyebrow !== 'Tandem')) && <Text variant="eyebrow" tone="secondary">{home ? description : sectionLabel ?? eyebrow}</Text>}
              <View style={styles.titleRow}>
                {featurePage && <PressableScale accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace(backDestination)} style={styles.back}><ArrowLeft color={colors.accent} size={layout.iconSize} /></PressableScale>}
                <Text variant={home ? 'editorial' : featurePage ? 'title' : 'display'} accessibilityRole="header" style={styles.title}>{title}</Text>
                {headerAction}
              </View>
              {home ? <Text variant="caption" tone="secondary">A little overview of your life together.</Text> : !!description && <Text variant="body" tone="secondary">{description}</Text>}
            </View>}
            {headerContent && <View style={styles.headerContent}>{headerContent}</View>}
          </View>
          <View style={styles.body}>{children}</View>
        </ScreenEntrance>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center' },
  headerBlock: { paddingHorizontal: reference.page, paddingTop: reference.headerTop },
  homeHeader: { backgroundColor: colors.hero, borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl, paddingBottom: spacing.xl },
  masthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: reference.headerBottom },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  iconTarget: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: reference.roundSize, height: reference.roundSize, borderRadius: radii.pill, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: spacing.sm, paddingTop: reference.greetingPadding },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, title: { flex: 1 },
  back: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  headerContent: { marginTop: reference.headerBottom },
  body: { paddingHorizontal: spacing.xl, paddingTop: reference.sectionGap, gap: reference.sectionGap },
});
