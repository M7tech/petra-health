import React from 'react';
import { RefreshControl, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { gutter, spacing, useTheme } from '@/theme';

// Every screen's scroll container. It must be the first child of the route so
// native large-title headers and tab bars can inset and collapse correctly.
export function Screen({
  children,
  keyboard,
  onRefresh,
  refreshing = false,
  gap = spacing.xl,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  /** Forms: scrolls the focused input above the keyboard. */
  keyboard?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  gap?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const common = {
    style: { flex: 1, backgroundColor: colors.background },
    contentInsetAdjustmentBehavior: 'automatic' as const,
    keyboardShouldPersistTaps: 'handled' as const,
    keyboardDismissMode: 'interactive' as const,
    contentContainerStyle: [{ padding: gutter, paddingBottom: spacing.xxxl, gap }, contentContainerStyle],
    refreshControl: onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} /> : undefined,
  };
  if (keyboard) return <KeyboardAwareScrollView {...common} bottomOffset={spacing.xl}>{children}</KeyboardAwareScrollView>;
  return <ScrollView {...common}>{children}</ScrollView>;
}
