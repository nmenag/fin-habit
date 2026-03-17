import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { registerTranslation, en, es } from 'react-native-paper-dates';

import { initDb } from '../src/db/schema';
import { useStore } from '../src/store/useStore';
import { darkTheme, lightTheme } from '../src/theme/theme';
import { interstitialManager } from '../src/ads/InterstitialManager';

// Register locales for the date picker
registerTranslation('en', en);
registerTranslation('es', es);

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...LightTheme,
  ...lightTheme,
  colors: {
    ...LightTheme.colors,
    ...lightTheme.colors,
  },
  fonts: lightTheme.fonts,
};

const CombinedDarkTheme = {
  ...DarkTheme,
  ...darkTheme,
  colors: {
    ...DarkTheme.colors,
    ...darkTheme.colors,
  },
  fonts: darkTheme.fonts,
};

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadData, isLoaded } = useStore();
  const colorScheme = useColorScheme();

  const isDarkTheme = colorScheme === 'dark';
  const theme = isDarkTheme ? CombinedDarkTheme : CombinedDefaultTheme;

  useEffect(() => {
    const setup = async () => {
      try {
        await mobileAds().initialize();
        interstitialManager.init();
        initDb();
        setDbInitialized(true);
      } catch (e) {
        console.error('Failed to initialize local DB or Ads', e);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    if (dbInitialized && !isLoaded) {
      loadData();
    }
  }, [dbInitialized, isLoaded, loadData]);

  if (!dbInitialized || !isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Add Transaction',
          }}
        />
        <Stack.Screen
          name="add-account"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Add Account',
          }}
        />
        <Stack.Screen
          name="add-category"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Add Category',
          }}
        />
        <Stack.Screen
          name="add-budget"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Add Budget',
          }}
        />
        <Stack.Screen
          name="add-goal"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Add Goal',
          }}
        />
        <Stack.Screen
          name="accounts"
          options={{
            headerShown: true,
            title: 'Accounts',
          }}
        />
        <Stack.Screen
          name="categories"
          options={{
            headerShown: true,
            title: 'Categories',
          }}
        />
        <Stack.Screen
          name="budgets"
          options={{
            headerShown: true,
            title: 'Budgets',
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            headerShown: true,
            title: 'Goals',
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            headerShown: true,
            title: 'Calendar',
          }}
        />
        <Stack.Screen
          name="goal-detail"
          options={{
            headerShown: true,
            title: 'Goal Details',
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
