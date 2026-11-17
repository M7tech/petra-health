import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, type, useTheme, gutter, hitTarget } from '@/theme';
import { AppText } from './AppText';

/** A labelled input living inside a Section (iOS form row). */
export function FieldRow({
  label,
  multiline,
  style,
  ...props
}: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        minHeight: hitTarget + 6,
        paddingHorizontal: gutter,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        gap: spacing.md,
      }}
    >
      <AppText variant="body" style={{ width: 108, paddingTop: multiline ? spacing.sm : 0 }} numberOfLines={2}>
        {label}
      </AppText>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.tertiaryLabel}
        selectionColor={colors.tint}
        accessibilityLabel={label}
        style={[
          type.body,
          { flex: 1, color: colors.label, paddingVertical: multiline ? spacing.sm : spacing.xs, minHeight: multiline ? 72 : undefined, textAlignVertical: multiline ? 'top' : 'center' },
          style,
        ]}
      />
    </View>
  );
}

/** A standalone filled input (composer, search, large numeric entry). */
export function InputField({
  style,
  ...props
}: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.tertiaryLabel}
      selectionColor={colors.tint}
      style={[
        type.body,
        {
          color: colors.label,
          backgroundColor: colors.fill,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          minHeight: hitTarget + 4,
        },
        style,
      ]}
    />
  );
}
