import { StyleSheet, type PressableProps } from 'react-native';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';

export function IconTile({ icon, label, selected, disabled, onPress, ...props }: Omit<PressableProps, 'style' | 'children'> & { icon: string; label: string; selected: boolean; disabled?: boolean }) {
  return <PressableScale
    {...props}
    accessibilityRole="radio"
    accessibilityLabel={label}
    accessibilityState={{ selected, disabled }}
    disabled={disabled}
    onPress={onPress}
    style={[styles.tile, selected && styles.selected, disabled && styles.disabled]}
  >
    <Text style={styles.icon}>{icon}</Text>
    <Text variant="caption" tone={selected ? 'accent' : 'default'}>{label}</Text>
  </PressableScale>;
}

const styles = StyleSheet.create({
  tile: { width: '23%', minWidth: layout.iconTileMinWidth, minHeight: layout.iconTileMinHeight, borderRadius: radii.md, borderWidth: borders.thin, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  disabled: { opacity: 0.5 },
  icon: { fontSize: layout.emojiSize, lineHeight: layout.emojiLineHeight },
});
