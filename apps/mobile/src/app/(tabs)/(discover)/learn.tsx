import React, { useCallback, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { api } from '@/api';
import { useI18n } from '@/i18n';
import { useFocusLoad } from '@/lib/hooks';
import { notifyError } from '@/lib/errors';
import { youtubeThumbnail } from '@/youtube';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Badge, Banner, Card, EmptyState, Icon, LoadingState, Screen, SegmentedControl } from '@/components/ui';
import type { ContentPost, ContentType } from '@/types';

type Filter = 'ALL' | ContentType;

function localized(post: ContentPost, lang: 'en' | 'ar' | 'ku') {
  const title = (lang === 'ar' ? post.titleAr : lang === 'ku' ? post.titleKu : null) || post.titleEn;
  const body = (lang === 'ar' ? post.bodyAr : lang === 'ku' ? post.bodyKu : null) || post.bodyEn;
  const videoUrl = (lang === 'ar' ? post.videoUrlAr : lang === 'ku' ? post.videoUrlKu : null) || post.videoUrlEn;
  return { title, body, videoUrl };
}

export default function LearnScreen() {
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await api<ContentPost[]>('/content'));
    } catch (e) {
      setError(notifyError(e, t('learn.loadFailed')));
    }
  }, [t]);
  const state = useFocusLoad(load);

  if (state.loading) return <LoadingState />;
  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.type === filter);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'ALL', label: t('learn.filterAll') },
          { key: 'TRAINING', label: t('learn.filterTraining') },
          { key: 'NEWS', label: t('learn.filterNews') },
        ]}
      />
      {error ? <Banner message={error} onRetry={state.reload} retryLabel={t('ui.retry')} /> : null}
      {filtered.length === 0 && !error ? <EmptyState icon="news" title={t('learn.noPosts')} /> : null}
      {filtered.map((post) => {
        const { title, body, videoUrl } = localized(post, lang);
        const thumb = youtubeThumbnail(videoUrl) ?? post.photoUrls[0] ?? null;
        return (
          <Card key={post.id} padded={false} style={{ overflow: 'hidden' }}>
            {thumb ? (
              <Pressable disabled={!videoUrl} onPress={() => videoUrl && Linking.openURL(videoUrl)} accessibilityRole={videoUrl ? 'button' : 'image'} accessibilityLabel={videoUrl ? t('learn.watchVideo') : title}>
                <Image source={{ uri: thumb }} style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.fill }} contentFit="cover" transition={200} />
                {videoUrl ? (
                  <View style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="play" size={26} color="#FFFFFF" />
                    </View>
                  </View>
                ) : null}
              </Pressable>
            ) : null}
            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Badge tone={post.type === 'TRAINING' ? 'violet' : 'info'} label={post.type === 'TRAINING' ? t('learn.filterTraining') : t('learn.filterNews')} />
              <AppText variant="headline">{title}</AppText>
              {body ? (
                <AppText variant="subhead" tone="secondary">
                  {body}
                </AppText>
              ) : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
