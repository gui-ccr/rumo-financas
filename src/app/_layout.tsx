import '../global.css';

import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ContainerProvider } from '@/core/container-context';
import { useAppBootstrap } from '@/core/use-app-bootstrap';
import { useNotificationSync } from '@/features/shifts/presentation/hooks';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { applyStoredThemePreference } from '@/shared/presentation/theme-preference';
import { useIsDark, useNavTheme, useThemeColors } from '@/shared/ui/theme';

SplashScreen.preventAutoHideAsync();
applyStoredThemePreference();

const queryClient = new QueryClient({
  defaultOptions: {
    // Local data: always fresh after a write (see useCommand), no network retries.
    queries: { staleTime: Infinity, retry: false },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
  });
  const colors = useThemeColors();
  const isDark = useIsDark();
  const navTheme = useNavTheme();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Root window color shows behind the system navigation bar and during transitions.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemeProvider value={navTheme}>
        <SQLiteProvider databaseName="financas.db" onInit={migrate}>
          <QueryClientProvider client={queryClient}>
            <ContainerProvider>
              {/* Inside the data providers: sheet content is portaled here and needs them. */}
              <BottomSheetModalProvider>
                <Bootstrap />
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Routes />
                <PortalHost />
              </BottomSheetModalProvider>
            </ContainerProvider>
          </QueryClientProvider>
        </SQLiteProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function Bootstrap() {
  useAppBootstrap();
  useNotificationSync();
  return null;
}

const modal = { presentation: 'modal', headerShown: false, animation: 'slide_from_bottom' } as const;
const sheet = {
  presentation: 'formSheet',
  headerShown: false,
  sheetAllowedDetents: 'fitToContents',
  sheetCornerRadius: 36,
} as const;

function Routes() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lancamento/novo" options={modal} />
      <Stack.Screen name="lancamento/[id]" options={modal} />
      <Stack.Screen name="conta/[id]" options={modal} />
      <Stack.Screen name="conta/pagar/[id]" options={sheet} />
      <Stack.Screen name="conta/detalhe/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="fatura/[cardId]" options={{ title: 'Fatura' }} />
      <Stack.Screen name="fatura/pagar" options={sheet} />
      <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
      <Stack.Screen name="moto" options={{ headerShown: false }} />
      <Stack.Screen name="modo-corrida" options={{ headerShown: false }} />
      <Stack.Screen name="turno/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="ajustes/conta/[id]" options={modal} />
      <Stack.Screen name="ajustes/categoria/[id]" options={modal} />
      <Stack.Screen name="categorias" options={{ headerShown: false }} />
      <Stack.Screen name="perfil" options={modal} />
      <Stack.Screen name="nota/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
