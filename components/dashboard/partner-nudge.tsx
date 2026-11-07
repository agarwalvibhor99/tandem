import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ChevronsLeftRight } from 'lucide-react-native';
import { BeerMugArt, CoffeeCupArt, HeartArt, RoseArt } from '@/components/dashboard/nudge-art';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { colors, layout, radii, spacing } from '@/constants/theme';
import type { PartnerNudge as Nudge, PartnerNudgeType } from '@/types/nudge';

const copy: Record<PartnerNudgeType, { title: string; detail: string }> = {
  rose: { title: 'A little rose for you', detail: 'A small reminder that you are loved.' },
  heart: { title: 'A heart from your partner', detail: 'Sending a little love your way.' },
  coffee: { title: 'Coffee cheers', detail: 'A warm hello from your partner.' },
  beer: { title: 'Cheers!!', detail: 'Your partner is raising a glass to you.' },
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
      if (Math.abs(gesture.dx) >= 28 || Math.abs(gesture.vx) >= .25) dismiss(gesture.dx >= 0 ? 1 : -1);
      else Animated.spring(offset, { toValue: 0, damping: 20, stiffness: 260, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start(),
  });
  const item = copy[nudge.type];
  const opacity = offset.interpolate({ inputRange: [-width * .55, 0, width * .55], outputRange: [.18, 1, .18], extrapolate: 'clamp' });
  const rotate = offset.interpolate({ inputRange: [-width, 0, width], outputRange: ['-8deg', '0deg', '8deg'] });
  const scale = offset.interpolate({ inputRange: [-width * .55, 0, width * .55], outputRange: [.96, 1, .96], extrapolate: 'clamp' });
  return <Animated.View
    {...responder.panHandlers}
    accessible
    accessibilityRole="button"
    accessibilityLabel={`${item.title}. ${senderName}. Swipe left or right to dismiss.`}
    accessibilityActions={[{ name: 'dismiss', label: 'Dismiss nudge' }]}
    onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === 'dismiss') dismiss(1); }}
    style={{ opacity, transform: [{ translateX: offset }, { rotate }, { scale }] }}>
    <Surface variant="inset" style={styles.card}>
      <View style={styles.symbol}>
        {nudge.type === 'rose' ? <RoseArt size={42} /> : nudge.type === 'heart' ? <HeartArt size={40} /> : nudge.type === 'coffee' ? <CoffeeCupArt size={43} /> : <BeerMugArt size={38} />}
      </View>
      <View style={styles.copy}>
        <Text variant="label">{item.title}</Text>
        <Text variant="caption" tone="secondary">{senderName} · {item.detail}</Text>
        <View style={styles.meta}>
          <Text variant="micro" tone="secondary">Sent {formatDistanceToNow(new Date(nudge.created_at), { addSuffix: true })}</Text>
          <View style={styles.swipeHint}><ChevronsLeftRight color={colors.textSecondary} size={layout.iconSize} /><Text variant="micro" tone="secondary">Swipe away</Text></View>
        </View>
      </View>
    </Surface>
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  symbol: { width: layout.iconContainerSize, height: layout.iconContainerSize, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft },
  copy: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  swipeHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
