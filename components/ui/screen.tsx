import Head from 'expo-router/head';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  title: string;
  description: string;
  standalone?: boolean;
  eyebrow?: string;
  pageTitle?: string;
}>;

export function Screen({ title, description, standalone = false, eyebrow = 'Tandem', pageTitle, children }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={standalone ? undefined : ['top', 'left', 'right']}>
      <Head><title>{pageTitle ?? title} · Tandem</title></Head>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.content}>
          <Text variant="label" tone="accent">{eyebrow}</Text>
          <View style={styles.header}>
            <Text variant="display" accessibilityRole="header">{title}</Text>
            <Text tone="secondary">{description}</Text>
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
  scrollContent: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxxl },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    gap: spacing.xxl,
  },
  header: { gap: spacing.sm },
});
