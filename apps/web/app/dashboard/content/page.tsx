'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { ContentPost, ContentType, CreateContentDto } from '@petra/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';
import ContentPostCard from '@/components/ContentPostCard';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500 focus:ring-2 focus:ring-petra-500/20';
const textareaCls = inputCls + ' min-h-[70px]';

const EMPTY_FORM: CreateContentDto = {
  type: 'TRAINING',
  titleEn: '',
  titleAr: '',
  titleKu: '',
  bodyEn: '',
  bodyAr: '',
  bodyKu: '',
  videoUrlEn: '',
  videoUrlAr: '',
  videoUrlKu: '',
  photoUrls: [],
};

// Drop empty-string fields before sending — the API's @IsUrl/@IsOptional
// combo rejects '' (only undefined/null are treated as "not provided").
function cleanPayload(f: CreateContentDto): CreateContentDto {
  const out = {} as CreateContentDto;
  for (const [k, v] of Object.entries(f) as [keyof CreateContentDto, unknown][]) {
    if (v === '' || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
}

export default function ContentPage() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [filter, setFilter] = useState<ContentType | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateContentDto>(EMPTY_FORM);
  const [photoInput, setPhotoInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api<ContentPost[]>('/content').then(setPosts).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.type === filter);

  function startCreate() {
    setForm(EMPTY_FORM);
    setPhotoInput('');
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(p: ContentPost) {
    setForm({
      type: p.type,
      titleEn: p.titleEn,
      titleAr: p.titleAr ?? '',
      titleKu: p.titleKu ?? '',
      bodyEn: p.bodyEn ?? '',
      bodyAr: p.bodyAr ?? '',
      bodyKu: p.bodyKu ?? '',
      videoUrlEn: p.videoUrlEn ?? '',
      videoUrlAr: p.videoUrlAr ?? '',
      videoUrlKu: p.videoUrlKu ?? '',
      photoUrls: p.photoUrls,
    });
    setPhotoInput('');
    setEditingId(p.id);
    setShowForm(true);
  }

  function addPhoto() {
    const url = photoInput.trim();
    if (!url) return;
    setForm({ ...form, photoUrls: [...(form.photoUrls ?? []), url] });
    setPhotoInput('');
  }
  function removePhoto(url: string) {
    setForm({ ...form, photoUrls: (form.photoUrls ?? []).filter((u) => u !== url) });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = cleanPayload(form);
      if (editingId) {
        await api(`/content/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/content', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: ContentPost) {
    if (!confirm(`Delete "${p.titleEn}"?`)) return;
    await api(`/content/${p.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <PageHeader
        title="Training & News"
        action={
          session?.isSuperAdmin ? (
            <button
              onClick={startCreate}
              className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600"
            >
              + New post
            </button>
          ) : undefined
        }
      />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Shared with doctors and patients in the app, in whichever language they&apos;re using.
      </p>
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

      {showForm && session?.isSuperAdmin && (
        <div className="mb-6">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-700">{editingId ? 'Edit post' : 'New post'}</h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="flex gap-2">
                {(['TRAINING', 'NEWS'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      form.type === t ? 'border-petra-500 bg-petra-50 text-petra-700' : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    {t === 'TRAINING' ? 'Training' : 'News'}
                  </button>
                ))}
              </div>

              {(['En', 'Ar', 'Ku'] as const).map((lang) => {
                const titleKey = `title${lang}` as const;
                const bodyKey = `body${lang}` as const;
                const videoKey = `videoUrl${lang}` as const;
                const label = lang === 'En' ? 'English' : lang === 'Ar' ? 'Arabic' : 'Kurdish';
                return (
                  <div key={lang} className="rounded-lg border border-slate-200 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <div className="space-y-2">
                      <input
                        placeholder={`Title (${label})${lang === 'En' ? ' — required' : ''}`}
                        required={lang === 'En'}
                        className={inputCls}
                        value={form[titleKey] ?? ''}
                        onChange={(e) => setForm({ ...form, [titleKey]: e.target.value })}
                      />
                      <textarea
                        placeholder={`Body (${label})`}
                        className={textareaCls}
                        value={form[bodyKey] ?? ''}
                        onChange={(e) => setForm({ ...form, [bodyKey]: e.target.value })}
                      />
                      <input
                        placeholder={`YouTube link (${label})`}
                        className={inputCls}
                        value={form[videoKey] ?? ''}
                        onChange={(e) => setForm({ ...form, [videoKey]: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })}

              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Photos (image URLs)</p>
                <div className="mb-2 flex gap-2">
                  <input
                    placeholder="https://…"
                    className={inputCls}
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPhoto();
                      }
                    }}
                  />
                  <button type="button" onClick={addPhoto} className="rounded-lg bg-slate-100 px-3 text-sm text-slate-600 hover:bg-slate-200">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.photoUrls ?? []).map((u) => (
                    <span key={u} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {u.length > 40 ? u.slice(0, 40) + '…' : u}
                      <button type="button" onClick={() => removePhoto(u)} className="text-slate-400 hover:text-red-600">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600 disabled:opacity-60">
                  {busy ? 'Saving…' : editingId ? 'Save changes' : 'Publish'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((p) => (
          <ContentPostCard
            key={p.id}
            post={p}
            actions={
              session?.isSuperAdmin ? (
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(p)} className="text-petra-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => remove(p)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              ) : undefined
            }
          />
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">Nothing published yet.</p>}
      </div>
    </>
  );
}
