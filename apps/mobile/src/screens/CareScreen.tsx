import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../api';
import { useI18n } from '../i18n';
import { PrimaryButton, colors } from '../ui';
import {
  AdverseEvent,
  AdverseSeverity,
  ClinicalAssessment,
  PatientComment,
  SEVERITIES,
} from '../types';

const SEV_COLOR: Record<AdverseSeverity, string> = {
  MILD: '#16a34a',
  MODERATE: '#d97706',
  SEVERE: '#dc2626',
};

export default function CareScreen() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;

  const [comments, setComments] = useState<PatientComment[]>([]);
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [assessment, setAssessment] = useState<ClinicalAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [desc, setDesc] = useState('');
  const [severity, setSeverity] = useState<AdverseSeverity>('MILD');
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, e, a] = await Promise.all([
        api<PatientComment[]>('/me/comments'),
        api<AdverseEvent[]>('/me/adverse-events'),
        api<ClinicalAssessment | null>('/me/assessment'),
      ]);
      setComments(c);
      setEvents(e);
      setAssessment(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logEvent() {
    if (desc.trim().length < 2) return;
    setBusy(true);
    try {
      await api('/me/adverse-events', {
        method: 'POST',
        body: JSON.stringify({ description: desc.trim(), severity }),
      });
      setDesc('');
      setSeverity('MILD');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function endTreatment() {
    setBusy(true);
    try {
      await api('/me/treatment', {
        method: 'PUT',
        body: JSON.stringify({ treatmentStatus: 'DISCONTINUED', discontinuationReason: reason.trim() }),
      });
      setEnding(false);
      setReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update');
    } finally {
      setBusy(false);
    }
  }

  const status = assessment?.treatmentStatus ?? 'ONGOING';
  const statusLabel =
    status === 'ONGOING'
      ? t('care.statusOngoing')
      : status === 'COMPLETED'
        ? t('care.statusCompleted')
        : t('care.statusDiscontinued');
  const statusColor = status === 'DISCONTINUED' ? colors.danger : status === 'COMPLETED' ? colors.muted : '#16a34a';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={[styles.title, align]}>{t('care.title')}</Text>
      {error && <Text style={[styles.error, align]}>{error}</Text>}

      {/* Treatment status */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('care.treatment')}</Text>
        <View style={[styles.statusRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {assessment?.discontinuationReason ? (
          <Text style={[styles.muted, align]}>
            {t('care.reasonLabel')}: {assessment.discontinuationReason}
          </Text>
        ) : null}

        {status === 'ONGOING' &&
          (ending ? (
            <View style={{ marginTop: 12 }}>
              <TextInput
                style={[styles.input, align]}
                value={reason}
                onChangeText={setReason}
                placeholder={t('care.reasonPlaceholder')}
                placeholderTextColor="#94a3b8"
              />
              <View style={{ marginTop: 10 }}>
                <PrimaryButton title={t('care.confirmEnd')} onPress={endTreatment} loading={busy} />
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEnding(true)} style={{ marginTop: 12 }}>
              <Text style={styles.endLink}>{t('care.endTreatment')}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Physician notes */}
      {assessment?.physicianComments ? (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, align]}>{t('care.physicianNotes')}</Text>
          <Text style={[styles.body, align]}>{assessment.physicianComments}</Text>
        </View>
      ) : null}

      {/* Doctor comments */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('care.comments')}</Text>
        {comments.length === 0 ? (
          <Text style={[styles.muted, align]}>{t('care.noComments')}</Text>
        ) : (
          comments.map((c) => (
            <View key={c.id} style={styles.commentItem}>
              <Text style={[styles.body, align]}>{c.body}</Text>
              <Text style={[styles.meta, align]}>
                {c.doctorName ?? 'Doctor'} · {new Date(c.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Adverse events */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('care.adverseEvents')}</Text>
        <TextInput
          style={[styles.input, align]}
          value={desc}
          onChangeText={setDesc}
          placeholder={t('care.eventDesc')}
          placeholderTextColor="#94a3b8"
        />
        <View style={[styles.sevRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {SEVERITIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sevBtn, severity === s && { backgroundColor: SEV_COLOR[s] }]}
              onPress={() => setSeverity(s)}
            >
              <Text style={[styles.sevText, severity === s && { color: '#fff' }]}>
                {t(`severity.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <PrimaryButton title={t('care.log')} onPress={logEvent} loading={busy} />

        <View style={{ marginTop: 14 }}>
          {events.length === 0 ? (
            <Text style={[styles.muted, align]}>{t('care.noEvents')}</Text>
          ) : (
            events.map((e) => (
              <View
                key={e.id}
                style={[styles.eventItem, isRTL && { flexDirection: 'row-reverse' }]}
              >
                <View style={[styles.sevDot, { backgroundColor: SEV_COLOR[e.severity] }]} />
                <Text style={[styles.eventText, align]}>{e.description}</Text>
                <Text style={styles.meta}>{new Date(e.onsetDate).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 56, paddingBottom: 40, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontWeight: '700', color: colors.text, marginBottom: 10, fontSize: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontWeight: '700', fontSize: 16 },
  endLink: { color: colors.danger, fontWeight: '600' },
  body: { color: colors.text, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  muted: { color: colors.muted },
  error: { backgroundColor: '#fef2f2', color: colors.danger, padding: 10, borderRadius: 8, marginBottom: 12 },
  commentItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  sevRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  sevBtn: { flex: 1, borderRadius: 10, paddingVertical: 9, backgroundColor: '#f1f5f9', alignItems: 'center' },
  sevText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  eventItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  eventText: { flex: 1, color: colors.text },
});
