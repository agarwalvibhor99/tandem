import { Heart } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, spacing } from '@/constants/theme';

export function Brand() {
  return <View style={styles.brand} accessible accessibilityLabel="Tandem">
    <Text variant="brand">tandem</Text>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Heart size={layout.featureIconSize} color={colors.sage} strokeWidth={1.25} /></View>
  </View>;
}
const styles = StyleSheet.create({ brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs } });
