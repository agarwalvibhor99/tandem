import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { reference } from '@/constants/theme';

type Props = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;
export function ScreenEntrance({ children, style }: Props) {
  const [value] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useFocusEffect(useCallback(() => {
    value.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(value, { toValue: 1, duration: reference.screenDuration, easing: Easing.bezier(.2, .75, .15, 1), useNativeDriver: true });
    if (!reduced) animation.start();
    return () => animation.stop();
  }, [reduced, value]));
  return <Animated.View style={[style, { opacity: value, transform: [{ translateX: value.interpolate({ inputRange: [0, 1], outputRange: [reference.screenOffset, 0] }) }] }]}>{children}</Animated.View>;
}
export function Reveal({ children, style, variant = 'sheet' }: Props & { variant?: 'sheet' | 'chart' }) {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) { value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: variant === 'sheet' ? reference.sheetDuration : reference.chartDuration, easing: Easing.bezier(.2, .8, .2, 1), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduced, value, variant]);
  return <Animated.View style={[style, variant === 'sheet' ? { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [reference.sheetOffset, 0] }) }] } : { transformOrigin: 'bottom', transform: [{ scaleY: value }] }]}>{children}</Animated.View>;
}
