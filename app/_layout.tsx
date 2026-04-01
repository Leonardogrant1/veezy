import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { NotificationProvider } from '@/contexts/NotificationContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { AppsFlyerTracker } from '@/lib/tracking/trackers/appsflyer-tracker';
import { PostHogTracker } from '@/lib/tracking/trackers/posthog-tracker';
import { PurchaseWrapper } from '@/services/purchases/PurchasesWrapper';
import { RevenueCatProvider } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { devLog } from '@/utils/dev-log';
import * as Notifications from 'expo-notifications';

trackerManager.register(new PostHogTracker());
trackerManager.register(new AppsFlyerTracker());
trackerManager.init();

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    devLog('🔔 handleNotification triggered:', JSON.stringify(notification))
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }
  },
  handleSuccess: (id) => devLog('✅ handleSuccess:', id),
  handleError: (id, error) => devLog('❌ handleError:', id, error),
})

export default function RootLayout() {

  const colorScheme = useColorScheme();

  return (
    <KeyboardProvider>
      <RevenueCatProvider>
        <PurchaseWrapper>
          <NotificationProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Slot />
              <StatusBar style="auto" />
            </ThemeProvider>
          </NotificationProvider>
        </PurchaseWrapper>
      </RevenueCatProvider>
    </KeyboardProvider>
  );
}
