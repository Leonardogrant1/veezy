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
import { Stack as ExpoRouterStack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider, PostHogSurveyProvider } from 'posthog-react-native';
import React, { useEffect, ReactNode } from 'react';
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
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PremiumWelcomeModal } from '@/components/modals/PremiumWelcomeModal';
import { useUserDataStore } from '@/stores/UserDataStore';
import { useAppReadyStore } from '@/stores/AppReadyStore';
import { UserCloudSync } from '@/services/user-cloud-sync';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useVisionStore } from '@/stores/VisionStore';
import { PendingVisionWatcher } from '@/services/pending-vision-watcher';
import { syncPushToken } from '@/services/push-token-sync';
import { devLog } from '@/utils/dev-log';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const Stack = Object.assign(
  (props: React.ComponentProps<typeof ExpoRouterStack>) => {
    return <ExpoRouterStack {...props} />;
  },
  ExpoRouterStack,
  {
    Protected: ({ guard, children }: { guard: boolean; children: ReactNode }) => {
      return guard ? <>{children}</> : null;
    },
  }
);

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
  const hasOnboarded = useUserDataStore((s) => s.hasOnboarded);
  const hasSeenTutorial = useUserDataStore((s) => s.hasSeenTutorial);
  const cloudSyncReady = useAppReadyStore((s) => s.cloudSyncReady);

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
    const notificationSub = Notifications.addNotificationResponseReceivedListener((response) => {
      trackerManager.track('notification_opened');
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.visionId) {
        useVisionStore.getState().setFocusVisionId(data.visionId);
        PendingVisionWatcher.checkNow().catch(() => { });
        router.push('/home');
      }
    });

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      PendingVisionWatcher.checkNow().catch(() => { });
    });

    PendingVisionWatcher.start();
    if (useUserDataStore.getState().hasOnboarded) {
      syncPushToken().catch(() => { });
    }

    // Sync widget on app start for existing users
    WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });

    let paywallBackgroundedAt: number | null = null;
    const PAYWALL_DISMISS_AFTER_MS = 30_000;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        console.log('Backgrounding app, syncing data...');
        UserCloudSync.upload().catch(() => { });
        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
        if (paywallOpenRef.current) {
          paywallBackgroundedAt = Date.now();
          const language = useUserDataStore.getState().language;
          schedulePaywallAbandonNotification(language).catch(() => {});
        }
      }
      if (nextState === 'active') {
        if (paywallOpenRef.current && paywallBackgroundedAt !== null) {
          cancelPaywallAbandonNotification().catch(() => {});
          const elapsed = Date.now() - paywallBackgroundedAt;
          if (elapsed >= PAYWALL_DISMISS_AFTER_MS) {
            dismissPaywallRef.current().catch(() => {});
          }
          paywallBackgroundedAt = null;
        }
      }
    });
    return () => {
      notificationSub.remove();
      receivedSub.remove();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && cloudSyncReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, cloudSyncReady]);

  if (!fontsLoaded) return null;

  const posthog = initPosthog();

  return (
    <PostHogProvider client={posthog}>
      <PostHogSurveyProvider>
      <KeyboardProvider>
        <RevenueCatProvider>
          <PurchaseWrapper>
            <NotificationProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {cloudSyncReady ? (
                <Stack screenOptions={{ headerShown: false }}>
                  {/* 1. Pre-onboarding Stack */}
                  <Stack.Protected guard={!hasOnboarded}>
                    <Stack.Screen name="start" options={{ animation: 'fade' }} />
                    <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                  </Stack.Protected>

                  {/* 2. Pre-tutorial Stack */}
                  <Stack.Protected guard={hasOnboarded && !hasSeenTutorial}>
                    <Stack.Screen name="tutorial" options={{ animation: 'fade' }} />
                  </Stack.Protected>

                  {/* 3. Main App Stack */}
                  <Stack.Protected guard={hasOnboarded && hasSeenTutorial}>
                    <Stack.Screen name="home" options={{ animation: 'fade' }} />
                    <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="edit-self-reference" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="vision/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                    <Stack.Screen name="vision/add" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
                  </Stack.Protected>
                </Stack>
              ) : null}
              <StatusBar style="auto" />
              <PremiumWelcomeModal />
            </ThemeProvider>
            </NotificationProvider>
          </PurchaseWrapper>
        </RevenueCatProvider>
      </KeyboardProvider>
      </PostHogSurveyProvider>
    </PostHogProvider>
  );
}
