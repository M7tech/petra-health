import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { SharedValue, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppText, Icon, IconName, GlassSurface, haptics } from '@/components/ui';
import { useI18n } from '@/i18n';
import { radius, spacing, springs, useTheme } from '@/theme';

const ITEM = 52;
const GAP = 14;

export interface QuickAction {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
}

/** The routes the quick-add actions open — shared with the iOS toolbar menu. */
export function useQuickActions(): QuickAction[] {
  const { t } = useI18n();
  return [
    { key: 'dose', icon: 'syringe', label: t('quickAdd.logDose'), onPress: () => router.navigate('/(tabs)/(treatment)') },
    { key: 'weight', icon: 'scale', label: t('quickAdd.logWeight'), onPress: () => router.push('/log-weight') },
    { key: 'a1c', icon: 'drop', label: t('quickAdd.logA1c'), onPress: () => router.push('/log-a1c') },
    { key: 'other', icon: 'pill', label: t('quickAdd.logOther'), onPress: () => router.navigate('/(tabs)/(treatment)') },
  ];
}

// Material speed-dial FAB for Android (iOS uses a native "+" menu in the header
// instead — no FAB in iOS layouts). Items fan upward with a staggered spring.
export default function QuickAddFab() {
  const { colors } = useTheme();
  const actions = useQuickActions();
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const set = (next: boolean) => {
    setOpen(next);
    progress.value = reduce ? (next ? 1 : 0) : withSpring(next ? 1 : 0, springs.snappy);
    haptics.tap();
  };

  const rotate = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <>
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => set(false)} accessibilityRole="button" accessibilityLabel={t('ui.close')} />
      </Animated.View>

      {actions.map((a, i) => (
        <FabItem key={a.key} index={i} progress={progress} open={open} action={a} onDone={() => set(false)} />
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('quickAdd.title')}
        accessibilityState={{ expanded: open }}
        onPress={() => set(!open)}
        style={{
          position: 'absolute',
          end: spacing.lg,
          bottom: spacing.lg,
          width: 60,
          height: 60,
          borderRadius: radius.xl,
          borderCurve: 'continuous',
          backgroundColor: colors.tint,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
        }}
      >
        <Animated.View style={rotate}>
          <Icon name="plus" size={28} color={colors.onTint} weight="bold" />
        </Animated.View>
      </Pressable>
    </>
  );
}

function FabItem({
  index,
  progress,
  open,
  action,
  onDone,
}: {
  index: number;
  progress: SharedValue<number>;
  open: boolean;
  action: QuickAction;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    // Staggered: later items start moving slightly after earlier ones.
    const p = interpolate(progress.value, [index * 0.1, 1], [0, 1], 'clamp');
    return {
      opacity: p,
      transform: [{ translateY: -(60 + GAP + (ITEM + GAP) * index) * p + 0 }, { scale: 0.6 + 0.4 * p }],
    };
  });
  return (
    <Animated.View
      pointerEvents={open ? 'auto' : 'none'}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!open}
      style={[{ position: 'absolute', end: spacing.lg + 4, bottom: spacing.lg + 4, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}
    >
      <GlassSurface borderRadius={radius.pill} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
        <AppText variant="subhead" weight="600">
          {action.label}
        </AppText>
      </GlassSurface>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={() => {
          onDone();
          action.onPress();
        }}
        style={{ width: ITEM, height: ITEM, borderRadius: ITEM / 2, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.22)' }}
      >
        <Icon name={action.icon} size={22} color={colors.tint} />
      </Pressable>
    </Animated.View>
  );
}
