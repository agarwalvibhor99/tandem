import { format } from 'date-fns';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share } from 'react-native';
import { ConnectionExit } from '@/components/couples/connection-exit';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useCoupleActions } from '@/hooks/use-couple-actions';
import { useCoupleInvite } from '@/hooks/use-couple-invite';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { coupleErrorMessage } from '@/lib/couples/errors';
import { formatInviteCode } from '@/lib/validation/couple';

export default function InvitePartnerScreen() {
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  const couple = useCurrentCouple();
  const members = useCoupleMembers(focused);
  const invitation = useCoupleInvite();
  const { invite } = useCoupleActions();
  const [shareError, setShareError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!focused) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [focused]);
  if ((members.data?.length ?? 0) >= 2) return <Redirect href="/partner-connected" />;
  if (couple.isSuccess && !couple.data) return <Redirect href="/create-space" />;
  const code = invitation.data;
  const active = !!code && !code.accepted_at && new Date(code.expires_at).getTime() > now;
  async function share() {
    if (!code) return;
    setShareError(false);
    try { await Share.share({ message: `Join me on Tandem! Open Tandem, choose “Join with a code”, and enter ${formatInviteCode(code.invite_code)}. This code expires in 24 hours or sooner.` }); }
    catch { setShareError(true); }
  }
  return <Screen standalone title="Invite your partner" description={couple.data ? `Your space, ${couple.data.name}, is ready. Share a code to bring your partner in.` : 'A little invitation to start sharing life together.'}>
    <Surface>
      {couple.isPending || invitation.isPending ? <ActivityIndicator color={colors.accent} accessibilityLabel="Loading invitation" /> : <>
        {(couple.isError || invitation.isError) && <Notice error message="We couldn’t load your space. Try again when you’re connected." />}
        {active && <>
          <Text tone="secondary">Your invitation code</Text>
          <Text variant="title" selectable accessibilityLabel={`Invitation code ${formatInviteCode(code.invite_code)}`}>{formatInviteCode(code.invite_code)}</Text>
          <Text variant="caption" tone="secondary">Expires {format(new Date(code.expires_at), 'MMM d, h:mm a')}. Only share it with your partner.</Text>
          <Button label="Share invitation" disabled={invite.isPending} onPress={() => void share()} />
          {shareError && <Notice message="Sharing isn’t available here. Select and copy the code above to send it to your partner." />}
        </>}
        {code && !active && <Notice message="This code is no longer available. Generate a new invitation for your partner." />}
        {invite.isError && <Notice error message={coupleErrorMessage(invite.error)} />}
        <Button label={active ? 'Replace invitation code' : 'Generate invitation code'} variant={active ? 'secondary' : 'primary'} loading={invite.isPending} onPress={() => invite.mutate()} />
        {active && <Text variant="caption" tone="secondary">Replacing the code makes the previous invitation expire.</Text>}
      </>}
    </Surface>
    <Text tone="secondary" accessibilityLiveRegion="polite">Waiting for your partner. This screen will update when they join.</Text>
    {members.isError && <Notice error message="We couldn’t check for your partner. We’ll keep trying while this screen is open." />}
    <ConnectionExit />
  </Screen>;
}
