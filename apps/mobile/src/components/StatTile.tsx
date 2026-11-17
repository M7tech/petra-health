import React from 'react';
import { View } from 'react-native';
import { AppText, Card, Icon, IconName } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

export default function StatTile({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone?: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, gap: spacing.sm, padding: spacing.md }}>
      <Icon name={icon} size={20} color={tone ?? colors.tint} />
      <View style={{ gap: 2 }}>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="headline" numeric numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {value}
        </AppText>
      </View>
    </Card>
  );
}
