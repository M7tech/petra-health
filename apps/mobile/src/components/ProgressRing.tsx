import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Circular progress dial that springs to its value. `progress` is 0-1;
// children render centred on top.
export default function ProgressRing({
  size = 108,
  strokeWidth = 10,
  progress,
  color,
  trackColor,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = reduce ? clamped : withSpring(clamped, springs.smooth);
  }, [clamped, reduce, p]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - p.value) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor ?? colors.tintSoft} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? colors.tint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}
