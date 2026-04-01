import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PurchaseWrapper } from '@/services/purchases/PurchasesWrapper';
import { RevenueCatProvider } from '@/services/purchases/revenuecat/providers/RevenueCatProvider';

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

  if (!fontsLoaded) return null;

  return (
    <KeyboardProvider>
      <RevenueCatProvider>
        <PurchaseWrapper>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
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
