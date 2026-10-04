import { format } from 'date-fns';
import { Clock3 } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { colors } from '@/constants/theme';
import type { TimeInterval } from '@/types/calendar';
export function FreeTimeCard({ block, empty = false, loading = false, error = false, onRetry }: { block?: TimeInterval; empty?: boolean; loading?: boolean; error?: boolean; onRetry?: () => void }) {
  return <DashboardCard title="Your next open window" icon={Clock3} subtitle="Time both of you can protect">
    {loading ? <ActivityIndicator color={colors.accent} accessibilityLabel="Finding time together" /> : error ? <><Text tone="secondary">Availability is unavailable right now.</Text>{onRetry && <Button label="Try again" variant="secondary" onPress={onRetry} />}</> : <Text variant="heading" tone="accent">{block ? `${format(block.start, 'h:mm a')}–${format(block.end, 'h:mm a')}` : empty ? 'No shared gap in this window' : 'Add your plans to find a clear stretch'}</Text>}
  </DashboardCard>;
}
