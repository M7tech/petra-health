import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../ui';
import { useI18n } from '../i18n';
import { addMedReminder, getMedReminders, removeMedReminder, MedReminder } from '../notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = [
  { label: '08:00', hour: 8, minute: 0 },
  { label: '14:00', hour: 14, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
];

export default function OtherMedsCard() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;

  const [meds, setMeds] = useState<MedReminder[]>([]);
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<'daily' | 'weekly'>('daily');
  const [weekday, setWeekday] = useState(1);
  const [timeIdx, setTimeIdx] = useState(2);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMedReminders().then(setMeds);
  }, []);

  async function add() {
    if (name.trim().length < 2) return;
    setBusy(true);
    const time = TIMES[timeIdx];
    const next = await addMedReminder(name.trim(), freq, weekday, time.hour, time.minute);
    if (next) {
      setMeds(next);
      setName('');
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setMeds(await removeMedReminder(id));
  }

  const fmt = (m: MedReminder) => {
    const time = `${String(m.hour).padStart(2, '0')}:${String(m.minute).padStart(2, '0')}`;
    const when = m.freq === 'daily' ? t('meds.daily') : `${t('meds.weekly')} · ${DAYS[m.weekday - 1]}`;
    return `${when} ${t('meds.at')} ${time}`;
  };

  return (
    <View style={styles.card}>
      <Text style={[styles.title, align]}>{t('meds.title')}</Text>

      {meds.map((m) => (
        <View key={m.id} style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, align]}>💊 {m.name}</Text>
            <Text style={[styles.meta, align]}>{fmt(m)}</Text>
          </View>
          <TouchableOpacity onPress={() => remove(m.id)}>
            <Text style={styles.remove}>{t('meds.remove')}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {meds.length === 0 && <Text style={[styles.muted, align]}>{t('meds.none')}</Text>}

      <TextInput
        style={[styles.input, align]}
        value={name}
        onChangeText={setName}
        placeholder={t('meds.name')}
        placeholderTextColor="#94a3b8"
      />
      <View style={styles.segRow}>
        {(['daily', 'weekly'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.seg, freq === f && styles.segActive]}
            onPress={() => setFreq(f)}
          >
            <Text style={[styles.segText, freq === f && styles.segTextActive]}>{t(`meds.${f}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {freq === 'weekly' && (
        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              onPress={() => setWeekday(i + 1)}
              style={[styles.dayBtn, weekday === i + 1 && styles.dayBtnActive]}
            >
              <Text style={[styles.dayText, weekday === i + 1 && { color: '#fff' }]}>{d[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.segRow}>
        {TIMES.map((tm, i) => (
          <TouchableOpacity
            key={tm.label}
            style={[styles.seg, timeIdx === i && styles.segActive]}
            onPress={() => setTimeIdx(i)}
          >
            <Text style={[styles.segText, timeIdx === i && styles.segTextActive]}>{tm.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={add} disabled={busy}>
        <Text style={styles.addText}>{t('meds.add')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', color: colors.text, marginBottom: 10, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  name: { color: colors.text, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  remove: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  muted: { color: colors.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginTop: 12,
  },
  segRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  seg: { flex: 1, borderRadius: 10, paddingVertical: 9, backgroundColor: '#f1f5f9', alignItems: 'center' },
  segActive: { backgroundColor: colors.petra },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  segTextActive: { color: '#fff' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  dayBtnActive: { backgroundColor: colors.petra },
  dayText: { color: colors.muted, fontWeight: '600' },
  addBtn: { marginTop: 14, backgroundColor: colors.petra, borderRadius: 10, padding: 13, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '600' },
});
