'use client';

import type { ContentPost } from '@petra/shared';
import { youtubeThumbnail } from '@/lib/youtube';
import { Card } from './ui';

export default function ContentPostCard({
  post,
  actions,
}: {
  post: ContentPost;
  actions?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <span className="mb-1 inline-block rounded-full bg-petra-50 px-2 py-0.5 text-xs font-medium text-petra-700">
            {post.type === 'TRAINING' ? 'Training' : 'News'}
          </span>
          <p className="font-semibold text-slate-800">{post.titleEn}</p>
          {(post.titleAr || post.titleKu) && (
            <p className="text-xs text-slate-400">{[post.titleAr, post.titleKu].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        {actions}
      </div>
      {post.bodyEn && <p className="mb-2 text-sm text-slate-600">{post.bodyEn}</p>}
      <div className="flex flex-wrap gap-3">
        {([
          ['English', post.videoUrlEn],
          ['Arabic', post.videoUrlAr],
          ['Kurdish', post.videoUrlKu],
        ] as const).map(([label, url]) => {
          if (!url) return null;
          const thumb = youtubeThumbnail(url);
          return (
            <a key={label} href={url} target="_blank" rel="noreferrer" className="block w-40">
              {thumb ? (
                <img src={thumb} alt={`${label} video`} className="mb-1 w-full rounded-lg" />
              ) : (
                <div className="mb-1 flex h-24 w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                  video
                </div>
              )}
              <span className="text-xs font-medium text-petra-600">▶ {label}</span>
            </a>
          );
        })}
      </div>
      {post.photoUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.photoUrls.map((u) => (
            <img key={u} src={u} alt="" className="h-20 w-20 rounded-lg object-cover" />
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {post.authorName ? `${post.authorName} · ` : ''}
        {new Date(post.publishedAt).toLocaleDateString()}
      </p>
    </Card>
  );
}
