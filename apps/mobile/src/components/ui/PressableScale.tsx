import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { motion, springs } from '@/theme';
import { haptics } from './haptics';

// Press feedback: a spring scale-down (skipped under Reduce Motion) and a
// light haptic. The scale lives on an inner view so layout never shifts.
// `pressedOpacity` is an opt-in Reduce Motion fallback: instead of scaling, the view dips to that opacity while pressed.
export function PressableScale({
  children,
  style,
  innerStyle,
  scaleTo = motion.pressScale,
  haptic = true,
  pressedOpacity,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  pressedOpacity?: number;
}) {
  const scale = useSharedValue(1);
  const dim = useSharedValue(1);
  const reduce = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: dim.get() }));

  return (
    <Pressable
      {...props}
      style={style}
      onPressIn={(e) => {
        if (!reduce) scale.value = withSpring(scaleTo, springs.snappy);
        else if (pressedOpacity != null) dim.set(withTiming(pressedOpacity, { duration: 100 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduce) scale.value = withSpring(1, springs.smooth);
        else if (pressedOpacity != null) dim.set(withTiming(1, { duration: 150 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics.tap();
        onPress?.(e);
      }}
    >
      <Animated.View style={[animated, innerStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
