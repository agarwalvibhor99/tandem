import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';

type Props = PropsWithChildren<Omit<PressableProps, 'style'>> & {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export function PressableScale({ children, style, pressedStyle, scaleTo: _scaleTo, ...props }: Props) {
  return (
    <Pressable
      {...props}
      style={({ pressed }: PressableStateCallbackType) => [styles.base, style, pressed ? styles.pressed : null, pressed ? pressedStyle : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {},
  pressed: { opacity: 0.86 },
});
