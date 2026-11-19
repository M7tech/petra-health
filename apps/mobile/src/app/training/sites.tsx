import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, PressableScale, haptics } from '@/components/ui';
import SitesAnimation from '@/components/guide/SitesAnimation';
import CrossSection from '@/training/CrossSection';
import { Callout, Heading, ModuleScreen } from '@/training/ui';

const SITE_KEYS = ['abdomen', 'arm', 'thigh'] as const;

/** Three spots inside one area take turns: "use a different spot each time". */
function RotateSpots() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [on, setOn] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(() => setOn((o) => (o + 1) % 3), 1500);
    return () => clearTimeout(id);
  }, [on, reduce]);
  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="headline">{t('train.sites.rotateTitle')}</AppText>
      <View style={{ height: 70, borderRadius: radius.xl, backgroundColor: '#F2CBA8', alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'row' }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: i === on ? 34 : 22, height: i === on ? 34 : 22, borderRadius: 20, borderWidth: 3, borderColor: colors.tint, backgroundColor: i === on ? colors.tintSoft : 'transparent', opacity: i === on ? 1 : 0.35 }} />
        ))}
      </View>
      <AppText variant="subhead" tone="secondary">
        {t('train.sites.rotateBody')}
      </AppText>
    </Card>
  );
}

export default function SitesModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [site, setSite] = useState(0);
  const [replay, setReplay] = useState(0);

  const choose = (i: number) => {
    haptics.select();
    setSite(i);
    setReplay((r) => r + 1);
  };

  return (
    <ModuleScreen module="sites">
      <Heading sub={t('train.sites.pick')}>{t('guide.sitesTitle')}</Heading>
      <SitesAnimation active={site} onSelect={choose} autoCycle={false} showList={false} />

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {SITE_KEYS.map((k, i) => {
          const active = i === site;
          return (
            <PressableScale
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              haptic={false}
              onPress={() => choose(i)}
              innerStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.surface }}
            >
              {active ? <Icon name="check" size={14} color={colors.onTint} weight="bold" /> : null}
              <AppText variant="subhead" weight="600" tone={active ? 'onTint' : 'label'}>
                {t(`train.sites.${k}`)}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <CrossSection replayKey={replay} siteLabel={t(`train.sites.${SITE_KEYS[site]}`)} />
      <RotateSpots />
      <Callout icon="info" body={t('guide.rotate')} tint={colors.success} />
    </ModuleScreen>
  );
}
