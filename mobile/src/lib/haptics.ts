import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Safe haptics wrapper: no-ops on web and never throws on unsupported devices. */
function safe(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
}

export const haptics = {
  /** Light tap feedback — checkbox/habit toggles, step buttons. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Selection feedback — segmented controls, chips, switches. */
  selection: () => safe(() => Haptics.selectionAsync()),
  /** Stronger feedback — destructive actions. */
  warning: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Success feedback — e.g. completing everything for the day. */
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
