import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconName, Screen } from '@/components/ui';
import Quiz from './Quiz';
import { MODULES, ModuleKey } from './content';

/** Where a statement comes from: the Semetra leaflet, or guidance added by the app team (pending clinical confirmation). */
export function SourceTag({ kind }: { kind: 'leaflet' | 'added' }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const added = kind === 'added';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: added ? colors.infoSoft : colors.successSoft,
        borderWidth: added ? 1 : 0,
        borderStyle: 'dashed',
        borderColor: colors.info,
      }}
    >
      <Icon name={added ? 'info' : 'book'} size={12} color={added ? colors.info : colors.success} />
      <AppText variant="caption" weight="600" style={{ color: added ? colors.info : colors.success }}>
        {added ? t('train.common.added') : t('train.common.leaflet')}
      </AppText>
    </View>
  );
}

/** Guidance that is NOT wording from the Semetra leaflet. Dashed border + a standing note, so it can never be mistaken for the leaflet. */
export function AddedGuidance({ icon = 'info', title, body, children }: { icon?: IconName; title?: string; body?: string; children?: React.ReactNode }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Card style={{ gap: spacing.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.info }}>
      <SourceTag kind="added" />
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <Icon name={icon} size={22} color={colors.info} />
        <View style={{ flex: 1, gap: 2 }}>
          {title ? <AppText variant="headline">{title}</AppText> : null}
          {body ? <AppText variant="subhead">{body}</AppText> : null}
          {children}
        </View>
      </View>
      <AppText variant="caption" tone="secondary">
        {t('train.common.addedNote')}
      </AppText>
    </Card>
  );
}

export function Callout({ icon, title, body, tint, source }: { icon: IconName; title?: string; body: string; tint?: string; source?: 'leaflet' | 'added' }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
      <Icon name={icon} size={22} color={tint ?? colors.tint} />
      <View style={{ flex: 1, gap: 2 }}>
        {source ? <SourceTag kind={source} /> : null}
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
