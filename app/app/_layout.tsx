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
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PurchaseWrapper } from '@/services/purchases/PurchasesWrapper';
import { RevenueCatProvider } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';
import { UserCloudSync } from '@/services/user-cloud-sync';
import { WidgetBridge } from '@/services/widgets/widget-bridge';
import { useVisionStore } from '@/stores/VisionStore';

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
    // Sync widget on app start for existing users
    WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        console.log('Backgrounding app, syncing data...');
        UserCloudSync.upload().catch(() => { });
        WidgetBridge.sync(useVisionStore.getState().visions).catch(() => { });
      }
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
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
  );
}
