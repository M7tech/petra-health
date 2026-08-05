import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../ui';
import WheelPicker from './WheelPicker';

const MIN_YEAR = 1920;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad = (n: number) => String(n).padStart(2, '0');

// Number of days in `month` (1-12) of `year` — new Date(year, month, 0) rolls
// back to the last day of the prior (0-indexed) month, i.e. `month` itself.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Free-choice date picker (any year/month/day) — three rolling wheels.
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
      <WheelPicker
        options={years.map((y) => ({ label: String(y), value: y }))}
        selectedValue={year}
        onChange={(y) => onChange(y, month, day)}
      />
      <WheelPicker
        options={MONTHS.map((m) => ({ label: pad(m), value: m }))}
        selectedValue={month}
        onChange={(m) => onChange(year, m, day)}
      />
      <WheelPicker
        options={days.map((d) => ({ label: pad(d), value: d }))}
        selectedValue={day}
        onChange={(d) => onChange(year, month, d)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
});
