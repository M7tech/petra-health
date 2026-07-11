import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local scheduled notifications fire on-device and work fully offline.

const REMINDER_KEY = 'petra_reminder'; // stored: { weekday, hour, minute, id }

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
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
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return granted;
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
