import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { type, TypeVariant, useTheme, Palette } from '@/theme';
import { useI18n } from '@/i18n';

export type TextTone = 'label' | 'secondary' | 'tertiary' | 'tint' | 'danger' | 'success' | 'warning' | 'onTint' | 'violet';

export function toneColor(colors: Palette, tone: TextTone): string {
  switch (tone) {
    case 'secondary':
      return colors.secondaryLabel;
    case 'tertiary':
      return colors.tertiaryLabel;
    case 'tint':
      return colors.tint;
    case 'danger':
      return colors.danger;
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'onTint':
      return colors.onTint;
    case 'violet':
      return colors.violet;
    default:
      return colors.label;
  }
}

// The only text primitive screens use — they never touch fontSize directly.
export function AppText({
  variant = 'body',
  tone = 'label',
  numeric,
  weight,
  style,
  ...props
}: TextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  /** Tabular figures — for doses, weights, dates that must align. */
  numeric?: boolean;
  weight?: TextStyle['fontWeight'];
}) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  return (
    <Text
      {...props}
      style={[
        type[variant],
        // Arabic-script text joins cursively — any tracking breaks the letterforms.
        lang !== 'en' && { letterSpacing: 0 },
        { color: toneColor(colors, tone) },
        numeric && { fontVariant: ['tabular-nums'] },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
}
