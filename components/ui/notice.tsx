import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, radii, spacing } from '@/constants/theme';

export function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite" accessibilityRole={error ? 'alert' : undefined}>
      <Text style={error ? styles.error : undefined}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surfaceMuted, padding: spacing.lg, borderRadius: radii.md },
  error: { color: colors.error },
});
