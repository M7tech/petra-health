import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconButton, PressableScale, haptics } from '@/components/ui';
import { HOUR_MS, TAKE_WINDOW_HOURS, WEEK_HOURS, missedDoseDecision } from '@/training/rules';
import { AddedGuidance, Heading, ModuleScreen, SourceTag } from '@/training/ui';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const pad = (n: number) => String(n).padStart(2, '0');

/** The most recent Monday at 09:00 (local), as a worked example: a real date, not a fixed offset. */
function lastMonday9(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  const back = (d.getDay() + 6) % 7; // Monday = 0 days back
  d.setDate(d.getDate() - back);
  return d;
}
const plusDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
const plusMs = (d: Date, ms: number) => new Date(d.getTime() + ms);

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const { isRTL } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <AppText variant="footnote" tone="secondary" style={{ width: 52 }}>
        {label}
      </AppText>
      <IconButton icon={isRTL ? 'chevronRight' : 'chevronLeft'} label={`${label} −`} size={40} onPress={onMinus} />
      <AppText variant="subhead" weight="600" numeric style={{ minWidth: 118, textAlign: 'center' }}>
        {value}
      </AppText>
      <IconButton icon={isRTL ? 'chevronLeft' : 'chevronRight'} label={`${label} +`} size={40} onPress={onPlus} />
    </View>
  );
}

