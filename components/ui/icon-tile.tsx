import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';

export function IconTile({ icon, label, selected, disabled, onPress, ...props }: Omit<PressableProps, 'style' | 'children'> & { icon: string; label: string; selected: boolean; disabled?: boolean }) {
  return <Pressable
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
  </Pressable>;
}

const styles = StyleSheet.create({
  tile: { width: '23%', minWidth: 76, minHeight: 74, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.sm },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  disabled: { opacity: 0.5 },
  icon: { fontSize: layout.emojiSize, lineHeight: layout.emojiLineHeight },
});
