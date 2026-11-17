import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useFocusEffect } from 'expo-router';
import { api } from '@/api';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Banner, EmptyState, Icon, InputField, LoadingState, PressableScale, haptics } from '@/components/ui';
import type { SupportMessage } from '@/types';

export default function MessagesScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await api<SupportMessage[]>('/me/messages'));
    } catch (e) {
      setError((prev) => prev ?? notifyError(e, t('learn.loadFailed')));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
      // Keep the thread live while open, so a reply shows without leaving.
      const id = setInterval(load, 12000);
      return () => clearInterval(id);
    }, [load]),
  );

  useEffect(() => {
    if (messages) setError(null);
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      const m = await api<SupportMessage>('/me/messages', { method: 'POST', body: JSON.stringify({ body }) });
      setMessages((p) => [...(p ?? []), m]);
      setText('');
      haptics.tap();
    } catch (e) {
      setError(notifyError(e, t('ui.couldNotSave')));
      haptics.error();
    } finally {
      setBusy(false);
    }
  }

  if (!messages) return error ? <Banner message={error} onRetry={load} retryLabel={t('ui.retry')} /> : <LoadingState />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        inverted
        data={[...messages].reverse()}
        keyExtractor={(m) => m.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }}
        ListEmptyComponent={<View style={{ transform: [{ scaleY: -1 }] }}><EmptyState icon="message" title={t('contact.none')} /></View>}
        renderItem={({ item }) => {
          const mine = item.sender === 'PATIENT';
          return (
            <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', gap: 2 }}>
              <View
                style={{
                  backgroundColor: mine ? colors.tint : colors.surface,
                  borderRadius: radius.xl,
                  borderCurve: 'continuous',
                  borderBottomEndRadius: mine ? 6 : radius.xl,
                  borderBottomStartRadius: mine ? radius.xl : 6,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                }}
              >
                <AppText variant="body" tone={mine ? 'onTint' : 'label'} selectable>
                  {item.body}
                </AppText>
              </View>
              <AppText variant="caption" tone="secondary" style={{ alignSelf: mine ? 'flex-end' : 'flex-start', paddingHorizontal: spacing.xs }}>
                {mine ? t('contact.you') : t('contact.team')} · {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
          );
        }}
      />
      {error ? <View style={{ paddingHorizontal: spacing.lg }}><Banner message={error} /></View> : null}
      <KeyboardStickyView>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.separator }}>
          <InputField value={text} onChangeText={setText} placeholder={t('contact.placeholder')} multiline style={{ flex: 1, maxHeight: 120 }} />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('contact.send')}
            disabled={busy || !text.trim()}
            onPress={send}
            haptic={false}
            innerStyle={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? colors.tint : colors.fill, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="send" size={22} color={text.trim() ? colors.onTint : colors.tertiaryLabel} weight="bold" />
          </PressableScale>
        </View>
      </KeyboardStickyView>
    </View>
  );
}
