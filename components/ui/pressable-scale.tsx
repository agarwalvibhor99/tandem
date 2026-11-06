import { useState, type PropsWithChildren } from 'react';
import { Animated, Easing, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { reference } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type Props = PropsWithChildren<Omit<PressableProps, 'style'>> & { style?: StyleProp<ViewStyle>; pressedStyle?: StyleProp<ViewStyle>; scaleTo?: number };
export function PressableScale({ children, style, pressedStyle, scaleTo = reference.pressScale, onPressIn, onPressOut, onHoverIn, onHoverOut, ...props }: Props) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const [lift] = useState(() => new Animated.Value(0));
  const animate = (value: Animated.Value, toValue: number) => Animated.timing(value, { toValue, duration: reduced ? 0 : reference.pressDuration, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  return <AnimatedPressable {...props}
    onPressIn={event => { setPressed(true); animate(scale, reduced ? 1 : scaleTo); onPressIn?.(event); }}
    onPressOut={event => { setPressed(false); animate(scale, 1); onPressOut?.(event); }}
    onHoverIn={event => { animate(lift, reduced ? 0 : reference.hoverOffset); onHoverIn?.(event); }}
    onHoverOut={event => { animate(lift, 0); onHoverOut?.(event); }}
    style={[style, { transform: [{ scale }, { translateY: lift }] }, pressed && pressedStyle]}
  >{children}</AnimatedPressable>;
}