export default function MissedModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [due, setDue] = useState<Date>(lastMonday9);
  const [now, setNow] = useState<Date>(() => plusDays(lastMonday9(), 3));

  const dec = useMemo(() => missedDoseDecision(due.getTime(), now.getTime()), [due, now]);
  const fmtDay = (d: Date) => `${t(`train.missed.${DOW[d.getDay()]}`)} ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const color = { beforeDue: colors.violet, dueNow: colors.violet, take: colors.success, skip: colors.warning, resume: colors.violet, multiple: colors.warning }[dec.outcome];
  const message = {
    beforeDue: t('train.missed.beforeDue'),
    dueNow: t('train.missed.todayIs'),
    take: t('train.missed.takeNow'),
    skip: t('train.missed.skipIt'),
    resume: t('train.missed.resume'),
    multiple: t('train.missed.multiple'),
  }[dec.outcome];
  const showThen = dec.outcome === 'take' || dec.outcome === 'skip';

  const setRemembered = (d: Date) => {
    haptics.select();
    setNow(d);
  };
  const jumpHours = (h: number, extraMs = 0) => setRemembered(plusMs(due, h * HOUR_MS + extraMs));
  const pct = Math.max(0, Math.min(1, dec.hours / WEEK_HOURS)) * 100;
  const hoursLabel = dec.hours < 0 ? '—' : `${dec.days} ${t('train.missed.days')} ${dec.remHours} ${t('train.missed.hours')} (${Math.floor(dec.hours)} h)`;

  return (
    <ModuleScreen module="missed">
      <Heading sub={t('guide.missedIf')}>{t('guide.missedTitle')}</Heading>

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="headline">{t('train.missed.dueAt')}</AppText>
        <Stepper label={t('train.missed.day')} value={fmtDay(due)} onMinus={() => setDue((d) => plusDays(d, -1))} onPlus={() => setDue((d) => plusDays(d, 1))} />
        <Stepper label="h" value={fmtTime(due)} onMinus={() => setDue((d) => plusMs(d, -HOUR_MS))} onPlus={() => setDue((d) => plusMs(d, HOUR_MS))} />

        <View style={{ height: 1, backgroundColor: colors.separator, marginVertical: spacing.xs }} />

        <AppText variant="headline">{t('train.missed.rememberedAt')}</AppText>
        <Stepper label={t('train.missed.day')} value={fmtDay(now)} onMinus={() => setNow((d) => plusDays(d, -1))} onPlus={() => setNow((d) => plusDays(d, 1))} />
        <Stepper label="h" value={fmtTime(now)} onMinus={() => setNow((d) => plusMs(d, -HOUR_MS))} onPlus={() => setNow((d) => plusMs(d, HOUR_MS))} />
        <Stepper label="min" value={`:${pad(now.getMinutes())}`} onMinus={() => setNow((d) => plusMs(d, -60_000))} onPlus={() => setNow((d) => plusMs(d, 60_000))} />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
          {[
            { label: t('train.missed.scenario1'), onPress: () => jumpHours(72), bg: colors.successSoft, fg: colors.success },
            { label: t('train.missed.exact120'), onPress: () => jumpHours(TAKE_WINDOW_HOURS), bg: colors.successSoft, fg: colors.success },
            { label: t('train.missed.over120'), onPress: () => jumpHours(TAKE_WINDOW_HOURS, 60_000), bg: colors.warningSoft, fg: colors.warning },
            { label: t('train.missed.scenario2'), onPress: () => jumpHours(144), bg: colors.warningSoft, fg: colors.warning },
          ].map((c) => (
            <PressableScale key={c.label} haptic={false} onPress={c.onPress} innerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: c.bg }}>
              <AppText variant="footnote" weight="600" style={{ color: c.fg }}>
                {c.label}
              </AppText>
            </PressableScale>
          ))}
        </View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="footnote" weight="600" tone="secondary">
          {t('train.missed.elapsed')}
        </AppText>
        <AppText variant="title2" weight="700" numeric>
          {hoursLabel}
        </AppText>
        {/* 0–120 h take window, 120–168 h skip window, marker at the elapsed time. */}
        <View style={{ height: 34, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden' }}>
            <View style={{ flex: TAKE_WINDOW_HOURS, backgroundColor: colors.success, opacity: 0.85 }} />
            <View style={{ flex: WEEK_HOURS - TAKE_WINDOW_HOURS, backgroundColor: colors.fill }} />
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', start: `${pct}%`, marginStart: -3, width: 6, height: 34, borderRadius: 3, backgroundColor: colors.label }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="caption" tone="secondary" numeric>
            0 h
          </AppText>
          <AppText variant="caption" tone="secondary" numeric>
            120 h
          </AppText>
          <AppText variant="caption" tone="secondary" numeric>
            168 h
          </AppText>
        </View>
      </Card>

      {dec.outcome === 'multiple' ? (
        <AddedGuidance icon="alert" title={`${t('train.missed.day')} ${dec.days}`} body={message} />
      ) : (
        <Card style={{ gap: spacing.sm, borderWidth: 2, borderColor: color }}>
          <SourceTag kind="leaflet" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name={dec.outcome === 'take' ? 'checkCircle' : dec.outcome === 'skip' ? 'chevronRight' : 'calendar'} size={24} color={color} />
            <AppText variant="headline" style={{ color, flex: 1 }}>
              {fmtDay(now)} · {fmtTime(now)}
            </AppText>
          </View>
          <AppText variant="body">{message}</AppText>
          {showThen ? (
            <AppText variant="subhead" tone="secondary">
              {t('train.missed.then')}
            </AppText>
          ) : null}
        </Card>
      )}

      <Card tone="filled" style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Icon name="alert" size={26} color={colors.onTint} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="headline" tone="onTint">
              {t('train.missed.scenario3')}
            </AppText>
            <AppText variant="subhead" tone="onTint">
              {t('train.missed.double')}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" tone="onTint">
          {t('train.common.leaflet')}
        </AppText>
      </Card>

      {dec.outcome !== 'multiple' ? <AddedGuidance icon="alert" body={t('train.missed.multiple')} /> : null}
      <AddedGuidance icon="clock" body={t('train.missed.boundary')} />

      <AppText variant="footnote" tone="secondary" style={{ textAlign: 'center' }}>
        {t('train.common.disclaimer')}
      </AppText>
    </ModuleScreen>
  );
}
