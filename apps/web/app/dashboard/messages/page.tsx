'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { MessageThreadSummary, SupportMessage } from '@petra/shared';
import { api } from '@/lib/api';
import { Card, PageHeader } from '@/components/ui';

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [active, setActive] = useState<MessageThreadSummary | null>(null);
  const [msgs, setMsgs] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  function loadThreads() {
    api<MessageThreadSummary[]>('/admin/messages')
      .then(setThreads)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }
  useEffect(loadThreads, []);

  function openThread(t: MessageThreadSummary) {
    setActive(t);
    api<SupportMessage[]>(`/admin/messages/${t.userId}`).then(setMsgs).catch(() => {});
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !active) return;
    try {
      const m = await api<SupportMessage>(`/admin/messages/${active.userId}`, {
        method: 'POST',
        body: JSON.stringify({ body: reply.trim() }),
      });
      setMsgs((prev) => [...prev, m]);
      setReply('');
      loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send');
    }
  }

  return (
    <>
      <PageHeader title="Messages" />
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Threads */}
        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">Patient messages</h2>
          {threads.length === 0 ? (
            <p className="text-sm text-slate-400">No messages yet.</p>
          ) : (
            <ul className="space-y-1">
              {threads.map((t) => (
                <li key={t.userId}>
                  <button
                    onClick={() => openThread(t)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      active?.userId === t.userId ? 'bg-petra-50' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">{t.patientName}</span>
                      {t.unreadFromPatient > 0 && (
                        <span className="rounded-full bg-petra-500 px-1.5 text-xs font-medium text-white">
                          {t.unreadFromPatient}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-400">{t.lastMessage}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Thread */}
        <Card>
          {!active ? (
            <p className="text-sm text-slate-400">Select a conversation.</p>
          ) : (
            <div className="flex h-[60vh] flex-col">
              <h2 className="mb-3 font-semibold text-slate-700">
                {active.patientName} <span className="text-xs text-slate-400">{active.patientEmail}</span>
              </h2>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.sender === 'ADMIN'
                        ? 'ml-auto bg-petra-500 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.body}
                    <div className={`mt-0.5 text-[10px] ${m.sender === 'ADMIN' ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="mt-3 flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as Petra Health…"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-petra-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-petra-500 px-4 py-2 text-sm font-medium text-white hover:bg-petra-600"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
