import Head from 'expo-router/head';
import { router, usePathname } from 'expo-router';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { PairedMark } from '@/components/ui/paired-mark';
import { colors, layout, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  title: string;
  description: string;
  standalone?: boolean;
  eyebrow?: string;
  pageTitle?: string;
  headerAction?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}>;

export function Screen({ title, description, standalone = false, eyebrow = 'Tandem', pageTitle, headerAction, refreshing = false, onRefresh, children }: Props) {
  const pathname = usePathname();
  const featurePage = standalone && !['/', '/welcome', '/login', '/sign-up'].includes(pathname);
  const backDestination = pathname.startsWith('/task') ? '/tasks' as const
    : pathname.startsWith('/list') ? '/lists' as const
    : pathname.startsWith('/event') ? '/calendar' as const
    : pathname.startsWith('/expense') ? '/money' as const
    : pathname.startsWith('/reminder/') ? '/reminders' as const
    : pathname.startsWith('/date/') || pathname === '/date-planner' ? '/dates' as const
    : '/more' as const;
  return (
    <SafeAreaView style={styles.safeArea} edges={standalone ? undefined : ['top', 'left', 'right']}>
      <Head><title>{pageTitle ?? title} · Tandem</title></Head>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, onRefresh && styles.refreshableScrollContent]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressViewOffset={0} /> : undefined}
      >
        <View style={[styles.content, featurePage && styles.featureContent]}>
          {featurePage ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace(backDestination)} style={styles.back}>
            <ArrowLeft color={colors.accent} size={layout.iconSize} strokeWidth={1.75} />
          </Pressable> : <View style={styles.eyebrow}><PairedMark /><Text variant="label" tone="accent">{eyebrow}</Text></View>}
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text variant={featurePage ? 'title' : 'display'} accessibilityRole="header">{title}</Text>
              {description ? <Text variant={featurePage ? 'caption' : 'body'} tone="secondary">{description}</Text> : null}
            </View>
            {(headerAction || onRefresh) && <View style={styles.headerActions}>
              {onRefresh ? <Pressable accessibilityRole="button" accessibilityLabel={`Refresh ${title}`} accessibilityState={{ busy: refreshing }} disabled={refreshing} onPress={onRefresh} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, refreshing && styles.disabled]}>
                {refreshing ? <ActivityIndicator color={colors.accent} /> : <RefreshCw color={colors.accent} size={layout.iconSize} strokeWidth={1.75} />}
              </Pressable> : null}
              {headerAction}
            </View>}
          </View>
          {children}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: layout.pageMargin, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  refreshableScrollContent: { paddingTop: spacing.lg },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.xl,
  },
  featureContent: { gap: spacing.lg },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: layout.minTouchTarget / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  header: { flex: 1, gap: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: layout.minTouchTarget / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
});
