import { Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';

type Props = { loading: boolean; error: boolean; partnerName?: string; spaceName?: string; hasSpace: boolean; onRetry: () => void };
export function PartnerStatusCard({ loading, error, partnerName, spaceName, hasSpace, onRetry }: Props) {
  return <DashboardCard title={partnerName ? 'Your shared space' : 'Life is easier together'} icon={Users} quiet compact>
    {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel="Checking partner connection" /> : error ? <>
      <Text tone="secondary">We couldn’t check your connection. Your personal tasks are still here.</Text>
      <Button label="Check connection" variant="secondary" onPress={onRetry} />
    </> : partnerName ? <>
      <Text variant="heading">Connected with {partnerName}</Text>
      {spaceName && <Text variant="caption" tone="secondary">{spaceName}</Text>}
    </> : <>
      <Text tone="secondary">Connect your partner to start planning together.</Text>
      <Button label={hasSpace ? 'Invite your partner' : 'Connect your partner'} variant="secondary" onPress={() => router.push(hasSpace ? '/invite-partner' : '/create-space')} />
    </>}
  </DashboardCard>;
}
