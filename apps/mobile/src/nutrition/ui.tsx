import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconName } from '@/components/ui';
import { PHOTOS } from './photos';

export function PageHead({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xs }}>
      {kicker ? (
        <AppText variant="footnote" weight="600" tone="tint">
          {kicker}
        </AppText>
      ) : null}
      <AppText variant="title2" weight="700">
        {title}
      </AppText>
      {sub ? (
        <AppText variant="subhead" tone="secondary">
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

/** Shows the real photo for `id` when one has been added (see photos.ts); otherwise nothing, so the illustration carries the page. */
export function Photo({ id, height = 180, label }: { id: string; height?: number; label?: string }) {
  const src = PHOTOS[id];
  if (!src) return null;
  return <Image source={src} accessibilityLabel={label} contentFit="cover" transition={150} style={{ width: '100%', height, borderRadius: radius.xl }} />;
}

export function RefTag({ ids }: { ids: string }) {
  const { t } = useI18n();
  return (
    <AppText variant="caption" tone="secondary">
      {t('nutri.common.ref')} {ids}
    </AppText>
  );
}

export function Notice({ icon = 'info', tone = 'info', children }: { icon?: IconName; tone?: 'info' | 'warning' | 'danger' | 'success'; children: React.ReactNode }) {
  const { colors } = useTheme();
  const c = { info: [colors.info, colors.infoSoft], warning: [colors.warning, colors.warningSoft], danger: [colors.danger, colors.dangerSoft], success: [colors.success, colors.successSoft] }[tone];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: c[1], alignItems: 'flex-start' }}>
      <Icon name={icon} size={20} color={c[0]} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <AppText variant="subhead">{children}</AppText> : children}</View>
    </View>
  );
}

export function Disclaimer() {
  const { t } = useI18n();
  return (
    <AppText variant="footnote" tone="secondary" style={{ textAlign: 'center', paddingHorizontal: spacing.lg }}>
      {t('nutri.hub.notice')}
    </AppText>
  );
}

export function Chip({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.tintSoft }}>
      <Icon name={icon} size={16} color={colors.tint} />
      <AppText variant="footnote" weight="600" style={{ color: colors.tint }}>
        {text}
      </AppText>
    </View>
  );
}

export { Card };
