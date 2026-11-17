import React from 'react';
import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';
import { radius, spacing, useTheme, hitTarget } from '@/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Capsule buttons, as in iOS 26. `filled` is the one primary action per
// screen; `tinted` and `plain` carry everything else.
export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'lg',
  icon,
  loading,
  disabled,
  fullWidth = true,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const palette = {
    filled: { bg: colors.tint, fg: colors.onTint },
    tinted: { bg: colors.tintSoft, fg: colors.tint },
    plain: { bg: 'transparent', fg: colors.tint },
    destructive: { bg: colors.dangerSoft, fg: colors.danger },
  }[variant];
  const height = size === 'lg' ? 52 : size === 'md' ? hitTarget : 36;
  const inactive = disabled || loading;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      haptic={variant !== 'plain'}
      hitSlop={size === 'sm' ? 8 : 0}
      style={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}
      innerStyle={{
        height,
        minWidth: height,
        paddingHorizontal: size === 'sm' ? spacing.lg : spacing.xl,
        borderRadius: radius.pill,
        borderCurve: 'continuous',
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.sm,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 19} color={palette.fg} weight="semibold" /> : null}
          <AppText variant={size === 'sm' ? 'subhead' : 'headline'} weight="600" style={{ color: palette.fg }} numberOfLines={1}>
            {title}
          </AppText>
        </>
      )}
    </PressableScale>
  );
}

/** Round icon-only button for headers and floating controls. */
export function IconButton({
  icon,
  onPress,
  label,
  tone = 'tint',
  size = 36,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  tone?: 'tint' | 'label';
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      innerStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <View>
        <Icon name={icon} size={size * 0.6} color={tone === 'tint' ? colors.tint : colors.label} weight="semibold" />
      </View>
    </PressableScale>
  );
}
