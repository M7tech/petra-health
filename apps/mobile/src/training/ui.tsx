import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconName, Screen } from '@/components/ui';
import Quiz from './Quiz';
import { MODULES, ModuleKey } from './content';

export function Callout({ icon, title, body, tint }: { icon: IconName; title?: string; body: string; tint?: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
      <Icon name={icon} size={22} color={tint ?? colors.tint} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? <AppText variant="headline">{title}</AppText> : null}
        <AppText variant="subhead" tone="secondary">
          {body}
        </AppText>
      </View>
    </Card>
  );
}

export function Heading({ children, sub }: { children: string; sub?: string }) {
  return (
    <View style={{ gap: 2, paddingHorizontal: spacing.xs }}>
      <AppText variant="title3">{children}</AppText>
      {sub ? (
        <AppText variant="subhead" tone="secondary">
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

/** Every module: content, then a two-question check, then the standing educational disclaimer. */
export function ModuleScreen({ module, children }: { module: ModuleKey; children: React.ReactNode }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen gap={spacing.lg}>
      {children}
      <Quiz module={module} questions={MODULES[module].quiz} />
      <AppText variant="footnote" tone="secondary" style={{ textAlign: 'center', paddingHorizontal: spacing.lg }}>
        {t('train.common.disclaimer')}
      </AppText>
      {__DEV__ && MODULES[module].review === 'pending-medical-review' ? (
        <View style={{ backgroundColor: colors.warningSoft, borderRadius: 12, padding: spacing.md }}>
          <AppText variant="caption" style={{ color: colors.warning }}>
            DEV · Pending Medical Review · sources: {MODULES[module].sources.join(' · ')}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}
