import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { X } from 'lucide-react-native';
import { CoffeeCupArt, HeartArt, RoseArt } from '@/components/dashboard/nudge-art';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { colors, layout, radii, spacing } from '@/constants/theme';
import type { PartnerNudge as Nudge, PartnerNudgeType } from '@/types/nudge';

const copy: Record<PartnerNudgeType, { title: string; detail: string }> = {
  rose: { title: 'A little rose for you', detail: 'A small reminder that you are loved.' },
  heart: { title: 'A heart from your partner', detail: 'Sending a little love your way.' },
  coffee: { title: 'Coffee cheers', detail: 'A warm hello from your partner.' },
};

export function PartnerNudge({ nudge, senderName, onDismiss }: { nudge: Nudge; senderName: string; onDismiss: () => void }) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const [offset] = useState(() => new Animated.Value(0));
  const [leaving, setLeaving] = useState(false);
  const dismiss = (direction: number) => {
    if (leaving) return;
    setLeaving(true);
    Animated.timing(offset, { toValue: direction * width, duration: reduced ? 0 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => onDismiss());
  };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.1,
    onPanResponderMove: (_, gesture) => offset.setValue(gesture.dx),
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) >= 36 || Math.abs(gesture.vx) >= .35) dismiss(gesture.dx >= 0 ? 1 : -1);
      else Animated.spring(offset, { toValue: 0, damping: 20, stiffness: 260, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start(),
  });
  const item = copy[nudge.type];
  return <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: offset }] }}>
    <Surface variant="inset" style={styles.card}>
      <View style={styles.symbol}>
        {nudge.type === 'rose' ? <RoseArt size={42} /> : nudge.type === 'heart' ? <HeartArt size={40} /> : <CoffeeCupArt size={43} />}
      </View>
      <View style={styles.copy}>
        <Text variant="label">{item.title}</Text>
        <Text variant="caption" tone="secondary">{senderName} · {item.detail}</Text>
        <Text variant="micro" tone="secondary">Sent {formatDistanceToNow(new Date(nudge.created_at), { addSuffix: true })}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss nudge" hitSlop={spacing.sm} onPress={() => dismiss(1)} style={styles.dismissButton}>
        <X color={colors.textSecondary} size={layout.iconSize} />
      </Pressable>
    </Surface>
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  symbol: { width: layout.iconContainerSize, height: layout.iconContainerSize, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft },
  copy: { flex: 1, gap: spacing.xs },
  dismissButton: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
});
