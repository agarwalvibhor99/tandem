import { Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AssigneeAvatar } from '@/components/tasks/assignee-avatar';
import { PairedMark } from '@/components/ui/paired-mark';
import { colors, spacing } from '@/constants/theme';

type Props = { loading: boolean; error: boolean; partnerName?: string; spaceName?: string; hasSpace: boolean; onRetry: () => void };
export function PartnerStatusCard({ loading, error, partnerName, spaceName, hasSpace, onRetry }: Props) {
  return <DashboardCard title={partnerName ? 'Your rhythm together' : 'Life is easier together'} icon={Users} quiet compact>
    {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel="Checking partner connection" /> : error ? <>
      <Text tone="secondary">We couldn’t check your connection. Your personal tasks are still here.</Text>
      <Button label="Check connection" variant="secondary" onPress={onRetry} />
    </> : partnerName ? <>
      <View style={styles.connected}>
        <PairedMark />
        <View style={styles.copy}>
          <Text variant="heading">You and {partnerName}</Text>
          {spaceName && <Text variant="caption" tone="secondary">{spaceName}</Text>}
        </View>
      </View>
      <AssigneeAvatar name={partnerName} tone="partner" />
    </> : <>
      <Text tone="secondary">Connect your partner to start planning together.</Text>
      <Button label={hasSpace ? 'Invite your partner' : 'Connect your partner'} variant="secondary" onPress={() => router.push(hasSpace ? '/invite-partner' : '/create-space')} />
    </>}
  </DashboardCard>;
}

const styles = StyleSheet.create({
  connected: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
});
