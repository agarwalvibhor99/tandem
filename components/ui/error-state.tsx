import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { spacing } from '@/constants/theme';

export function ErrorState({ message, onRetry, retryLabel = 'Try again' }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return <View style={styles.group}>
    <Notice error message={message} />
    {onRetry && <Button label={retryLabel} variant="quiet" onPress={onRetry} />}
  </View>;
}

const styles = StyleSheet.create({ group: { gap: spacing.sm } });
