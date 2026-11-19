import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Icon, PressableScale, haptics } from '@/components/ui';
import StepPlayer from '@/components/guide/StepPlayer';
import { CHAPTERS } from '@/training/content';
import { Heading, ModuleScreen } from '@/training/ui';

/** The manufacturer's 18 steps, grouped into five chapters. Each chapter plays with Replay / Previous / Next. */
export default function InjectModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [chapter, setChapter] = useState<number>(-1); // -1 = play everything

  const chips = [{ key: 'all', label: t('train.inject.play'), idx: -1 }, ...CHAPTERS.map((c, i) => ({ key: c.key, label: `${String.fromCharCode(65 + i)} · ${t(`train.inject.${c.key}`)}`, idx: i }))];

  return (
    <ModuleScreen module="inject">
      <Heading sub={t('guide.officialHint')}>{t('guide.injectTitle')}</Heading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
        {chips.map((c) => {
          const active = chapter === c.idx;
          return (
            <PressableScale
              key={c.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              haptic={false}
              onPress={() => {
                haptics.select();
                setChapter(c.idx);
              }}
              innerStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.surface }}
            >
              {c.idx === -1 ? <Icon name="play" size={14} color={active ? colors.onTint : colors.secondaryLabel} /> : null}
              <AppText variant="subhead" weight="600" tone={active ? 'onTint' : 'label'}>
                {c.label}
              </AppText>
            </PressableScale>
          );
        })}
      </ScrollView>
      <StepPlayer steps={chapter === -1 ? undefined : CHAPTERS[chapter].steps} />
      <View />
    </ModuleScreen>
  );
}
