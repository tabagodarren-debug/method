import * as Notifications from 'expo-notifications';
import { getOnboardingData } from '../storage/settings';

type NotificationVariant = { title: string; body: string };

const variants = (name: string): NotificationVariant[] => {
  const hey = name ? `Hey ${name}` : 'Hey';
  return [
    { title: `${hey} 👋`, body: "Time to check in — how's your day going?" },
    { title: `${hey}, quick check-in`, body: 'Takes under a minute. How are you doing today?' },
    { title: `${hey} 📊`, body: "Don't forget to check in today — every entry counts." },
    { title: `${hey}, how are you?`, body: 'A quick check-in keeps your streaks on track.' },
    { title: `${hey} — time to log!`, body: "Tap to record how things are going today." },
    { title: `Time to check in, ${name || 'friend'} ✍️`, body: 'Tap to record how you feel today.' },
    { title: `${hey} 🌿`, body: "Your daily check-in is waiting. How's it going?" },
  ];
};

export const scheduleReminder = async (enabled: boolean, time: string): Promise<boolean> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  const { name } = await getOnboardingData();
  const pool = variants(name);
  // Pick deterministically by day-of-year so it rotates daily without needing state
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const { title, body } = pool[dayOfYear % pool.length];

  const [hours, minutes] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
  return true;
};
