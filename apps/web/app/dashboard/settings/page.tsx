'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card, PageHeader } from '@/components/ui';

export default function SettingsPage() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ doctorFeatures: boolean }>('/config')
      .then((c) => setEnabled(c.doctorFeatures))
      .catch(() => setError('Could not load settings.'));
  }, []);

  async function toggle() {
    if (enabled === null) return;
    setSaving(true);
    setError(null);
    try {
      const c = await api<{ doctorFeatures: boolean }>('/config', {
        method: 'PUT',
        body: JSON.stringify({ doctorFeatures: !enabled }),
      });
      setEnabled(c.doctorFeatures);
    } catch {
      setError('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <Card>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-semibold text-slate-800">{t('settings.doctorFeatures')}</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{t('settings.doctorFeaturesDesc')}</p>
          </div>
          <button
            role="switch"
            aria-checked={!!enabled}
            aria-label={t('settings.doctorFeatures')}
            disabled={enabled === null || saving}
            onClick={toggle}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${enabled ? 'bg-petra-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${enabled ? 'start-[22px]' : 'start-0.5'}`} />
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>
    </>
  );
}
