import React, { useRef, useState } from 'react';
import { PanResponder, Switch, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Button, Card, Icon, IconButton, SegmentedControl, haptics } from '@/components/ui';
import { useTrainingProgress } from '@/training/progress';
import { Callout, Heading, ModuleScreen } from '@/training/ui';

const T_MIN = -10;
const T_MAX = 40;
const TRACK = 230;
const toY = (t: number) => ((T_MAX - t) / (T_MAX - T_MIN)) * TRACK;

type Zone = 'frozen' | 'cold' | 'fridge' | 'warm' | 'room' | 'hot';
// Guide p.16: before opening 2–8 °C, never frozen; in use: up to 8 weeks below 30 °C, or 2–8 °C.
function zoneOf(temp: number, inUse: boolean): Zone {
  if (temp < 0) return 'frozen';
  if (temp < 2) return 'cold';
  if (temp <= 8) return 'fridge';
  if (temp <= 30) return inUse ? 'room' : 'warm';
  return 'hot';
}

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
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
        {/* The 2–8 °C refrigerator band. */}
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

export default function StorageModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { firstUse, setFirstUse } = useTrainingProgress();
  const [mode, setMode] = useState<'new' | 'use'>('new');
  const [temp, setTemp] = useState(5);
  const [capOn, setCapOn] = useState(true);
  const inUse = mode === 'use';
  const zone = zoneOf(temp, inUse);
  const zoneColor = { frozen: colors.info, cold: colors.info, fridge: colors.success, warm: colors.warning, room: colors.success, hot: colors.danger }[zone];
  const zoneText = { frozen: t('train.storage.zoneFrozen'), cold: t('train.storage.zoneCold'), fridge: t('train.storage.zoneFridge'), warm: t('train.storage.zoneWarmNew'), room: t('train.storage.zoneRoomInUse'), hot: t('train.storage.zoneHot') }[zone];
  const ok = zone === 'fridge' || zone === 'room';

  const setTempSafe = (v: number) => {
    const nz = zoneOf(v, inUse);
    if (nz !== zoneOf(temp, inUse)) (nz === 'fridge' || nz === 'room' ? haptics.success : haptics.select)();
    setTemp(v);
  };

  // Informational in-use tracker (never declares a pen safe or unsafe by age alone).
  const days = firstUse ? Math.max(0, Math.floor((startOfDay(ymd(new Date())).getTime() - startOfDay(firstUse).getTime()) / 86400000)) : null;
  const weekNo = days == null ? null : Math.floor(days / 7) + 1;
  const shiftDate = (delta: number) => {
    if (!firstUse) return;
    const d = startOfDay(firstUse);
    d.setDate(d.getDate() + delta);
    setFirstUse(ymd(d));
  };

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

      <Callout icon="snowflake" title={t(inUse ? 'train.storage.duringTitle' : 'train.storage.beforeTitle')} body={t(inUse ? 'guide.duringBody' : 'guide.beforeBody')} tint={colors.info} />
      <Fridge />

      <Card style={{ gap: spacing.md }}>
        <AppText variant="headline">{t('train.storage.temp')}</AppText>
        <AppText variant="footnote" tone="secondary">
          {t('train.storage.drag')}
        </AppText>
        <Thermometer temp={temp} setTemp={setTempSafe} color={zoneColor} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: ok ? colors.successSoft : colors.warningSoft, borderRadius: radius.md, padding: spacing.md }}>
          <Icon name={ok ? 'checkCircle' : zone === 'frozen' || zone === 'cold' ? 'snowflake' : 'thermo'} size={22} color={ok ? colors.success : zoneColor === colors.danger ? colors.danger : colors.warning} />
          <AppText variant="subhead" style={{ flex: 1 }}>
            {zoneText}
          </AppText>
        </View>
        {!ok ? (
          <AppText variant="footnote" tone="secondary">
            {t('train.storage.excursion')}
          </AppText>
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
            const elapsed = weekNo != null && w < weekNo;
            const current = weekNo != null && w === weekNo;
            return (
              <View key={w} style={{ flex: 1, height: current ? 46 : 38, borderRadius: 8, backgroundColor: elapsed || current ? colors.tint : colors.fill, opacity: elapsed ? 0.55 : 1, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="subhead" weight="700" numeric tone={elapsed || current ? 'onTint' : 'secondary'}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton icon="chevronLeft" label="−1" onPress={() => shiftDate(-1)} />
            <View style={{ alignItems: 'center' }}>
              <AppText variant="headline" numeric>
                {firstUse}
              </AppText>
              <AppText variant="subhead" tone="tint" numeric>
                {t('train.storage.weekOf')} {weekNo} / 8
              </AppText>
            </View>
            <IconButton icon="chevronRight" label="+1" onPress={() => shiftDate(1)} />
          </View>
        ) : (
          <Button title={t('train.storage.startedToday')} variant="tinted" size="md" onPress={() => setFirstUse(ymd(new Date()))} />
        )}
        {firstUse ? <Button title={t('train.storage.clear')} variant="plain" size="sm" onPress={() => setFirstUse(null)} /> : null}
        {weekNo != null && weekNo > 8 ? (
          <AppText variant="subhead" style={{ color: colors.warning }}>
            {t('train.storage.past8')}
          </AppText>
        ) : null}
        <AppText variant="footnote" tone="secondary">
          {t('train.storage.info')}
        </AppText>
      </Card>

      <Callout icon="shield" title={t('guide.keepTitle')} body={`${t('train.storage.kids')} ${t('train.storage.expiry')}`} tint={colors.success} />
    </ModuleScreen>
  );
}
