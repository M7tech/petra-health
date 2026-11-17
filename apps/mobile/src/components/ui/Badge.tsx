import React from 'react';
import { View } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export type BadgeTone = 'tint' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: BadgeTone; icon?: IconName }) {
  const { colors } = useTheme();
  const map = {
    tint: [colors.tintSoft, colors.tint],
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.infoSoft, colors.info],
    violet: [colors.violetSoft, colors.violet],
    neutral: [colors.fill, colors.secondaryLabel],
  }[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: spacing.xs,
        backgroundColor: map[0],
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
      }}
    >
      {icon ? <Icon name={icon} size={12} color={map[1]} weight="bold" /> : null}
      <AppText variant="caption" weight="600" style={{ color: map[1] }}>
        {label}
      </AppText>
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name?: string | null; size?: number }) {
  const { colors } = useTheme();
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      accessibilityLabel={name ?? undefined}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <AppText variant="subhead" weight="700" tone="tint" style={{ fontSize: size * 0.38 }}>
        {initials}
      </AppText>
    </View>
  );
}
