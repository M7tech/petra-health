import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconName, PressableScale, Row, Screen, Section, haptics } from '@/components/ui';

type GuideSection = 'schedule' | 'sites' | 'inject' | 'weekly' | 'missed' | 'storage' | 'effects';
const SECTIONS: { key: GuideSection; icon: IconName }[] = [
  { key: 'schedule', icon: 'calendar' },
  { key: 'sites', icon: 'pin' },
  { key: 'inject', icon: 'syringe' },
  { key: 'weekly', icon: 'clock' },
  { key: 'missed', icon: 'alert' },
  { key: 'storage', icon: 'snowflake' },
  { key: 'effects', icon: 'heart' },
];

// Injection steps grouped the way the illustrated guide flows (1–18).
const STEP_GROUPS: { title: string; steps: number[] }[] = [
  { title: 'grp1', steps: [1, 2] },
  { title: 'grp2', steps: [3, 4, 5, 6] },
  { title: 'grp3', steps: [7, 8, 9] },
  { title: 'grp4', steps: [10, 11] },
  { title: 'grp5', steps: [12, 13, 14, 15] },
  { title: 'grp6', steps: [16, 17, 18] },
];

const IMG_SITES = require('../../assets/guide/guide-sites.png');
const IMG_STEPS_1 = require('../../assets/guide/guide-steps-1.png');
const IMG_STEPS_2 = require('../../assets/guide/guide-steps-2.png');

