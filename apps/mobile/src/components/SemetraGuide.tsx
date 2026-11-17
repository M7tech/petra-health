import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../i18n';
import { colors } from '../ui';

// Brand-adjacent accents taken from the official Semetra guide: green for the
// 1.5 ml pen / 0.25–0.5 mg, purple for the second box, maroon for 3 ml / 1 mg.
const GREEN = '#145a46';
const PURPLE = '#63338a';
const MAROON = '#8c2846';

export type GuideSection = 'schedule' | 'sites' | 'inject' | 'weekly' | 'missed' | 'storage' | 'effects';

const SECTIONS: GuideSection[] = ['schedule', 'sites', 'inject', 'weekly', 'missed', 'storage', 'effects'];

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

export default function SemetraGuide({
  visible,
  onClose,
  initialSection = 'schedule',
}: {
  visible: boolean;
  onClose: () => void;
  initialSection?: GuideSection;
}) {
  const { t, isRTL } = useI18n();
  const [section, setSection] = useState<GuideSection>(initialSection);
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };
  const g = (k: string) => t(`guide.${k}`);

  // Reopening the guide from a different entry point lands on that section.
  useEffect(() => {
    if (visible) setSection(initialSection);
  }, [visible, initialSection]);

  function Heading({ children }: { children: string }) {
    return <Text style={[styles.heading, align]}>{children}</Text>;
  }

  function PenCard({
    size,
    color,
    lines,
    note,
  }: {
    size: string;
    color: string;
    lines: string[];
    note: string;
  }) {
    return (
      <View style={[styles.card, row, { alignItems: 'center', gap: 14 }]}>
        <View style={[styles.penTile, { backgroundColor: color }]}>
          <Text style={styles.penTileBig}>{size}</Text>
          <Text style={styles.penTileSmall}>ml</Text>
        </View>
        <View style={{ flex: 1 }}>
          {lines.map((l, i) =>
            l === 'or' ? (
              <Text key={i} style={[styles.orText, align]}>
                {g('or')}
              </Text>
            ) : (
              <Text key={i} style={[styles.penLine, align]}>
                {l}
              </Text>
            ),
          )}
          <Text style={[styles.muted, align, { marginTop: 6 }]}>{note}</Text>
        </View>
      </View>
    );
  }

  function ScheduleRow({
    weeks,
    dose,
    box,
    color,
  }: {
    weeks: string;
    dose: string;
    box: string;
    color: string;
  }) {
    return (
      <View style={[styles.card, row, { alignItems: 'center', gap: 12 }]}>
        <View style={[styles.weekChip, { backgroundColor: color }]}>
          <Text style={styles.weekChipText}>{weeks}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.doseBig, { color }, align]}>{dose}</Text>
          <Text style={[styles.muted, align]}>{g('perWeek')}</Text>
        </View>
        <Text style={[styles.boxLabel, align, { color }]}>{box}</Text>
      </View>
    );
  }

  function InfoCard({ icon, title, body, tint }: { icon: string; title?: string; body: string; tint?: string }) {
    return (
      <View style={[styles.card, row, { gap: 12, alignItems: 'flex-start' }, tint ? { backgroundColor: tint } : null]}>
        <View style={styles.iconBubble}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {title ? <Text style={[styles.cardTitle, align]}>{title}</Text> : null}
          <Text style={[styles.body, align]}>{body}</Text>
        </View>
      </View>
    );
  }

  function renderSchedule() {
    return (
      <>
        <Heading>{g('pensTitle')}</Heading>
        <Text style={[styles.muted, align, { marginBottom: 10 }]}>{g('concentration')}</Text>
        <PenCard
          size="1.5"
          color={GREEN}
          lines={[g('pen15'), g('pen15a'), g('pen15b'), 'or', g('pen15c')]}
          note={g('pen15note')}
        />
        <PenCard size="3" color={MAROON} lines={[g('pen3'), g('pen3a')]} note={g('pen3note')} />

        <Heading>{g('first8Title')}</Heading>
        <Text style={[styles.muted, align, { marginBottom: 10 }]}>{g('first8Sub')}</Text>
        <ScheduleRow weeks={g('weeks14')} dose="0.25 mg" box={g('box1')} color={GREEN} />
        <ScheduleRow weeks={g('weeks56')} dose="0.5 mg" box={g('sameBox1')} color={GREEN} />
        <ScheduleRow weeks={g('weeks78')} dose="0.5 mg" box={g('box2')} color={PURPLE} />

        <Heading>{g('after8Title')}</Heading>
        <Text style={[styles.muted, align, { marginBottom: 10 }]}>{g('after8Sub')}</Text>
        <View style={[styles.card, { backgroundColor: '#eef6f2' }]}>
          <Text style={[styles.cardTitle, align, { color: GREEN }]}>{g('continue')}</Text>
          <Text style={[styles.doseBig, { color: GREEN }, align]}>0.5 mg</Text>
          <Text style={[styles.muted, align]}>{g('box15')}</Text>
        </View>
        <Text style={styles.orCenter}>{g('or')}</Text>
        <View style={[styles.card, { backgroundColor: '#fbeef1' }]}>
          <Text style={[styles.cardTitle, align, { color: MAROON }]}>{g('stepUp')}</Text>
          <Text style={[styles.doseBig, { color: MAROON }, align]}>1 mg</Text>
          <Text style={[styles.muted, align]}>{g('box3')}</Text>
        </View>
      </>
    );
  }

  function renderSites() {
    const sites = [g('site1'), g('site2'), g('site3')];
    return (
      <>
        <Heading>{g('sitesTitle')}</Heading>
        <Text style={[styles.muted, align, { marginBottom: 10 }]}>{g('sitesSub')}</Text>
        <View style={styles.imageWrap}>
          <Image source={IMG_SITES} style={{ width: '100%', aspectRatio: 775 / 949 }} resizeMode="contain" />
        </View>
        {sites.map((s, i) => (
          <View key={i} style={[styles.card, row, { alignItems: 'center', gap: 12 }]}>
            <View style={styles.numBubble}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <Text style={[styles.body, align, { flex: 1, fontWeight: '600' }]}>{s}</Text>
          </View>
        ))}
        <View style={styles.noteBanner}>
          <Text style={[styles.noteText, align]}>{g('rotate')}</Text>
        </View>
      </>
    );
  }

  function renderInject() {
    return (
      <>
        <Heading>{g('injectTitle')}</Heading>
        {STEP_GROUPS.map((grp) => (
          <View key={grp.title} style={{ marginBottom: 6 }}>
            <Text style={[styles.groupTitle, align]}>{g(grp.title)}</Text>
            {grp.steps.map((n) => (
              <View key={n} style={[styles.stepRow, row]}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{n}</Text>
                </View>
                <Text style={[styles.stepText, align]}>{g(`step${n}`)}</Text>
              </View>
            ))}
          </View>
        ))}

        <Heading>{g('official')}</Heading>
        <Text style={[styles.muted, align, { marginBottom: 10 }]}>{g('officialHint')}</Text>
        <View style={styles.imageWrap}>
          <Image source={IMG_STEPS_1} style={{ width: '100%', aspectRatio: 771 / 961 }} resizeMode="contain" />
        </View>
        <View style={styles.imageWrap}>
          <Image source={IMG_STEPS_2} style={{ width: '100%', aspectRatio: 761 / 750 }} resizeMode="contain" />
        </View>
      </>
    );
  }

  function renderWeekly() {
    return (
      <>
        <Heading>{g('weeklyTitle')}</Heading>
        <View style={[styles.weeklyHero, row]}>
          <View style={styles.calendar}>
            <View style={styles.calendarTop} />
            <Text style={styles.calendarNum}>7</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.weeklyHeroText, align]}>{g('weeklyOnce')}</Text>
            <View style={[row, { gap: 6, marginTop: 10 }]}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <View key={d} style={[styles.dayDot, d === 6 && styles.dayDotOn]} />
              ))}
            </View>
          </View>
        </View>
        <InfoCard icon="📅" body={g('weekly1')} />
        <InfoCard icon="🕒" body={g('weekly2')} />
        <InfoCard icon="✅" body={g('weekly3')} />
      </>
    );
  }

  function renderMissed() {
    return (
      <>
        <Heading>{g('missedTitle')}</Heading>
        <Text style={[styles.cardTitle, align, { marginBottom: 10 }]}>{g('missedIf')}</Text>

        <View style={[styles.timeline, row]}>
          <View style={[styles.seg, { flex: 1, backgroundColor: PURPLE }]}>
            <Text style={styles.segText}>0</Text>
          </View>
          {[1, 2, 3, 4, 5].map((d) => (
            <View key={d} style={[styles.seg, { flex: 1, backgroundColor: '#3f3f46' }]}>
              <Text style={styles.segText}>{d}</Text>
            </View>
          ))}
          <View style={[styles.seg, { flex: 1, backgroundColor: '#c9c9cf' }]}>
            <Text style={[styles.segText, { color: '#3f3f46' }]}>6</Text>
          </View>
          <View style={[styles.seg, { flex: 1, backgroundColor: PURPLE }]}>
            <Text style={styles.segText}>7</Text>
          </View>
        </View>
        <View style={{ gap: 6, marginVertical: 12 }}>
          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <View style={[styles.legendDot, { backgroundColor: PURPLE }]} />
            <Text style={[styles.muted, align, { flex: 1 }]}>
              0 — {g('dueDay')} · 7 — {g('nextDose')}
            </Text>
          </View>
          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <View style={[styles.legendDot, { backgroundColor: '#3f3f46' }]} />
            <Text style={[styles.muted, align, { flex: 1 }]}>1–5 — {g('takeIt')}</Text>
          </View>
          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <View style={[styles.legendDot, { backgroundColor: '#c9c9cf' }]} />
            <Text style={[styles.muted, align, { flex: 1 }]}>6+ — {g('skipIt')}</Text>
          </View>
        </View>

        <InfoCard icon="⏱️" title={g('within5Title')} body={g('within5Body')} />
        <InfoCard icon="⏭️" title={g('over5Title')} body={g('over5Body')} />

        <View style={styles.warnBanner}>
          <Text style={[styles.warnText, align]}>{g('noDouble')}</Text>
        </View>
      </>
    );
  }

  function renderStorage() {
    return (
      <>
        <Heading>{g('storageTitle')}</Heading>
        <InfoCard icon="🛡️" title={g('keepTitle')} body={g('keepBody')} />
        <InfoCard icon="❄️" title={g('beforeTitle')} body={g('beforeBody')} />
        <InfoCard icon="🌡️" title={g('duringTitle')} body={g('duringBody')} />
      </>
    );
  }

  function renderEffects() {
    const tips = [
      ['💧', 'tip1'],
      ['🍽️', 'tip2'],
      ['🍟', 'tip3'],
      ['🌶️', 'tip4'],
      ['🏃', 'tip5'],
      ['😴', 'tip6'],
    ];
    return (
      <>
        <Heading>{g('effectsTitle')}</Heading>
        <Text style={[styles.muted, align, { marginBottom: 10 }]}>{g('effectsSub')}</Text>
        <InfoCard icon="🤢" body={g('fx1')} />
        <InfoCard icon="🚽" body={g('fx2')} />
        <InfoCard icon="🩸" body={g('fx3')} />

        <Heading>{g('tipsTitle')}</Heading>
        <View style={styles.tipGrid}>
          {tips.map(([icon, key]) => (
            <View key={key} style={styles.tip}>
              <Text style={{ fontSize: 26 }}>{icon}</Text>
              <Text style={styles.tipText}>{g(key)}</Text>
            </View>
          ))}
        </View>
      </>
    );
  }

  const content: Record<GuideSection, () => React.ReactElement> = {
    schedule: renderSchedule,
    sites: renderSites,
    inject: renderInject,
    weekly: renderWeekly,
    missed: renderMissed,
    storage: renderStorage,
    effects: renderEffects,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, row]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, align]}>{g('title')}</Text>
            <Text style={[styles.muted, align]}>{g('subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel={g('close')}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.chips, row]}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, section === s && styles.chipActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.chipText, section === s && styles.chipTextActive]}>{t(`guide.sec.${s}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>{content[section]()}</ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  chips: { flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  chip: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.petra, borderColor: colors.petra },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  content: { padding: 20, paddingTop: 6, paddingBottom: 60 },
  heading: { fontSize: 18, fontWeight: '700', color: PURPLE, marginTop: 14, marginBottom: 6 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10 },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 15, marginBottom: 4 },
  penTile: { width: 78, height: 96, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  penTileBig: { color: '#fff', fontSize: 30, fontWeight: '800' },
  penTileSmall: { color: '#fff', fontSize: 14, opacity: 0.9 },
  penLine: { color: colors.text, fontWeight: '600', fontSize: 14, lineHeight: 22 },
  orText: { color: colors.muted, fontSize: 12, marginVertical: 2 },
  orCenter: { textAlign: 'center', color: colors.muted, marginVertical: 2, marginBottom: 10, fontWeight: '600' },
  weekChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minWidth: 86, alignItems: 'center' },
  weekChipText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  doseBig: { fontSize: 24, fontWeight: '800' },
  boxLabel: { fontSize: 11, fontWeight: '600', maxWidth: 96 },
  imageWrap: { backgroundColor: '#fff', borderRadius: 16, padding: 8, marginBottom: 10, overflow: 'hidden' },
  numBubble: { width: 30, height: 30, borderRadius: 15, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#fff', fontWeight: '700' },
  noteBanner: { backgroundColor: '#eef6f2', borderRadius: 14, padding: 14, marginTop: 4 },
  noteText: { color: GREEN, fontWeight: '700', lineHeight: 21 },
  groupTitle: { color: colors.petra, fontWeight: '700', fontSize: 14, marginTop: 10, marginBottom: 6 },
  stepRow: { gap: 12, alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  iconBubble: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f3eef8', alignItems: 'center', justifyContent: 'center' },
  weeklyHero: { backgroundColor: '#f3eef8', borderRadius: 18, padding: 16, alignItems: 'center', gap: 16, marginBottom: 12 },
  weeklyHeroText: { color: PURPLE, fontSize: 17, fontWeight: '700' },
  calendar: { width: 70, height: 74, borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center' },
  calendarTop: { height: 20, alignSelf: 'stretch', backgroundColor: PURPLE },
  calendarNum: { color: PURPLE, fontSize: 30, fontWeight: '800', marginTop: 6 },
  dayDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d8cfe6' },
  dayDotOn: { backgroundColor: PURPLE, borderColor: PURPLE },
  timeline: { gap: 3 },
  seg: { height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  warnBanner: { backgroundColor: PURPLE, borderRadius: 14, padding: 16, marginTop: 6 },
  warnText: { color: '#fff', fontWeight: '700', fontSize: 15, lineHeight: 22 },
  tipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tip: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 8 },
  tipText: { color: colors.text, fontSize: 13, textAlign: 'center', lineHeight: 19, fontWeight: '600' },
});
