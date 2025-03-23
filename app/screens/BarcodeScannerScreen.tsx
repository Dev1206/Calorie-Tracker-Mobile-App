import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { MotiView } from 'moti';
import { useTheme } from '../../lib/theme/ThemeContext';
import { useNetwork } from '../../lib/context/NetworkContext';
import { FoodData } from '../../lib/types/food';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for Open Food Facts API response
interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  nutriments?: {
    'energy-kcal_serving'?: number;
    'energy-kcal_100g'?: number;
    'energy_serving'?: number;
    'energy_100g'?: number;
    'proteins_serving'?: number;
    'proteins_100g'?: number;
    'carbohydrates_serving'?: number;
    'carbohydrates_100g'?: number;
    'fat_serving'?: number;
    'fat_100g'?: number;
    'fiber_serving'?: number;
    'fiber_100g'?: number;
    'sugars_serving'?: number;
    'sugars_100g'?: number;
    [key: string]: number | undefined;
  };
  serving_size?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  product: OpenFoodFactsProduct;
}

const CACHE_KEY_PREFIX = '@barcode_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

const BarcodeScannerScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { isConnected, isOfflineMode } = useNetwork();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const getCachedProduct = async (barcode: string): Promise<FoodData | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${barcode}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_DURATION) {
        await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${barcode}`);
        return null;
      }

      console.log('📦 Retrieved cached product:', barcode);
      return data;
    } catch (error) {
      console.warn('⚠️ Cache read error:', error);
      return null;
    }
  };

  const cacheProduct = async (barcode: string, foodData: FoodData) => {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEY_PREFIX}${barcode}`,
        JSON.stringify({
          data: foodData,
          timestamp: Date.now(),
        })
      );
      console.log('💾 Product cached:', barcode);
    } catch (error) {
      console.warn('⚠️ Cache write error:', error);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (!isScanning) return; // Prevent multiple scans while processing
    setIsScanning(false);
    setIsLoading(true);

    try {
      console.log('\n🎯 Barcode Scan Result:');
      console.log('Type:', type);
      console.log('Data:', data);

      // Check cache first
      const cachedProduct = await getCachedProduct(data);
      if (cachedProduct) {
        console.log('✅ Found cached product:', cachedProduct);
        router.push({
          pathname: '/screens/FoodDetailsScreen',
          params: { foodData: JSON.stringify(cachedProduct) }
        });
        return;
      }

      // Fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result: OpenFoodFactsResponse = await response.json();
      
      if (result.status === 0) {
        throw new Error('Product not found');
      }

      console.log('✅ API Response:', result);
      
      const foodData = convertToFoodData(result.product);
      await cacheProduct(data, foodData);
      
      router.push({
        pathname: '/screens/FoodDetailsScreen',
        params: { foodData: JSON.stringify(foodData) }
      });

    } catch (error: any) {
      console.error('❌ Error:', error);
      
      let errorMessage = 'Failed to fetch product information';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message === 'Product not found') {
        errorMessage = 'Product not found in database. Try manual entry.';
      } else if (!isConnected) {
        errorMessage = 'No internet connection. Check your network settings.';
      }

      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => setIsScanning(true)
          },
          {
            text: 'Manual Entry',
            onPress: () => router.push('/screens/ManualEntryScreen')
          }
        ]
      );
    } finally {
      setIsLoading(false);
      // Re-enable scanning after a short delay to prevent immediate rescans
      setTimeout(() => setIsScanning(true), 2000);
    }
  };

  const convertToFoodData = (product: OpenFoodFactsProduct): FoodData => {
    console.log('🔄 Converting product data with serving size:', product.serving_size);

    const getNutrientValue = (keys: string[]): number => {
      // First try to get serving-specific values
      for (const key of keys) {
        const servingValue = product.nutriments?.[`${key}_serving`];
        if (typeof servingValue === 'number' && !isNaN(servingValue)) {
          console.log(`✅ Found ${key} per serving:`, servingValue);
          return servingValue;
        }
      }

      // If serving-specific values are not available, calculate from 100g values
      const servingSizeMatch = product.serving_size?.match(/(\d+)\s*g/);
      const servingSizeInGrams = servingSizeMatch ? parseFloat(servingSizeMatch[1]) : 100;
      const servingRatio = servingSizeInGrams / 100;

      for (const key of keys) {
        const value100g = product.nutriments?.[`${key}_100g`];
        if (typeof value100g === 'number' && !isNaN(value100g)) {
          const calculatedValue = value100g * servingRatio;
          console.log(`✅ Calculated ${key} for ${servingSizeInGrams}g:`, calculatedValue, `(${value100g} per 100g * ${servingRatio})`);
          return calculatedValue;
        }
      }

      console.warn(`⚠️ No matching nutrient found for:`, keys);
      return 0;
    };

    const servingSize = product.serving_size || '100g';

    const foodData: FoodData = {
      name: product.product_name || 'Unknown Product',
      brand: product.brands,
      servingSize,
      nutrients: {
        calories: getNutrientValue(['energy-kcal', 'energy']),
        protein: getNutrientValue(['proteins']),
        carbs: getNutrientValue(['carbohydrates']),
        fat: getNutrientValue(['fat']),
        fiber: getNutrientValue(['fiber']),
        sugar: getNutrientValue(['sugars']),
      },
    };

    console.log('✨ Converted food data:', JSON.stringify(foodData, null, 2));
    return foodData;
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color={theme.primary} />
            <Text style={[styles.permissionTitle, { color: theme.text }]}>
              Camera Permission Required
            </Text>
            <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
              We need camera access to scan barcodes
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: theme.primary }]}
              onPress={requestPermission}
            >
              <Text style={[styles.permissionButtonText, { color: theme.surface }]}>
                Grant Permission
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a'],
        }}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Barcode</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.scanArea}>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Center the barcode within the frame
            </Text>
            <TouchableOpacity
              style={[styles.manualButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => router.push('/screens/ManualEntryScreen')}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#fff',
    marginBottom: 16,
  },
  manualButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  manualButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default BarcodeScannerScreen; 