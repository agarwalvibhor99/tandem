import { ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, reference, spacing } from '@/constants/theme';

type Props = { loading: boolean; error: boolean; partnerName?: string; spaceName?: string; ownName?: string; hasSpace: boolean; onRetry: () => void };
export function PartnerStatusCard({ loading, error, partnerName, spaceName, ownName, hasSpace, onRetry }: Props) {
  return <PressableScale accessibilityRole="button" accessibilityLabel={error ? 'Retry partner connection' : partnerName ? `Our space, connected with ${partnerName}` : 'Connect your partner to start planning together.'} disabled={loading} onPress={error ? onRetry : () => router.push(partnerName ? '/partner-connected' : hasSpace ? '/invite-partner' : '/create-space')} style={styles.strip}>
    {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel="Checking partner connection" /> : <View style={styles.avatars}>
      <View style={styles.avatar}><Text variant="count">{ownName?.trim().charAt(0).toUpperCase() || 'Y'}</Text></View>
      {partnerName && <View style={[styles.avatar, styles.partner]}><Text variant="label">{partnerName.trim().charAt(0).toUpperCase()}</Text></View>}
    </View>}
    <View style={styles.copy}>
      <Text variant="caption" style={styles.label}>{error ? 'Check connection' : partnerName ? 'Our space' : 'Better together'}</Text>
      {(!partnerName || error) && <Text variant="caption" tone="secondary">{error ? 'Tap to try again' : loading ? 'Checking your space…' : partnerName ? spaceName && spaceName !== 'Our space' ? spaceName : `You and ${partnerName}` : 'Connect your partner to start planning together.'}</Text>}
    </View>
    {partnerName && !error ? <Text variant="micro" tone="accent">● Connected</Text> : <ChevronRight color={colors.muted} size={layout.iconSize} />}
  </PressableScale>;
}
const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: reference.stripRadius, padding: reference.stripPadding, minHeight: layout.fieldHeight },
  label: { fontWeight: '700' },
  copy: { flex: 1, gap: spacing.xs },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: reference.stripAvatar, height: reference.stripAvatar, borderRadius: radii.pill, backgroundColor: colors.accentSoft, borderWidth: borders.focus, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  partner: { marginLeft: -spacing.md, backgroundColor: colors.peach },
});
