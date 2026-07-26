import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../ui';

const MIN_YEAR = 1920;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, '0');

// Number of days in `month` (1-12) of `year` — new Date(year, month, 0) rolls
// back to the last day of the prior (0-indexed) month, i.e. `month` itself.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Free-choice date picker (any year/month/day) — three scroll wheels.
export default function DatePicker({
  year,
  month,
  day,
  onChange,
}: {
  year: number;
  month: number; // 1-12
  day: number;
  onChange: (year: number, month: number, day: number) => void;
}) {
  const maxYear = new Date().getFullYear();
  const years = Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, i) => maxYear - i);
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

  // Clamp day if the month/year change makes the current day invalid (e.g. Feb 30).
  useEffect(() => {
    const max = daysInMonth(year, month);
    if (day > max) onChange(year, month, max);
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.row}>
      <Picker
        style={styles.picker}
        itemStyle={styles.item}
        selectedValue={year}
        onValueChange={(v) => onChange(Number(v), month, day)}
      >
        {years.map((y) => (
          <Picker.Item key={y} label={String(y)} value={y} />
        ))}
      </Picker>
      <Picker
        style={styles.picker}
        itemStyle={styles.item}
        selectedValue={month}
        onValueChange={(v) => onChange(year, Number(v), day)}
      >
        {MONTHS.map((m) => (
          <Picker.Item key={m} label={pad(m)} value={m} />
        ))}
      </Picker>
      <Picker
        style={styles.picker}
        itemStyle={styles.item}
        selectedValue={day}
        onValueChange={(v) => onChange(year, month, Number(v))}
      >
        {days.map((d) => (
          <Picker.Item key={d} label={pad(d)} value={d} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: { flex: 1, height: Platform.OS === 'ios' ? 130 : 46, color: colors.text },
  item: { fontSize: 16, height: 130 }, // iOS wheel only
});
