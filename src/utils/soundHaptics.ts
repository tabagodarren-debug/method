import * as Haptics from 'expo-haptics';

// Sound effects will be added via expo-av once an EAS build is set up.
// Haptics work immediately on real devices.
export const SoundHaptics = {
  tap:       () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  select:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  advance:   () => Haptics.selectionAsync(),
  save:      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  streak:    () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  tabSwitch: () => Haptics.selectionAsync(),
};
