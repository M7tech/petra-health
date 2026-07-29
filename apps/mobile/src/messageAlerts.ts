import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { api } from './api';
import { requestPermission } from './notifications';
import { useI18n } from './i18n';
import type { SupportMessage } from './types';

const LAST_SEEN_KEY = 'petra_last_seen_admin_msg_at';
const POLL_MS = 20000;

// Polls the support thread while the app is open (foreground or
// backgrounded-but-alive) and fires a local notification for genuinely new
// admin replies. NOT a remote push — a fully force-quit app won't be
// notified; that needs an Expo push token + EAS project + server-side send.
export function useMessageNotifications(enabled: boolean) {
  const { t } = useI18n();
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    initialized.current = false;
    let stopped = false;

    async function poll() {
      try {
        const msgs = await api<SupportMessage[]>('/me/messages');
        const adminMsgs = msgs.filter((m) => m.sender === 'ADMIN');
        if (adminMsgs.length === 0 || stopped) return;
        const latest = adminMsgs[adminMsgs.length - 1];
        const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);

        if (!initialized.current) {
          initialized.current = true;
          if (!lastSeen) {
            await AsyncStorage.setItem(LAST_SEEN_KEY, latest.createdAt);
            return; // don't notify retroactively for history on first-ever run
          }
        }

        if (!lastSeen || latest.createdAt > lastSeen) {
          const granted = await requestPermission();
          if (granted && !stopped) {
            await Notifications.scheduleNotificationAsync({
              content: { title: t('contact.title'), body: latest.body, sound: 'default' },
              trigger: null,
            });
          }
          await AsyncStorage.setItem(LAST_SEEN_KEY, latest.createdAt);
        }
      } catch {
        /* ignore transient poll errors */
      }
    }

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [enabled, t]);
}
