import React from 'react';
import LogValueSheet from '@/components/LogValueSheet';
import { useI18n } from '@/i18n';

export default function LogWeight() {
  const { t } = useI18n();
  return <LogValueSheet label={t('weight.todaysWeight')} unit="kg" placeholder="82.5" path="/me/weights" field="weightKg" min={20} max={500} invalidMessage={t('weight.invalid')} />;
}
