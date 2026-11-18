import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from '@/i18n';

// Local scheduled notifications fire on-device and work fully offline.

const REMINDER_KEY = 'petra_reminder'; // stored: { weekday, hour, minute, id }

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // shows on the lock/home screen, not just in the tray
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderState {
  weekday: number; // 1 = Sunday … 7 = Saturday (expo convention)
  hour: number;
  minute: number;
  id: string;
}

export async function requestPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Dose reminders',
      importance: Notifications.AndroidImportance.HIGH, // heads-up banner + sound
      sound: 'default',
    });
  }
  return granted;
}

// Remote push token (real, server-deliverable push — requires a dev/prod
// build; Expo Go can no longer register for Android remote push as of SDK53).
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isRunningInExpoGo()) return null;
  const ok = await requestPermission();
  if (!ok) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

export async function getReminder(): Promise<ReminderState | null> {
  const raw = await AsyncStorage.getItem(REMINDER_KEY);
  return raw ? (JSON.parse(raw) as ReminderState) : null;
}

// Schedule (or reschedule) a weekly repeating reminder. Cancels any prior one.
export async function scheduleWeeklyReminder(
  weekday: number,
  hour: number,
  minute: number,
): Promise<ReminderState | null> {
  const ok = await requestPermission();
  if (!ok) return null;

  await cancelReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Semetra weekly dose',
      body: "Time for your weekly injection. Open the app to log it once it's done.",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
      channelId: 'reminders',
    },
  });

  const state: ReminderState = { weekday, hour, minute, id };
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(state));
  return state;
}

export async function cancelReminder(): Promise<void> {
  const current = await getReminder();
  if (current) {
    try {
      await Notifications.cancelScheduledNotificationAsync(current.id);
    } catch {
      /* already gone */
    }
  }
  await AsyncStorage.removeItem(REMINDER_KEY);
}

// ---- Arbitrary "other medication" reminders (daily/weekly/monthly) ----
const MEDS_KEY = 'petra_med_reminders';

export type MedFrequency = 'daily' | 'weekly' | 'monthly';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export interface MedReminder {
  ids: string[]; // one scheduled notification per daily time slot; else length 1
  name: string;
  freq: MedFrequency;
  times: TimeOfDay[]; // daily: 1-3 slots; weekly/monthly: exactly 1
  weekday?: number; // weekly only (1=Sun..7=Sat)
  dayOfMonth?: number; // monthly only (1-28)
}

export async function getMedReminders(): Promise<MedReminder[]> {
  const raw = await AsyncStorage.getItem(MEDS_KEY);
  return raw ? (JSON.parse(raw) as MedReminder[]) : [];
}

export interface AddMedReminderInput {
  name: string;
  freq: MedFrequency;
  times: TimeOfDay[]; // daily: up to 3; weekly/monthly: exactly 1
  weekday?: number;
  dayOfMonth?: number;
}

export async function addMedReminder(input: AddMedReminderInput): Promise<MedReminder[] | null> {
  const ok = await requestPermission();
  if (!ok) return null;

  const content = {
    title: input.name,
    body: `Time to take ${input.name}.`,
    sound: 'default' as const,
  };

  const ids: string[] = [];
  if (input.freq === 'daily') {
    for (const t of input.times) {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: t.hour,
          minute: t.minute,
          channelId: 'reminders',
        },
      });
      ids.push(id);
    }
  } else if (input.freq === 'weekly') {
    const t = input.times[0];
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: input.weekday ?? 1,
        hour: t.hour,
        minute: t.minute,
        channelId: 'reminders',
      },
    });
    ids.push(id);
  } else {
    const t = input.times[0];
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: input.dayOfMonth ?? 1,
        hour: t.hour,
        minute: t.minute,
        channelId: 'reminders',
      },
    });
    ids.push(id);
  }

  const reminder: MedReminder = {
    ids,
    name: input.name,
    freq: input.freq,
    times: input.times,
    weekday: input.weekday,
    dayOfMonth: input.dayOfMonth,
  };
  const list = await getMedReminders();
  const next = [...list, reminder];
  await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(next));
  return next;
}

export async function removeMedReminder(reminder: MedReminder): Promise<MedReminder[]> {
  for (const id of reminder.ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      /* already gone */
    }
  }
  const list = (await getMedReminders()).filter(
    (m) => JSON.stringify(m.ids) !== JSON.stringify(reminder.ids),
  );
  await AsyncStorage.setItem(MEDS_KEY, JSON.stringify(list));
  return list;
}

// ---- Care guidance notifications (text comes from the patient guide, in the user's language) ----

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Dose reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

/** Shortly after the course starts: how to store the pen. */
export async function scheduleStorageTip(): Promise<void> {
  try {
    if (!(await requestPermission())) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: tr('ui.notifStorageTitle'),
        body: `${tr('guide.beforeBody')} ${tr('guide.duringBody')}`,
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 30, channelId: 'reminders' },
    });
  } catch {
    /* notifications unavailable (e.g. Expo Go / web): the guide screen still has it */
  }
}

const MISSED_KEY = 'petra_missed_guidance'; // stored: { sig, ids }

/**
 * Schedules the "you missed a dose — here is what to do" notifications for the next unlogged
 * dose: one the day after it is due (within five days: take it now) and one on day six (skip it,
 * keep the usual day). Logging the dose moves them to the following week, so they only ever
 * appear when a dose really was missed. Pass null when there is no active course.
 */
export async function scheduleMissedDoseGuidance(nextDue: Date | null): Promise<void> {
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;

    const raw = await AsyncStorage.getItem(MISSED_KEY);
    const prev = raw ? (JSON.parse(raw) as { sig: string; ids: string[] }) : null;

    const reminder = await getReminder();
    const hour = reminder?.hour ?? 9;
    const minute = reminder?.minute ?? 0;
    const sig = nextDue ? `${nextDue.toISOString().slice(0, 10)}|${hour}:${minute}|${tr('ui.notifMissedTitle')}` : 'none';
    if (prev && prev.sig === sig) return;

    for (const id of prev?.ids ?? []) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        /* already gone */
      }
    }
    if (!nextDue) {
      await AsyncStorage.removeItem(MISSED_KEY);
      return;
    }

    await ensureAndroidChannel();
    // Doses are stored as noon UTC on the due day; read the calendar day, then use the reminder time locally.
    const at = (plusDays: number) =>
      new Date(nextDue.getUTCFullYear(), nextDue.getUTCMonth(), nextDue.getUTCDate() + plusDays, hour, minute, 0);
    const plan = [
      { when: at(1), body: `${tr('guide.within5Body')} ${tr('guide.noDouble')}` },
      { when: at(6), body: `${tr('guide.over5Body')} ${tr('guide.noDouble')}` },
    ];
    const ids: string[] = [];
    for (const p of plan) {
      if (p.when.getTime() <= Date.now() + 60_000) continue;
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: { title: tr('ui.notifMissedTitle'), body: p.body, sound: 'default' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.when, channelId: 'reminders' },
        }),
      );
    }
    await AsyncStorage.setItem(MISSED_KEY, JSON.stringify({ sig, ids }));
  } catch {
    /* best effort */
  }
}
