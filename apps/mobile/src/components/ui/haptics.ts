import * as Haptics from 'expo-haptics';

// Tiny wrapper so call sites read as intent, and failures never surface.
const run = (fn: () => Promise<void>) => {
  fn().catch(() => {});
};

export const haptics = {
  /** A light tap — button presses, toggles. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Selection changed — segmented controls, pickers. */
  select: () => run(() => Haptics.selectionAsync()),
  /** Something succeeded — a dose logged, a form saved. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something needs attention. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
