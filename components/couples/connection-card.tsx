import { useFocusEffect, router } from 'expo-router';
import { UsersRound } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import { useCoupleActions } from '@/hooks/use-couple-actions';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useProfile } from '@/hooks/use-profile';
import { coupleErrorMessage } from '@/lib/couples/errors';

function initialFor(name?: string | null) { return name?.trim().charAt(0).toUpperCase() || '•'; }

export function ConnectionCard({ onboarding = false, compact = false }: { onboarding?: boolean; compact?: boolean }) {
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const couple = useCurrentCouple();
  const members = useCoupleMembers(focused);
  const profile = useProfile();
  const { skip } = useCoupleActions();
  const connected = (members.data?.length ?? 0) === 2;
  const memberNames = useMemo(() => members.data?.map((member) => member.name).filter(Boolean) ?? [], [members.data]);
  const destination = connected ? '/partner-connected' : couple.data ? '/invite-partner' : '/create-space';

  if (onboarding && (profile.data?.couple_onboarding_skipped_at || couple.data)) return null;
  if (onboarding && (profile.isPending || couple.isPending)) return null;

  if (compact) {
    if (couple.isError || members.isError) return <Notice error message="We couldn’t load your shared space. Your personal space is still available." />;
    return <Pressable accessibilityRole="button" accessibilityLabel={connected ? 'View your shared space' : couple.data ? 'Invite your partner' : 'Create your shared space'} onPress={() => router.push(destination)} style={({ pressed }) => [styles.compactRow, pressed && styles.pressed]}>
      <View style={styles.avatarStack}>
        {memberNames.slice(0, 2).map((name, index) => <View key={`${name}-${index}`} style={[styles.avatar, index > 0 && styles.avatarOverlap]}><Text variant="caption" tone="accent" style={styles.avatarText}>{initialFor(name)}</Text></View>)}
        {memberNames.length === 0 && <View style={styles.iconAvatar}><UsersRound color={colors.accent} size={layout.iconSize} strokeWidth={1.75} /></View>}
      </View>
      <View style={styles.compactCopy}>
        <Text variant="heading">Our space</Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>{connected ? memberNames.join(' · ') : couple.data ? 'Invite your partner' : 'Create or join a space'}</Text>
      </View>
      <Text variant="caption" tone="accent">{connected ? 'View' : couple.data ? 'Invite' : 'Set up'}</Text>
    </Pressable>;
  }

  return <Surface>
    <Text variant="title">{couple.data?.name ?? 'A space for the two of you'}</Text>
    {couple.isError || members.isError ? <><Notice error message="We couldn’t load your shared space. Your personal space is still available." /><Button label="Try again" variant="secondary" onPress={() => { void couple.refetch(); void members.refetch(); }} /></> : <>
      <Text tone="secondary">{connected ? memberNames.join(' · ') : couple.data ? 'Your space is ready. Invite your partner to join you.' : 'Create a shared space or join your partner with their invitation code.'}</Text>
      <Button variant="primary" label={connected ? 'View connection' : couple.data ? 'Invite your partner' : 'Create your shared space'} onPress={() => router.push(destination)} />
      {!couple.data && <Button variant="secondary" label="Join with a code" onPress={() => router.push('/join-space')} />}
      {onboarding && <Button variant="secondary" label="Skip for now" loading={skip.isPending} onPress={() => skip.mutate()} />}
      {skip.isError && <Notice error message={coupleErrorMessage(skip.error)} />}
    </>}
  </Surface>;
}

const styles = StyleSheet.create({
  compactRow: { minHeight: layout.connectionRowHeight, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: borders.thin, borderColor: colors.border },
  pressed: { opacity: 0.7 },
  avatarStack: { width: layout.avatarStackWidth, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: layout.avatarSize, height: layout.avatarSize, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: borders.strong, borderColor: colors.surface },
  avatarOverlap: { marginLeft: -layout.avatarOverlap },
  iconAvatar: { width: layout.avatarSize, height: layout.avatarSize, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  avatarText: { fontWeight: '700' },
  compactCopy: { flex: 1, gap: spacing.xs },
});
