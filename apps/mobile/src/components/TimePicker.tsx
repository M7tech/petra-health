import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../ui';
import WheelPicker from './WheelPicker';

const HOURS = Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, '0'), value: i }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ label: String(i).padStart(2, '0'), value: i }));

// Free-choice time picker (any hour:minute) — two rolling wheels, no presets.
export default function TimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  return (
    <View style={styles.row}>
      <WheelPicker options={HOURS} selectedValue={hour} onChange={(h) => onChange(h, minute)} />
      <Text style={styles.colon}>:</Text>
      <WheelPicker options={MINUTES} selectedValue={minute} onChange={(m) => onChange(hour, m)} />
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
  colon: { fontSize: 18, fontWeight: '700', color: colors.text },
});
