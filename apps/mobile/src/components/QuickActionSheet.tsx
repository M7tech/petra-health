import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Field, PrimaryButton, colors } from '../ui';

type CaptureKind = 'weight' | 'a1c' | null;

export default function QuickActionSheet({
  visible,
  onClose,
  onNavigate,
  onLogged,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: 'meds' | 'weight') => void;
  onLogged: () => void;
}) {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [capture, setCapture] = useState<CaptureKind>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCapture(null);
    setValue('');
    setError(null);
    setBusy(false);
  }

  function close() {
    reset();
    onClose();
  }

  function go(tab: 'meds' | 'weight') {
    reset();
    onClose();
    onNavigate(tab);
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
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  const actions = [
    { key: 'weight' as const, icon: '⚖️', label: t('quickAdd.logWeight'), onPress: () => setCapture('weight') },
    { key: 'dose' as const, icon: '💉', label: t('quickAdd.logDose'), onPress: () => go('meds') },
    { key: 'a1c' as const, icon: '🩸', label: t('quickAdd.logA1c'), onPress: () => setCapture('a1c') },
    { key: 'other' as const, icon: '💊', label: t('quickAdd.logOther'), onPress: () => go('meds') },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        {capture ? (
          <>
            <Text style={[styles.title, align]}>
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
            <TouchableOpacity onPress={() => setCapture(null)} style={{ marginTop: 14 }}>
              <Text style={[styles.back, align]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.title, align]}>{t('quickAdd.title')}</Text>
            <View style={styles.grid}>
              {actions.map((a) => (
                <TouchableOpacity key={a.key} style={styles.tile} onPress={a.onPress} activeOpacity={0.7}>
                  <View style={styles.tileIcon}>
                    <Text style={{ fontSize: 26 }}>{a.icon}</Text>
                  </View>
                  <Text style={styles.tileLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 40,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  tile: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontWeight: '600', color: colors.text, fontSize: 13 },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  back: { color: colors.muted, textAlign: 'center', fontWeight: '600' },
});
