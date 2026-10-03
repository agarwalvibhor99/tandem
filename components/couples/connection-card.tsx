import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useCoupleActions } from '@/hooks/use-couple-actions';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useProfile } from '@/hooks/use-profile';
import { coupleErrorMessage } from '@/lib/couples/errors';

export function ConnectionCard({ onboarding = false }: { onboarding?: boolean }) {
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const couple = useCurrentCouple();
  const members = useCoupleMembers(focused);
  const profile = useProfile();
  const { skip } = useCoupleActions();
  if (onboarding && (profile.data?.couple_onboarding_skipped_at || couple.data)) return null;
  if (onboarding && (profile.isPending || couple.isPending)) return null;
  const connected = (members.data?.length ?? 0) === 2;
  return <Surface>
    <Text variant="title">{couple.data?.name ?? 'A space for the two of you'}</Text>
    {couple.isError || members.isError ? <><Notice error message="We couldn’t load your shared space. Your personal space is still available." /><Button label="Try again" variant="secondary" onPress={() => { void couple.refetch(); void members.refetch(); }} /></> : <>
      <Text tone="secondary">{connected ? members.data?.map((member) => member.name).join(' · ') : couple.data ? 'Your space is ready. Invite your partner to join you.' : 'Create a shared space or join your partner with their invitation code.'}</Text>
      <Button label={connected ? 'View connection' : couple.data ? 'Invite your partner' : 'Create your shared space'} onPress={() => router.push(connected ? '/partner-connected' : couple.data ? '/invite-partner' : '/create-space')} />
      {!couple.data && <Button variant="secondary" label="Join with a code" onPress={() => router.push('/join-space')} />}
      {onboarding && <Button variant="secondary" label="Skip for now" loading={skip.isPending} onPress={() => skip.mutate()} />}
      {skip.isError && <Notice error message={coupleErrorMessage(skip.error)} />}
    </>}
  </Surface>;
}
