import { ConnectionCard } from '@/components/couples/connection-card';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, ChevronRight, Coffee, Settings, UserRound, X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { authErrorMessage } from '@/lib/auth/errors';

type MoreRowProps = {
  title: string;
  description: string;
  icon: typeof Bell;
  onPress: () => void;
};

function MoreRow({ title, description, icon: Icon, onPress }: MoreRowProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.icon}>
        <Icon color={colors.accent} size={layout.iconSize} strokeWidth={1.75} />
      </View>
      <View style={styles.rowCopy}>
        <Text variant="heading">{title}</Text>
        <Text variant="caption" tone="secondary">{description}</Text>
      </View>
      <ChevronRight color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function MoreScreen() {
  const auth = useAuth();
  const profile = useProfile();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setError(null);
    try { await auth.logout(); }
    catch (cause) { setError(authErrorMessage(cause)); }
    finally { setLoggingOut(false); }
  }

  return (
    <Screen title="More" description="Your shared life, all in one place." headerAction={
      <Pressable accessibilityRole="button" accessibilityLabel="Open account settings" onPress={() => setAccountOpen(true)} style={({ pressed }) => [styles.accountButton, pressed && styles.rowPressed]}>
        <UserRound color={colors.accent} size={layout.iconSize} strokeWidth={1.75} />
      </Pressable>
    }>
      <Surface>
        <Text variant="title" accessibilityRole="header">Settings and spaces</Text>
        <View style={styles.rows}>
          <ConnectionCard compact />
          <MoreRow title="Reminders" description="Private or shared nudges" icon={Bell} onPress={() => router.push('/reminders')} />
          <MoreRow title="Date ideas" description="Saved plans and date planner" icon={Coffee} onPress={() => router.push('/dates')} />
        </View>
      </Surface>
      <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={() => setAccountOpen(false)}>
        <View style={styles.backdrop}>
          <Surface>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitle}>
                <View style={styles.icon}>
                  <Settings color={colors.accent} size={layout.iconSize} strokeWidth={1.75} />
                </View>
                <View style={styles.rowCopy}>
                  <Text variant="title" accessibilityRole="header">Settings</Text>
                  <Text variant="caption" tone="secondary">Account and sign out</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={() => setAccountOpen(false)} style={styles.closeButton}>
                <X color={colors.textSecondary} size={layout.iconSize} strokeWidth={1.75} />
              </Pressable>
            </View>
            {profile.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading your profile" /> : profile.isError ? (
              <>
                <Notice error message="We couldn’t load your profile. You can try again or log out below." />
                <Button label="Try again" variant="quiet" loading={profile.isFetching} onPress={() => void profile.refetch()} />
              </>
            ) : (
              <View style={styles.accountRow}>
                <View style={styles.icon}>
                  <UserRound color={colors.accent} size={layout.iconSize} strokeWidth={1.75} />
                </View>
                <View style={styles.rowCopy}>
                  <Text variant="heading">{profile.data.name}</Text>
                  <Text variant="caption" tone="secondary">{profile.data.email}</Text>
                </View>
              </View>
            )}
            {error && <Notice error message={error} />}
            <Button label="Log out" variant="quiet" loading={loggingOut} onPress={() => void logout()} />
          </Surface>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountButton: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  rows: { gap: spacing.xs },
  row: {
    minHeight: layout.listRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: borders.thin,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.7 },
  icon: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  rowCopy: { flex: 1, gap: spacing.xs },
  accountRow: { minHeight: layout.listRowHeight, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    backgroundColor: colors.scrim,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  modalTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  closeButton: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
});
