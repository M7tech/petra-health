import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';
import { haptics } from './haptics';
import { spacing, useTheme } from '@/theme';

/** Seven circular weekday toggles. `value` uses the 1 = Sunday … 7 = Saturday convention. */
export function DayPicker({ value, onChange, labels }: { value: number; onChange: (weekday: number) => void; labels: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
      {labels.map((label, i) => {
        const active = value === i + 1;
        return (
          <PressableScale
            key={i}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            haptic={false}
            hitSlop={4}
            onPress={() => {
              haptics.select();
              onChange(i + 1);
            }}
            innerStyle={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.tint : colors.fill }}
          >
            <AppText variant="subhead" weight="600" tone={active ? 'onTint' : 'label'}>
              {label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}
