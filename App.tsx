import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
});

import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { initializePurchases } from './src/services/purchases';
import { initAnalytics } from './src/services/analytics';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

initializePurchases();
initAnalytics();

export default Sentry.wrap(function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
});
