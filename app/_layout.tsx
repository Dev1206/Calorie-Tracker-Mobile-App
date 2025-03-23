import { Stack, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import BottomNavBar from './components/BottomNavBar';
import { ThemeProvider } from '../lib/theme/ThemeContext';
import { useEffect } from 'react';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { NetworkProvider } from '../lib/context/NetworkContext';
import { ErrorBoundary } from '../lib/components/ErrorBoundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Keys for offline storage
const OFFLINE_STORAGE_KEYS = {
  FOOD_ENTRIES: '@offline_food_entries',
  CUSTOM_FOODS: '@offline_custom_foods',
  WEIGHT_ENTRIES: '@offline_weight_entries',
};

// Initialize offline storage
const initializeOfflineStorage = async () => {
  try {
    // Create empty arrays for offline data if they don't exist
    const keys = Object.values(OFFLINE_STORAGE_KEYS);
    const existingData = await AsyncStorage.multiGet(keys);
    
    const initPromises = existingData.map(([key, value]) => {
      if (!value) {
        return AsyncStorage.setItem(key, JSON.stringify([]));
      }
      return Promise.resolve();
    });

    await Promise.all(initPromises);
  } catch (error) {
    console.error('Error initializing offline storage:', error);
  }
};

// Sync offline data with server when connection is restored
export const syncOfflineData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Sync food entries
    const offlineEntries = JSON.parse(
      await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.FOOD_ENTRIES) || '[]'
    );
    
    if (offlineEntries.length > 0) {
      for (const entry of offlineEntries) {
        await supabase.from('food_entries').insert(entry);
      }
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify([]));
    }

    // Sync custom foods
    const offlineFoods = JSON.parse(
      await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.CUSTOM_FOODS) || '[]'
    );
    
    if (offlineFoods.length > 0) {
      for (const food of offlineFoods) {
        await supabase.from('custom_foods').insert(food);
      }
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify([]));
    }

    // Sync weight entries
    const offlineWeightEntries = JSON.parse(
      await AsyncStorage.getItem(OFFLINE_STORAGE_KEYS.WEIGHT_ENTRIES) || '[]'
    );
    
    if (offlineWeightEntries.length > 0) {
      for (const entry of offlineWeightEntries) {
        await supabase.from('weight_entries').insert(entry);
      }
      await AsyncStorage.setItem(OFFLINE_STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
  });
  const pathname = usePathname();

  useEffect(() => {
    initializeOfflineStorage();
  }, []);

  // Determine current route for bottom nav
  const getCurrentRoute = () => {
    switch (pathname) {
      case '/screens/HomeScreen':
      case '/HomeScreen':
        return 'dashboard';
      case '/screens/WaterIntakeScreen':
      case '/WaterIntakeScreen':
        return 'water';
      case '/screens/FoodLoggingScreen':
      case '/FoodLoggingScreen':
        return 'food';
      case '/screens/PastEntriesScreen':
      case '/PastEntriesScreen':
        return 'history';
      case '/screens/ProfileScreen':
      case '/ProfileScreen':
        return 'profile';
      default:
        return 'dashboard';
    }
  };

  // Don't show bottom nav on these screens
  const hideBottomNav = [
    '/',
    '/screens/ProfileSetupScreen',
    '/ProfileSetupScreen',
    '/screens/PermissionsScreen',
    '/PermissionsScreen',
    '/screens/FoodSearchScreen',
    '/FoodSearchScreen',
    '/screens/BarcodeScannerScreen',
    '/BarcodeScannerScreen',
    '/screens/ManualEntryScreen',
    '/ManualEntryScreen',
    '/screens/FoodDetailsScreen',
    '/FoodDetailsScreen',
    '/screens/WeightTrackingScreen',
    '/WeightTrackingScreen',
    '/screens/SignInScreen',
    '/SignInScreen',
    '/screens/ProfileEditScreen',
    '/ProfileEditScreen',
  ].includes(pathname);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <NetworkProvider>
          <ErrorBoundary>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="HomeScreen" />
              <Stack.Screen name="WaterIntakeScreen" />
              <Stack.Screen name="FoodLoggingScreen" />
              <Stack.Screen name="PastEntriesScreen" />
              <Stack.Screen name="ProfileScreen" />
              <Stack.Screen name="screens/ProfileSetupScreen" />
              <Stack.Screen name="screens/PermissionsScreen" options={{ gestureEnabled: false }} />
              <Stack.Screen name="screens/WeightTrackingScreen" />
              <Stack.Screen name="screens/FoodSearchScreen" />
              <Stack.Screen name="screens/BarcodeScannerScreen" />
              <Stack.Screen name="screens/ManualEntryScreen" />
              <Stack.Screen name="screens/FoodDetailsScreen" />
              <Stack.Screen name="screens/SignInScreen" />
              <Stack.Screen name="screens/ProfileEditScreen" />
            </Stack>
            {!hideBottomNav && <BottomNavBar currentRoute={getCurrentRoute()} />}
          </ErrorBoundary>
        </NetworkProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
