import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../ui';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (n: number) => String(n).padStart(2, '0');

// Free-choice time picker (any hour:minute) — two scroll wheels, no presets.
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
      <Picker
        style={styles.picker}
        itemStyle={styles.item}
        selectedValue={hour}
        onValueChange={(v) => onChange(Number(v), minute)}
      >
        {HOURS.map((h) => (
          <Picker.Item key={h} label={pad(h)} value={h} />
        ))}
      </Picker>
      <Text style={styles.colon}>:</Text>
      <Picker
        style={styles.picker}
        itemStyle={styles.item}
        selectedValue={minute}
        onValueChange={(v) => onChange(hour, Number(v))}
      >
        {MINUTES.map((m) => (
          <Picker.Item key={m} label={pad(m)} value={m} />
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
  item: { fontSize: 18, height: 130 }, // iOS wheel only
  colon: { fontSize: 18, fontWeight: '700', color: colors.text },
});
