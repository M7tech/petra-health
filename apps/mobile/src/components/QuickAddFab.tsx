import React, { useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Field, PrimaryButton, colors } from '../ui';

type CaptureKind = 'weight' | 'a1c' | null;

const ITEM_SPACING = 66;
const FAB_BOTTOM = 78;

export default function QuickAddFab({
  onNavigate,
  onLogged,
}: {
  onNavigate: (tab: 'meds' | 'weight') => void;
  onLogged: () => void;
}) {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const [capture, setCapture] = useState<CaptureKind>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !open;
    setOpen(next);
    Animated.spring(anim, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 7, tension: 70 }).start();
  }

  function close() {
    setOpen(false);
    Animated.spring(anim, { toValue: 0, useNativeDriver: true, friction: 7, tension: 70 }).start();
  }

  function resetCapture() {
    setCapture(null);
    setValue('');
    setError(null);
    setBusy(false);
  }

  function pick(action: { key: 'weight' | 'dose' | 'a1c' | 'other' }) {
    close();
    if (action.key === 'weight') setCapture('weight');
    else if (action.key === 'a1c') setCapture('a1c');
    else onNavigate('meds');
  }

  async function submitCapture() {
    if (!capture) return;
    const v = parseFloat(value.replace(',', '.'));
    if (capture === 'weight') {
      if (Number.isNaN(v) || v < 20 || v > 500) {
        setError(t('weight.invalid'));
        return;
      }
    } else if (Number.isNaN(v) || v < 3 || v > 20) {
      setError(t('health.a1cInvalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (capture === 'weight') {
        await api('/me/weights', { method: 'POST', body: JSON.stringify({ weightKg: v }) });
      } else {
        await api('/me/hba1c', { method: 'POST', body: JSON.stringify({ value: v }) });
      }
      onLogged();
      resetCapture();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  const actions: { key: 'weight' | 'dose' | 'a1c' | 'other'; icon: string; label: string }[] = [
    { key: 'dose', icon: '💉', label: t('quickAdd.logDose') },
    { key: 'weight', icon: '⚖️', label: t('quickAdd.logWeight') },
    { key: 'a1c', icon: '🩸', label: t('quickAdd.logA1c') },
    { key: 'other', icon: '💊', label: t('quickAdd.logOther') },
  ];

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={close} />}
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.backdrop, { opacity: backdropOpacity }]} />

      {actions.map((a, i) => {
        // Each item interpolates off the same driver value but with its own
        // input-range offset, so they pop out in a staggered cascade rather
        // than moving in lockstep — a fan of floating buttons, not a sheet.
        const delay = i * 0.12;
        const itemAnim = anim.interpolate({
          inputRange: [0, Math.min(delay, 0.6), 1],
          outputRange: [0, 0, 1],
        });
        const translateY = itemAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -(ITEM_SPACING * (i + 1))] });
        const scale = itemAnim;
        return (
          <Animated.View
            key={a.key}
            pointerEvents={open ? 'auto' : 'none'}
            style={[
              styles.miniRow,
              isRTL && { flexDirection: 'row-reverse' },
              { bottom: FAB_BOTTOM, opacity: itemAnim, transform: [{ translateY }, { scale }] },
            ]}
          >
            {!isRTL && (
              <View style={styles.labelPill}>
                <Text style={styles.labelText}>{a.label}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.miniFab} activeOpacity={0.8} onPress={() => pick(a)}>
              <Text style={styles.miniIcon}>{a.icon}</Text>
            </TouchableOpacity>
            {isRTL && (
              <View style={styles.labelPill}>
                <Text style={styles.labelText}>{a.label}</Text>
              </View>
            )}
          </Animated.View>
        );
      })}

      <TouchableOpacity style={styles.fab} onPress={toggle} activeOpacity={0.85}>
        <Animated.Text style={[styles.fabIcon, { transform: [{ rotate }] }]}>+</Animated.Text>
      </TouchableOpacity>

      <Modal visible={!!capture} transparent animationType="fade" onRequestClose={resetCapture}>
        <Pressable style={styles.dialogBackdrop} onPress={resetCapture} />
        <View style={styles.dialogWrap}>
          <View style={styles.dialog}>
            <Text style={[styles.dialogTitle, align]}>
              {capture === 'weight' ? t('quickAdd.logWeight') : t('quickAdd.logA1c')}
            </Text>
            {error && <Text style={[styles.error, align]}>{error}</Text>}
            <Field
              label={capture === 'weight' ? t('weight.todaysWeight') : t('health.a1cLabel')}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder={capture === 'weight' ? '82.5' : '7.4'}
              autoFocus
              textAlign={isRTL ? 'right' : 'left'}
            />
            <PrimaryButton title={t('common.save')} onPress={submitCapture} loading={busy} />
            <TouchableOpacity onPress={resetCapture} style={{ marginTop: 14 }}>
              <Text style={[styles.back, align]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: FAB_BOTTOM,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.petra,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.petra,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 4,
    borderColor: colors.bg,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
  miniRow: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniIcon: { fontSize: 21 },
  labelPill: {
    backgroundColor: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  labelText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dialogBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  dialogWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
  },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '600' },
});
