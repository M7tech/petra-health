'use client';

import { useEffect, useState } from 'react';
import type { ContentPost, ContentType } from '@petra/shared';
import { api } from '@/lib/api';
import ContentPostCard from '@/components/ContentPostCard';

export default function DoctorContentPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [filter, setFilter] = useState<ContentType | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ContentPost[]>('/content')
      .then(setPosts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.type === filter);

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold text-slate-800">Training & News</h1>
      <p className="mb-6 text-sm text-slate-500">Shared by Petra Health, in English, Arabic, and Kurdish.</p>
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mb-6 flex gap-2">
        {(['ALL', 'TRAINING', 'NEWS'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === f ? 'border-petra-500 bg-petra-50 text-petra-700' : 'border-slate-300 text-slate-500'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'TRAINING' ? 'Training' : 'News'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((p) => (
          <ContentPostCard key={p.id} post={p} />
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">Nothing published yet.</p>}
      </div>
    </>
  );
}
