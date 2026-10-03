import { StyleSheet } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Text } from '@/components/ui/text';
import type { DashboardPlaceholder } from '@/lib/dashboard/model';
export function PlaceholderCard({ feature }: { feature: DashboardPlaceholder }) {
  return <DashboardCard title={feature.title} icon={feature.icon} badge="Coming soon" quiet compact style={styles.fill}>
    <Text variant="caption" tone="secondary">{feature.headline}</Text>
  </DashboardCard>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