export default function GuideSheet() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [section, setSection] = useState<GuideSection>('schedule');
  const g = (k: string) => t(`guide.${k}`);

  // Product colours from the official guide: green = 1.5 ml pen, maroon = 3 ml / 1 mg.
  const GREEN = colors.success;
  const MAROON = colors.danger;

  const Heading = ({ children, sub }: { children: string; sub?: string }) => (
    <View style={{ gap: 2, paddingHorizontal: spacing.xs }}>
      <AppText variant="title3">{children}</AppText>
      {sub ? (
        <AppText variant="subhead" tone="secondary">
          {sub}
        </AppText>
      ) : null}
    </View>
  );

  const Callout = ({ icon, title, body, tint }: { icon: IconName; title?: string; body: string; tint?: string }) => (
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

  const Pen = ({ size, color, lines, note }: { size: string; color: string; lines: string[]; note: string }) => (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <View style={{ width: 76, height: 92, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="title1" style={{ color: '#fff' }} numeric>
          {size}
        </AppText>
        <AppText variant="footnote" style={{ color: '#fff', opacity: 0.9 }}>
          ml
        </AppText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {lines.map((l, i) =>
          l === 'or' ? (
            <AppText key={i} variant="caption" tone="secondary">
              {g('or')}
            </AppText>
          ) : (
            <AppText key={i} variant="subhead" weight="600">
              {l}
            </AppText>
          ),
        )}
        <AppText variant="footnote" tone="secondary" style={{ marginTop: spacing.xs }}>
          {note}
        </AppText>
      </View>
    </Card>
  );

  const Week = ({ weeks, dose, box, color }: { weeks: string; dose: string; box: string; color: string }) => (
    <Row
      leading={<View style={{ width: 8, height: 34, borderRadius: 4, backgroundColor: color }} />}
      title={weeks}
      subtitle={box}
      value={dose}
    />
  );

  const render = () => {
    switch (section) {
      case 'schedule':
        return (
          <>
            <Heading sub={g('concentration')}>{g('pensTitle')}</Heading>
            <Pen size="1.5" color={GREEN} lines={[g('pen15'), g('pen15a'), g('pen15b'), 'or', g('pen15c')]} note={g('pen15note')} />
            <Pen size="3" color={MAROON} lines={[g('pen3'), g('pen3a')]} note={g('pen3note')} />
            <Heading sub={g('first8Sub')}>{g('first8Title')}</Heading>
            <Section>
              <Week weeks={g('weeks14')} dose="0.25 mg" box={g('box1')} color={GREEN} />
              <Week weeks={g('weeks56')} dose="0.5 mg" box={g('sameBox1')} color={GREEN} />
              <Week weeks={g('weeks78')} dose="0.5 mg" box={g('box2')} color={colors.violet} />
            </Section>
            <Heading sub={g('after8Sub')}>{g('after8Title')}</Heading>
            <Section>
              <Row icon="syringe" title={g('continue')} subtitle={g('box15')} value="0.5 mg" />
              <Row icon="target" iconColor={colors.violet} title={g('stepUp')} subtitle={g('box3')} value="1 mg" />
            </Section>
          </>
        );
      case 'sites':
        return (
          <>
            <Heading sub={g('sitesSub')}>{g('sitesTitle')}</Heading>
            <Card padded={false} style={{ overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
              <Image source={IMG_SITES} style={{ width: '100%', aspectRatio: 775 / 949 }} resizeMode="contain" />
            </Card>
            <Section>
              <Row leading={<AppText variant="headline" tone="tint">1</AppText>} title={g('site1')} />
              <Row leading={<AppText variant="headline" tone="tint">2</AppText>} title={g('site2')} />
              <Row leading={<AppText variant="headline" tone="tint">3</AppText>} title={g('site3')} />
            </Section>
            <Callout icon="info" body={g('rotate')} tint={colors.success} />
          </>
        );
      case 'inject':
        return (
          <>
            <Heading>{g('injectTitle')}</Heading>
            {STEP_GROUPS.map((grp) => (
              <Section key={grp.title} title={g(grp.title)}>
                {grp.steps.map((n) => (
                  <Row key={n} leading={<AppText variant="headline" tone="tint" numeric>{n}</AppText>}>
                    <AppText variant="subhead">{g(`step${n}`)}</AppText>
                  </Row>
                ))}
              </Section>
            ))}
            <Heading sub={g('officialHint')}>{g('official')}</Heading>
            {[
              [IMG_STEPS_1, 771 / 961],
              [IMG_STEPS_2, 761 / 750],
            ].map(([src, ratio], i) => (
              <Card key={i} padded={false} style={{ overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <Image source={src as number} style={{ width: '100%', aspectRatio: ratio as number }} resizeMode="contain" />
              </Card>
            ))}
          </>
        );
      case 'weekly':
        return (
          <>
            <Heading>{g('weeklyTitle')}</Heading>
            <Card tone="violet" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{ width: 64, height: 68, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center' }}>
                <View style={{ height: 18, alignSelf: 'stretch', backgroundColor: colors.violet }} />
                <AppText variant="title1" tone="violet" style={{ marginTop: 4 }}>7</AppText>
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <AppText variant="headline" tone="violet">{g('weeklyOnce')}</AppText>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <View key={d} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d === 6 ? colors.violet : colors.fill }} />
                  ))}
                </View>
              </View>
            </Card>
            <Callout icon="calendar" body={g('weekly1')} />
            <Callout icon="clock" body={g('weekly2')} />
            <Callout icon="checkCircle" body={g('weekly3')} tint={colors.success} />
          </>
        );
      case 'missed':
        return (
          <>
            <Heading sub={g('missedIf')}>{g('missedTitle')}</Heading>
            <Card>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const bg = d === 0 || d === 7 ? colors.violet : d <= 5 ? colors.label : colors.fill;
                  return (
                    <View key={d} style={{ flex: 1, height: 34, borderRadius: 8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: d >= 1 && d <= 5 ? 0.85 : 1 }}>
                      <AppText variant="caption" weight="700" numeric style={{ color: d === 6 ? colors.label : colors.surface }}>
                        {d}
                      </AppText>
                    </View>
                  );
                })}
              </View>
              <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
                <AppText variant="footnote" tone="secondary">0 — {g('dueDay')} · 7 — {g('nextDose')}</AppText>
                <AppText variant="footnote" tone="secondary">1–5 — {g('takeIt')}</AppText>
                <AppText variant="footnote" tone="secondary">6+ — {g('skipIt')}</AppText>
              </View>
            </Card>
            <Callout icon="clock" title={g('within5Title')} body={g('within5Body')} tint={colors.success} />
            <Callout icon="chevronRight" title={g('over5Title')} body={g('over5Body')} tint={colors.warning} />
            <Card tone="filled">
              <AppText variant="headline" tone="onTint">{g('noDouble')}</AppText>
            </Card>
          </>
        );
      case 'storage':
        return (
          <>
            <Heading>{g('storageTitle')}</Heading>
            <Callout icon="shield" title={g('keepTitle')} body={g('keepBody')} tint={colors.success} />
            <Callout icon="snowflake" title={g('beforeTitle')} body={g('beforeBody')} tint={colors.info} />
            <Callout icon="thermo" title={g('duringTitle')} body={g('duringBody')} tint={colors.warning} />
          </>
        );
      case 'effects':
        return (
          <>
            <Heading sub={g('effectsSub')}>{g('effectsTitle')}</Heading>
            <Callout icon="alert" body={g('fx1')} tint={colors.warning} />
            <Callout icon="alert" body={g('fx2')} tint={colors.warning} />
            <Callout icon="drop" body={g('fx3')} tint={colors.danger} />
            <Heading>{g('tipsTitle')}</Heading>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {(
                [
                  ['drop', 'tip1'],
                  ['fork', 'tip2'],
                  ['alert', 'tip3'],
                  ['flame', 'tip4'],
                  ['walk', 'tip5'],
                  ['bed', 'tip6'],
                ] as [IconName, string][]
              ).map(([icon, key]) => (
                <Card key={key} style={{ width: '47.5%', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name={icon} size={26} color={colors.tint} />
                  <AppText variant="footnote" weight="600" style={{ textAlign: 'center' }}>
                    {g(key)}
                  </AppText>
                </Card>
              ))}
            </View>
          </>
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          {SECTIONS.map(({ key, icon }) => {
            const active = section === key;
            return (
              <PressableScale
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                haptic={false}
                onPress={() => {
                  haptics.select();
                  setSection(key);
                }}
                innerStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: active ? colors.tint : colors.surface }}
              >
                <Icon name={icon} size={15} color={active ? colors.onTint : colors.secondaryLabel} weight="semibold" />
                <AppText variant="subhead" weight="600" tone={active ? 'onTint' : 'label'}>
                  {t(`guide.sec.${key}`)}
                </AppText>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>
      <Screen gap={spacing.lg} contentContainerStyle={{ paddingTop: spacing.xs }}>
        {render()}
      </Screen>
    </View>
  );
}
