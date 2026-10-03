import { Redirect, router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { useCurrentCouple } from '@/hooks/use-current-couple';

export default function PartnerConnectedScreen() {
  const couple = useCurrentCouple();
  const members = useCoupleMembers();
  if (couple.isSuccess && !couple.data) return <Redirect href="/create-space" />;
  if (members.isSuccess && members.data.length < 2) return <Redirect href="/invite-partner" />;
  return <Screen standalone title="Partner connected" description="You’re in this together. Your shared space is ready.">
    <Surface>
      {members.isPending ? <ActivityIndicator color={colors.accent} /> : members.isError ? <><Notice error message="We couldn’t load your connection." /><Button label="Try again" onPress={() => void members.refetch()} /></> : <>
        <Text variant="title">{couple.data?.name ?? 'Your shared space'}</Text>
        {members.data.map((member) => <Text key={member.id}>{member.name}</Text>)}
        <Text tone="secondary">Both of you are connected to this space.</Text>
      </>}
    </Surface>
    <Button label="Continue to Today" onPress={() => router.replace('/')} />
  </Screen>;
}
