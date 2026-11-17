import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

// Sun-first week strip. `activeDays` is a Set of 'YYYY-MM-DD' keys that had
// any logged activity (dose / weight / HbA1c) — used to fill each day.
// Row direction follows the OS layout direction, so it mirrors in RTL.
export default function WeekStrip({ activeDays, labels }: { activeDays: Set<string>; labels: string[] }) {
  const { colors } = useTheme();
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((d, i) => {
        const k = key(d);
        const active = activeDays.has(k);
        const isToday = k === todayKey;
        const future = d.getTime() > today.getTime() && !isToday;
        return (
          <View key={k} style={{ alignItems: 'center', gap: spacing.xs + 2 }}>
            <AppText variant="caption" tone="secondary" weight="600">
              {labels[i]}
            </AppText>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? colors.tint : 'transparent',
                borderWidth: isToday && !active ? 2 : 0,
                borderColor: colors.tint,
              }}
            >
              <AppText
                variant="subhead"
                weight="600"
                numeric
                tone={active ? 'onTint' : isToday ? 'tint' : future ? 'tertiary' : 'label'}
              >
                {d.getDate()}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}
