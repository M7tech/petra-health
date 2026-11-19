import React, { useRef, useState } from 'react';
import { PanResponder, Switch, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Button, Card, Icon, IconButton, SegmentedControl, haptics } from '@/components/ui';
import { useTrainingProgress } from '@/training/progress';
import { TempZone, addDays, daysBetween, toISO, tempZone, useLimit, useStatus } from '@/training/rules';
import { AddedGuidance, Callout, Heading, ModuleScreen } from '@/training/ui';

const T_MIN = -10;
const T_MAX = 40;
const TRACK = 230;
const toY = (t: number) => ((T_MAX - t) / (T_MAX - T_MIN)) * TRACK;
const pad = (n: number) => String(n).padStart(2, '0');
const todayISO = () => {
  const d = new Date();
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

function Thermometer({ temp, setTemp, color }: { temp: number; setTemp: (t: number) => void; color: string }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const fill = useSharedValue(TRACK - toY(5));
  React.useEffect(() => {
    const h = TRACK - toY(temp);
    fill.value = reduce ? h : withTiming(h, { duration: 160, easing: Easing.out(Easing.quad) });
  }, [temp, reduce, fill]);
  const mercury = useAnimatedStyle(() => ({ height: fill.value }));

  const fromY = (y: number) => Math.round(T_MAX - (Math.max(0, Math.min(TRACK, y)) / TRACK) * (T_MAX - T_MIN));
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setTemp(fromY(e.nativeEvent.locationY)),
      onPanResponderMove: (e) => setTemp(fromY(e.nativeEvent.locationY)),
    }),
  ).current;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <View
        {...pan.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityValue={{ text: `${temp} °C` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => setTemp(Math.max(T_MIN, Math.min(T_MAX, temp + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
        style={{ width: 44, height: TRACK, borderRadius: 22, backgroundColor: colors.fill, overflow: 'hidden', justifyContent: 'flex-end' }}
      >
        {/* The labelled 2–8 °C refrigerator band. */}
        <View pointerEvents="none" style={{ position: 'absolute', start: 0, end: 0, top: toY(8), height: toY(2) - toY(8), backgroundColor: colors.successSoft, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.success }} />
        <Animated.View pointerEvents="none" style={[{ width: '100%', backgroundColor: color }, mercury]} />
      </View>
      <View style={{ flex: 1, gap: spacing.sm }}>
        <AppText variant="largeTitle" weight="700" numeric style={{ color }}>
          {temp} °C
        </AppText>
        <AppText variant="caption" tone="secondary">
          {T_MAX} … {T_MIN} °C
        </AppText>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <IconButton icon="chevronLeft" label="−1 °C" onPress={() => setTemp(Math.max(T_MIN, temp - 1))} />
          <IconButton icon="chevronRight" label="+1 °C" onPress={() => setTemp(Math.min(T_MAX, temp + 1))} />
        </View>
      </View>
    </View>
  );
}

function Fridge() {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Card style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
      <View style={{ width: 120, height: 170, borderRadius: 14, borderWidth: 4, borderColor: colors.secondaryLabel, backgroundColor: colors.infoSoft, overflow: 'hidden' }}>
        {/* Cooling element on the back wall. */}
        <View style={{ position: 'absolute', end: 0, top: 0, bottom: 0, width: 16, backgroundColor: colors.info, opacity: 0.55 }} />
        <View style={{ position: 'absolute', start: 0, end: 0, top: 56, height: 3, backgroundColor: colors.secondaryLabel }} />
        <View style={{ position: 'absolute', start: 0, end: 0, top: 112, height: 3, backgroundColor: colors.secondaryLabel }} />
        {/* The pen sits on the shelf, well away from the cooling element. */}
        <View style={{ position: 'absolute', start: 14, top: 92, width: 56, height: 14, borderRadius: 7, backgroundColor: '#2D8CF0' }}>
          <View style={{ position: 'absolute', start: 22, top: 0, width: 14, height: 14, backgroundColor: colors.violet }} />
        </View>
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText variant="headline">{t('train.storage.fridgeTitle')} · 2–8 °C</AppText>
        <AppText variant="subhead" tone="secondary">
          {t('train.storage.element')}
        </AppText>
      </View>
    </Card>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const { isRTL } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <IconButton icon={isRTL ? 'chevronRight' : 'chevronLeft'} label={`${label} −`} onPress={onMinus} />
      <AppText variant="headline" numeric>
        {value}
      </AppText>
      <IconButton icon={isRTL ? 'chevronLeft' : 'chevronRight'} label={`${label} +`} onPress={onPlus} />
    </View>
  );
}

export default function StorageModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { firstUse, setFirstUse, expiry, setExpiry } = useTrainingProgress();
  const [mode, setMode] = useState<'new' | 'use'>('new');
  const [temp, setTemp] = useState(5);
  const [capOn, setCapOn] = useState(true);
  const [knownFrozen, setKnownFrozen] = useState(false);
  const inUse = mode === 'use';

  // A reading is only ever compared with the labelled range. It never "proves" the medicine froze.
  const zone: TempZone = tempZone(temp, inUse);
  const ok = zone === 'fridge' || zone === 'inUseRoom';
  const zoneColor = { belowRange: colors.warning, fridge: colors.success, inUseRoom: colors.success, aboveRange: colors.danger }[zone];
  const zoneText = {
    belowRange: t('train.storage.zoneBelow'),
    fridge: t('train.storage.zoneFridge'),
    inUseRoom: t('train.storage.zoneRoomInUse'),
    aboveRange: t(inUse ? 'train.storage.zoneAboveUse' : 'train.storage.zoneAboveNew'),
  }[zone];

  const setTempSafe = (v: number) => {
    const nz = tempZone(v, inUse);
    if (nz !== zone) (nz === 'fridge' || nz === 'inUseRoom' ? haptics.success : haptics.select)();
    setTemp(v);
  };

  // In-use limit: the earlier of 8 weeks and the printed expiry. Never a statement that the pen is safe.
  const today = todayISO();
  const limit = firstUse ? useLimit(firstUse, expiry) : null;
  const status = limit ? useStatus(limit, today) : null;
  const dayNo = firstUse ? daysBetween(firstUse, today) + 1 : null;
  const shiftDate = (delta: number) => firstUse && setFirstUse(addDays(firstUse, delta));
  const nowD = new Date();
  const shiftExpiry = (months: number) => {
    const e = expiry ?? { year: nowD.getFullYear() + 1, month: nowD.getMonth() + 1 };
    const idx = e.year * 12 + (e.month - 1) + months;
    setExpiry({ year: Math.floor(idx / 12), month: (idx % 12) + 1 });
  };
  const limitedByText = limit ? t({ inUse: 'train.storage.limitedByInUse', expiry: 'train.storage.limitedByExpiry', both: 'train.storage.limitedByBoth' }[limit.limitedBy]) : '';
  const weekNo = dayNo == null ? null : Math.min(8, Math.floor((dayNo - 1) / 7) + 1);

  return (
    <ModuleScreen module="storage">
      <Heading>{t('guide.storageTitle')}</Heading>
      <SegmentedControl<'new' | 'use'>
        value={mode}
        options={[
          { key: 'new', label: t('train.storage.notOpened') },
          { key: 'use', label: t('train.storage.inUse') },
        ]}
        onChange={setMode}
      />

      <Callout icon="snowflake" source="leaflet" title={t(inUse ? 'train.storage.duringTitle' : 'train.storage.beforeTitle')} body={t(inUse ? 'guide.duringBody' : 'guide.beforeBody')} tint={colors.info} />
      <Fridge />

      <Card style={{ gap: spacing.md }}>
        <AppText variant="headline">{t('train.storage.temp')}</AppText>
        <AppText variant="footnote" tone="secondary">
          {t('train.storage.drag')}
        </AppText>
        <Thermometer temp={temp} setTemp={setTempSafe} color={zoneColor} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: ok ? colors.successSoft : colors.warningSoft, borderRadius: radius.md, padding: spacing.md }}>
          <Icon name={ok ? 'checkCircle' : 'alert'} size={22} color={ok ? colors.success : zoneColor} />
          <AppText variant="subhead" style={{ flex: 1 }}>
            {zoneText}
          </AppText>
        </View>
        {!ok ? (
          <AppText variant="footnote" tone="secondary">
            {t('train.storage.excursion')}
          </AppText>
        ) : null}

        {/* Freezing is only ever stated when the user tells us the medicine is known to have frozen. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <AppText variant="subhead" style={{ flex: 1 }}>
            {t('train.storage.knownFrozen')}
          </AppText>
          <Switch accessibilityLabel={t('train.storage.knownFrozen')} value={knownFrozen} onValueChange={setKnownFrozen} trackColor={{ true: colors.danger }} />
        </View>
        {knownFrozen ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md }}>
            <Icon name="close" size={22} color={colors.danger} />
            <AppText variant="subhead" weight="600" style={{ flex: 1, color: colors.danger }}>
              {t('train.storage.frozenBan')}
            </AppText>
          </View>
        ) : null}
        <AppText variant="caption" tone="secondary">
          {t('train.common.disclaimer')}
        </AppText>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="headline">{t('train.storage.light')}</AppText>
          <Switch accessibilityLabel={t('train.storage.light')} value={capOn} onValueChange={setCapOn} trackColor={{ true: colors.tint }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 90, height: 18, borderRadius: 9, backgroundColor: '#2D8CF0', overflow: 'hidden', opacity: capOn ? 1 : 0.75 }}>
            <View style={{ position: 'absolute', end: 0, top: 0, bottom: 0, width: 26, backgroundColor: capOn ? colors.violet : 'transparent', borderWidth: capOn ? 0 : 1, borderColor: colors.warning, borderStyle: 'dashed' }} />
          </View>
          <AppText variant="subhead" style={{ flex: 1, color: capOn ? colors.success : colors.warning }}>
            {capOn ? t('train.storage.capOn') : t('train.storage.capOff')}
          </AppText>
        </View>
      </Card>

      <Heading>{t('train.storage.timelineTitle')}</Heading>
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
            const past = status?.status === 'pastLimit';
            const elapsed = weekNo != null && (past || w < weekNo);
            const current = weekNo != null && !past && w === weekNo;
            return (
              <View key={w} style={{ flex: 1, height: current ? 46 : 38, borderRadius: 8, backgroundColor: past ? colors.danger : elapsed || current ? colors.tint : colors.fill, opacity: elapsed && !past ? 0.55 : 1, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="subhead" weight="700" numeric tone={elapsed || current || past ? 'onTint' : 'secondary'}>
                  {w}
                </AppText>
              </View>
            );
          })}
        </View>

        <AppText variant="footnote" weight="600" tone="secondary">
          {t('train.storage.firstUse')}
        </AppText>
        {firstUse ? (
          <Stepper label={t('train.storage.firstUse')} value={firstUse} onMinus={() => shiftDate(-1)} onPlus={() => shiftDate(1)} />
        ) : (
          <Button title={t('train.storage.startedToday')} variant="tinted" size="md" onPress={() => setFirstUse(today)} />
        )}
        {firstUse ? <Button title={t('train.storage.clear')} variant="plain" size="sm" onPress={() => setFirstUse(null)} /> : null}

        <AppText variant="footnote" weight="600" tone="secondary">
          {t('train.storage.expiryField')}
        </AppText>
        {expiry ? (
          <>
            <Stepper label={t('train.storage.expiryField')} value={`${pad(expiry.month)}/${expiry.year}`} onMinus={() => shiftExpiry(-1)} onPlus={() => shiftExpiry(1)} />
            <Button title={t('train.storage.noExpiry')} variant="plain" size="sm" onPress={() => setExpiry(null)} />
          </>
        ) : (
          <Button title={t('train.storage.setExpiry')} variant="tinted" size="md" onPress={() => shiftExpiry(0)} />
        )}
        <AppText variant="caption" tone="secondary">
          {t('train.storage.expiryHint')}
        </AppText>
      </Card>

      {limit && status ? (
        <Card style={{ gap: spacing.sm, borderWidth: 2, borderColor: status.status === 'withinPeriod' ? colors.separator : colors.danger }}>
          <AppText variant="footnote" weight="600" tone="secondary">
            {t('train.storage.limitTitle')}
          </AppText>
          <AppText variant="largeTitle" weight="700" numeric style={{ color: status.status === 'withinPeriod' ? colors.label : colors.danger }}>
            {limit.lastDay}
          </AppText>
          <AppText variant="subhead" tone="secondary">
            {limitedByText}
          </AppText>
          {dayNo != null ? (
            <AppText variant="subhead" numeric>
              {t('train.storage.daySince')} {dayNo}
            </AppText>
          ) : null}
          {status.status === 'pastLimit' ? (
            <AppText variant="headline" style={{ color: colors.danger }}>
              {t('train.storage.pastLimit')}
            </AppText>
          ) : status.status === 'lastDay' ? (
            <AppText variant="headline" style={{ color: colors.warning }}>
              {t('train.storage.lastDayMsg')}
            </AppText>
          ) : (
            <AppText variant="subhead">{t('train.storage.withinMsg')}</AppText>
          )}
        </Card>
      ) : null}

      <AddedGuidance icon="calendar" body={t('train.storage.howCounted')} />
      <Callout icon="shield" source="leaflet" title={t('guide.keepTitle')} body={`${t('train.storage.kids')} ${t('train.storage.expiry')}`} tint={colors.success} />
    </ModuleScreen>
  );
}
