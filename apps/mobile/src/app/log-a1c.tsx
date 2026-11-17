import React from 'react';
import LogValueSheet from '@/components/LogValueSheet';
import { useI18n } from '@/i18n';

export default function LogA1c() {
  const { t } = useI18n();
  return <LogValueSheet label={t('health.a1cLabel')} unit="%" placeholder="7.4" path="/me/hba1c" field="value" min={3} max={20} invalidMessage={t('health.a1cInvalid')} />;
}
