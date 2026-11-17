import React from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { openSelect, SelectOption } from '@/lib/select';
import { gutter, spacing, useTheme, hitTarget } from '@/theme';
import { AppText } from './AppText';
import { Row } from './Section';
import { IconName } from './Icon';

/** A row that opens the searchable list sheet and shows the current choice. */
export function SelectRow({
  title,
  value,
  options,
  placeholder,
  onChange,
  icon,
  disabled,
}: {
  title: string;
  value: string | null;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  icon?: IconName;
  disabled?: boolean;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Row
      icon={icon}
      title={title}
      value={current?.label ?? placeholder}
      chevron
      onPress={disabled ? undefined : () => openSelect({ title, options, value, onSelect: onChange })}
    />
  );
}

/** Native date / time row: compact picker on iOS, Material dialog on Android. */
export function DateRow({
  title,
  value,
  onChange,
  mode = 'date',
  maximumDate,
  minimumDate,
  icon,
}: {
  title: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  maximumDate?: Date;
  minimumDate?: Date;
  icon?: IconName;
}) {
  const { colors } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={{ minHeight: hitTarget + 6, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <AppText variant="body">{title}</AppText>
        <DateTimePicker
          value={value}
          mode={mode}
          display="compact"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          accentColor={colors.tint}
          themeVariant={undefined}
          onChange={(_, d) => d && onChange(d)}
        />
      </View>
    );
  }

  const label =
    mode === 'date'
      ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <Row
      icon={icon}
      title={title}
      value={label}
      onPress={() =>
        DateTimePickerAndroid.open({
          value,
          mode,
          maximumDate,
          minimumDate,
          onValueChange: (_, d) => d && onChange(d),
        })
      }
    />
  );
}
