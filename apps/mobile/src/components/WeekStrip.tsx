import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../ui';

// Sun-first week strip. `activeDays` is a Set of 'YYYY-MM-DD' keys that had
// any logged activity (dose / weight / HbA1c) — used to ring each day.
export default function WeekStrip({
  activeDays,
  labels,
  isRTL,
}: {
  activeDays: Set<string>;
  labels: string[]; // 7 short day labels, Sun..Sat
  isRTL?: boolean;
}) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const key = (d: Date) => d.toISOString().slice(0, 10);
  const todayKey = key(today);

  return (
    <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
      {days.map((d, i) => {
        const k = key(d);
        const active = activeDays.has(k);
        const isToday = k === todayKey;
        const isFuture = d.getTime() > today.getTime();
        return (
          <View key={k} style={styles.col}>
            <Text style={styles.label}>{labels[i]}</Text>
            <View
              style={[
                styles.dot,
                active && styles.dotActive,
                isToday && !active && styles.dotToday,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  active && styles.dayNumActive,
                  isToday && !active && styles.dayNumToday,
                  isFuture && !active && styles.dayNumFuture,
                ]}
              >
                {d.getDate()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 6 },
  label: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  dotActive: { backgroundColor: colors.petra },
  dotToday: { borderWidth: 2, borderColor: colors.petra },
  dayNum: { fontSize: 13, fontWeight: '700', color: colors.text },
  dayNumActive: { color: '#fff' },
  dayNumToday: { color: colors.petra },
  dayNumFuture: { color: colors.muted },
});
