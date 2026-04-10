import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider, PostHogSurveyProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { detectLanguage, initI18n, type AppLanguage } from '@/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackerManager } from '@/lib/tracking/tracker-manager';
import { AppsFlyerTracker } from '@/lib/tracking/trackers/appsflyer-tracker';
import { PostHogTracker } from '@/lib/tracking/trackers/posthog-tracker';
import { initPosthog } from '@/services/posthog/init';
import { PurchaseWrapper } from '@/services/purchases/PurchasesWrapper';
import { RevenueCatProvider } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { cancelPaywallAbandonNotification, schedulePaywallAbandonNotification } from '@/services/notifications';
import { dismissPaywallRef, paywallOpenRef } from '@/services/purchases/superwall/useSuperwall';
import { useUserDataStore } from '@/stores/UserDataStore';
import { UserCloudSync } from '@/services/user-cloud-sync';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useVisionStore } from '@/stores/VisionStore';
import { devLog } from '@/utils/dev-log';
import * as Notifications from 'expo-notifications';



trackerManager.register(new PostHogTracker());
trackerManager.register(new AppsFlyerTracker());
trackerManager.init();

// Init i18n — read persisted language or detect from device locale
const storedLanguage = (() => {
  try {
    const { useUserDataStore } = require('@/stores/UserDataStore');
    const lang = useUserDataStore.getState().language as AppLanguage | undefined;
    return lang || undefined;
  } catch {
    return undefined;
  }
})();
initI18n(storedLanguage ?? detectLanguage());

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

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const notificationSub = Notifications.addNotificationResponseReceivedListener(() => {
      trackerManager.track('notification_opened');
    });

    // Sync widget on app start for existing users
    WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        console.log('Backgrounding app, syncing data...');
        UserCloudSync.upload().catch(() => { });
        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
        if (paywallOpenRef.current) {
          const language = useUserDataStore.getState().language;
          schedulePaywallAbandonNotification(language).catch(() => {});
        }
      }
      if (nextState === 'active' && paywallOpenRef.current) {
        cancelPaywallAbandonNotification().catch(() => {});
        dismissPaywallRef.current().catch(() => {});
      }
    });
    return () => {
      notificationSub.remove();
      sub.remove();
    };
  }, []);

  if (!fontsLoaded) return null;

  const posthog = initPosthog();

  return (
    <PostHogProvider client={posthog}>
      <PostHogSurveyProvider>
      <KeyboardProvider>
        <RevenueCatProvider>
          <PurchaseWrapper>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="start" options={{ animation: 'fade' }} />
                <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                <Stack.Screen name="tutorial" options={{ animation: 'fade' }} />
                <Stack.Screen name="home" options={{ animation: 'fade' }} />
                <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
                <Stack.Screen name="edit-self-reference" options={{ presentation: 'modal' }} />
                <Stack.Screen name="vision/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                <Stack.Screen name="vision/add" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </PurchaseWrapper>
        </RevenueCatProvider>
      </KeyboardProvider>
      </PostHogSurveyProvider>
    </PostHogProvider>
  );
}
