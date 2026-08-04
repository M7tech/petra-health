import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { api } from '../api';
import { useI18n } from '../i18n';
import { colors } from '../ui';
import { youtubeThumbnail } from '../youtube';
import type { ContentPost, ContentType } from '../types';

type Filter = 'ALL' | ContentType;

function localized(post: ContentPost, lang: 'en' | 'ar' | 'ku') {
  const title = (lang === 'ar' ? post.titleAr : lang === 'ku' ? post.titleKu : null) || post.titleEn;
  const body = (lang === 'ar' ? post.bodyAr : lang === 'ku' ? post.bodyKu : null) || post.bodyEn;
  const videoUrl = (lang === 'ar' ? post.videoUrlAr : lang === 'ku' ? post.videoUrlKu : null) || post.videoUrlEn;
  return { title, body, videoUrl };
}

export default function LearnScreen() {
  const { t, lang, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await api<ContentPost[]>('/content'));
    } catch (e) {
      setError(t('learn.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.type === filter);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={[styles.title, align]}>{t('learn.title')}</Text>
      <Text style={[styles.subtitle, align]}>{t('learn.subtitle')}</Text>

      {error && <Text style={[styles.error, align]}>{error}</Text>}

      <View style={[styles.filterRow, isRTL && { flexDirection: 'row-reverse' }]}>
        {([
          ['ALL', t('learn.filterAll')],
          ['TRAINING', t('learn.filterTraining')],
          ['NEWS', t('learn.filterNews')],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={[styles.muted, align]}>{t('learn.noPosts')}</Text>
      ) : (
        filtered.map((post) => {
          const { title, body, videoUrl } = localized(post, lang);
          const thumb = youtubeThumbnail(videoUrl);
          return (
            <View key={post.id} style={styles.card}>
              <View style={[styles.badge, post.type === 'TRAINING' ? styles.badgeTraining : styles.badgeNews]}>
                <Text style={styles.badgeText}>
                  {post.type === 'TRAINING' ? t('learn.filterTraining') : t('learn.filterNews')}
                </Text>
              </View>
              <Text style={[styles.postTitle, align]}>{title}</Text>
              {body && <Text style={[styles.postBody, align]}>{body}</Text>}

              {videoUrl && (
                <TouchableOpacity
                  style={styles.videoWrap}
                  onPress={() => Linking.openURL(videoUrl)}
                  activeOpacity={0.8}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.videoThumb} />
                  ) : (
                    <View style={[styles.videoThumb, styles.videoThumbFallback]} />
                  )}
                  <View style={styles.playOverlay}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <Text style={styles.watchLabel}>{t('learn.watchVideo')}</Text>
                </TouchableOpacity>
              )}

              {post.photoUrls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {post.photoUrls.map((u) => (
                    <Image key={u} source={{ uri: u }} style={styles.photo} />
                  ))}
                </ScrollView>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 60, paddingBottom: 140, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 16, marginTop: 2 },
  muted: { color: colors.muted },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#f1f5f9' },
  filterChipActive: { backgroundColor: colors.petra },
  filterText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  badgeTraining: { backgroundColor: '#eef2ff' },
  badgeNews: { backgroundColor: '#fff7ed' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.petra },
  postTitle: { fontWeight: '700', fontSize: 16, color: colors.text, marginBottom: 6 },
  postBody: { color: colors.muted, lineHeight: 20, marginBottom: 10 },
  videoWrap: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  videoThumb: { width: '100%', height: 180, backgroundColor: '#e2e8f0' },
  videoThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  playIcon: {
    color: '#fff',
    fontSize: 28,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 56,
    height: 56,
    borderRadius: 28,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
  },
  watchLabel: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  photo: { width: 96, height: 96, borderRadius: 10, marginRight: 8, backgroundColor: '#e2e8f0' },
});
