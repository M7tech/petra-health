import React from 'react';
import { I18nManager, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { radius, spacing, useTheme, gutter, hitTarget } from '@/theme';
import { AppText, TextTone } from './AppText';
import { Icon, IconName } from './Icon';

const ICON_TILE = 30;

/** Inset grouped list — the iOS Settings idiom. Hairlines separate rows. */
export function Section({
  title,
  footer,
  children,
  style,
  trailing,
}: {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean) as React.ReactElement<{ icon?: IconName; leading?: React.ReactNode }>[];
  return (
    <View style={style}>
      {title || trailing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          {title ? (
            <AppText variant="footnote" tone="secondary" weight="600" style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {title}
            </AppText>
          ) : (
            <View />
          )}
          {trailing}
        </View>
      ) : null}
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, borderCurve: 'continuous', overflow: 'hidden' }}>
        {rows.map((child, i) => (
          <View key={child.key ?? i}>
            {i > 0 ? (
              <View
                style={{
                  height: 0.5,
                  backgroundColor: colors.separator,
                  marginStart: child.props.icon || child.props.leading ? spacing.lg + ICON_TILE + spacing.md : spacing.lg,
                }}
              />
            ) : null}
            {child}
          </View>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" tone="secondary" style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

/** A single row: optional icon tile, title/subtitle, value and chevron. */
export function Row({
  icon,
  iconColor,
  leading,
  title,
  subtitle,
  value,
  onPress,
  chevron,
  tone = 'label',
  right,
  children,
  accessibilityLabel,
}: {
  icon?: IconName;
  iconColor?: string;
  /** Custom leading node (30pt wide) — e.g. a completion check. */
  leading?: React.ReactNode;
  title?: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  tone?: TextTone;
  right?: React.ReactNode;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const accent = iconColor ?? colors.tint;
  const body = (pressed: boolean) => (
    <View
      style={{
        minHeight: hitTarget + 6,
        paddingHorizontal: gutter,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: pressed ? colors.fill : 'transparent',
      }}
    >
      {leading ? (
        <View style={{ width: ICON_TILE, alignItems: 'center', justifyContent: 'center' }}>{leading}</View>
      ) : icon ? (
        <View
          style={{
            width: ICON_TILE,
            height: ICON_TILE,
            borderRadius: 8,
            borderCurve: 'continuous',
            backgroundColor: accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={17} color={colors.onTint} weight="semibold" />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <AppText variant="body" tone={tone}>
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText variant="footnote" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
      {value ? (
        <AppText variant="body" tone="secondary" numeric style={{ flexShrink: 1 }}>
          {value}
        </AppText>
      ) : null}
      {right}
      {chevron ? (
        <Icon name={I18nManager.isRTL ? 'chevronLeft' : 'chevronRight'} size={14} color={colors.tertiaryLabel} weight="bold" />
      ) : null}
    </View>
  );
  if (!onPress) return body(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      android_ripple={{ color: colors.fill }}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}
