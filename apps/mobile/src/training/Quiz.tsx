import React, { useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Button, Card, Icon, PressableScale, haptics } from '@/components/ui';
import { useTrainingProgress } from './progress';
import type { ModuleKey, ModuleMeta } from './content';

/** A short check after every module. Correct answer is always original option "a"; display order is shuffled per question. */
export default function Quiz({ module, questions }: { module: ModuleKey; questions: ModuleMeta['quiz'] }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { markDone, isDone } = useTrainingProgress();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[i];
  const letters = ['a', 'b', 'c'] as const;

  function check() {
    if (picked == null) return;
    setChecked(true);
    const ok = q.order[picked] === 0;
    if (ok) setScore((s) => s + 1);
    ok ? haptics.success() : haptics.error();
  }

  function next() {
    if (i + 1 < questions.length) {
      setI(i + 1);
      setPicked(null);
      setChecked(false);
    } else {
      setFinished(true);
      markDone(module, score);
      haptics.success();
    }
  }

  function retry() {
    setI(0);
    setPicked(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <Card tone="tinted" style={{ gap: spacing.md, alignItems: 'center' }}>
        <Icon name="checkCircle" size={36} color={colors.success} />
        <AppText variant="title3">{t('train.common.done')}</AppText>
        <AppText variant="body" tone="secondary" numeric>
          {t('train.common.score')}: {score} / {questions.length}
        </AppText>
        <Button title={t('train.common.retry')} variant="tinted" size="md" fullWidth={false} onPress={retry} />
      </Card>
    );
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <AppText variant="footnote" weight="600" tone="tint">
          {t('train.common.quizTitle')} · {i + 1}/{questions.length}
          {isDone(module) ? '  ✓' : ''}
        </AppText>
        <AppText variant="headline">{t(`train.q.${q.id}.q`)}</AppText>
      </View>
      {q.order.map((orig, pos) => {
        const correct = orig === 0;
        const isPicked = picked === pos;
        const bg = checked ? (correct ? colors.successSoft : isPicked ? colors.dangerSoft : colors.fill) : isPicked ? colors.tintSoft : colors.fill;
        const border = checked ? (correct ? colors.success : isPicked ? colors.danger : 'transparent') : isPicked ? colors.tint : 'transparent';
        return (
          <PressableScale
            key={pos}
            accessibilityRole="radio"
            accessibilityState={{ selected: isPicked, disabled: checked }}
            disabled={checked}
            haptic={false}
            onPress={() => {
              haptics.select();
              setPicked(pos);
            }}
            innerStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: border, backgroundColor: bg }}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="subhead">{t(`train.q.${q.id}.${letters[orig]}`)}</AppText>
            </View>
            {checked && correct ? <Icon name="checkCircle" size={20} color={colors.success} /> : null}
          </PressableScale>
        );
      })}
      {checked ? (
        <View>
          <AppText variant="subhead" style={{ color: q.order[picked ?? 0] === 0 ? colors.success : colors.warning }}>
            {q.order[picked ?? 0] === 0 ? t('train.common.correct') : t('train.common.wrong')}
          </AppText>
        </View>
      ) : null}
      {checked ? (
        <Button title={i + 1 < questions.length ? t('train.common.next') : t('train.common.finish')} onPress={next} />
      ) : (
        <Button title={t('train.common.check')} onPress={check} disabled={picked == null} />
      )}
    </Card>
  );
}
