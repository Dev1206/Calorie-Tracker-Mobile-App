import { FoodData } from '../types/food';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FoodApiError extends Error {
  statusCode?: number;
  
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'FoodApiError';
    this.statusCode = statusCode;
  }
}

const API_KEY = 'ELfCsnqLCLKFjACMWMKOoUcLTieLb33ZN1S1Sz6h';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const CACHE_KEYS = {
  SEARCH: '@food_search_',
  DETAILS: '@food_details_',
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export interface USDAFoodItem {
  fdcId: number;
  description: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodPortions?: Array<{
    gramWeight: number;
    portionDescription: string;
  }>;
  foodNutrients: {
    type: string;
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }[];
}

export const foodDataApi = {
  // Cache helpers
  getCachedData: async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  },

  setCachedData: async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  },

  searchFoods: async (query: string): Promise<USDAFoodItem[]> => {
    if (!query.trim()) {
      return [];
    }

    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.SEARCH + query.toLowerCase();
      const cached = await foodDataApi.getCachedData(cacheKey);
      if (cached) {
        console.log('🎯 Returning cached search results for:', query);
        return cached;
      }

      console.log('🔍 Searching foods with query:', query);
      const response = await fetch(`${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Search API error:', response.status, response.statusText);
        throw new FoodApiError('Failed to fetch food data', response.status);
      }

      const data = await response.json();
      console.log('📦 Search response data:', JSON.stringify(data, null, 2));
      
      if (!data.foods) {
        console.warn('⚠️ No foods found in response');
        return [];
      }

      // Cache the results
      await foodDataApi.setCachedData(cacheKey, data.foods);
      return data.foods;
    } catch (error) {
      console.error('❌ Search error:', error);
      if (error instanceof FoodApiError) {
        throw error;
      }
      throw new FoodApiError('Failed to search foods');
    }
  },

  getFoodDetails: async (fdcId: number): Promise<USDAFoodItem> => {
    if (!fdcId) {
      console.error('❌ No fdcId provided');
      throw new FoodApiError('Food ID is required');
    }

    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.DETAILS + fdcId;
      const cached = await foodDataApi.getCachedData(cacheKey);
      if (cached) {
        console.log('🎯 Returning cached food details for ID:', fdcId);
        return cached;
      }

      console.log('🔍 Fetching food details for ID:', fdcId);
      const response = await fetch(`${BASE_URL}/food/${fdcId}?api_key=${API_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('❌ Details API error:', response.status, response.statusText);
        throw new FoodApiError('Failed to fetch food details', response.status);
      }

      const data = await response.json();
      console.log('📦 Food details response:', JSON.stringify(data, null, 2));

      if (!data.fdcId) {
        console.error('❌ Invalid food data received:', data);
        throw new FoodApiError('Invalid food data received');
      }

      // Cache the results
      await foodDataApi.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('❌ Get food details error:', error);
      if (error instanceof FoodApiError) {
        throw error;
      }
      throw new FoodApiError('Failed to get food details');
    }
  },

  // Helper function to convert USDA food item to our app's FoodData format
  convertToFoodData: (usdaFood: USDAFoodItem): FoodData => {
    console.log('🔄 Converting USDA food data:', {
      description: usdaFood.description,
      brandName: usdaFood.brandName,
      servingSize: usdaFood.servingSize,
      servingSizeUnit: usdaFood.servingSizeUnit,
      nutrientCount: usdaFood.foodNutrients?.length
    });

    const getNutrientValue = (targetNutrients: string[]): number => {
      console.log(`\n🔍 Looking for nutrients:`, targetNutrients);
      
      for (const targetNutrient of targetNutrients) {
        const nutrient = usdaFood.foodNutrients.find(n => 
          n.nutrient?.name && n.nutrient.name.toLowerCase().includes(targetNutrient.toLowerCase())
        );
        
        if (nutrient?.amount !== undefined) {
          console.log(`✅ Found ${targetNutrient}:`, {
            name: nutrient.nutrient.name,
            value: nutrient.amount,
            unit: nutrient.nutrient.unitName
          });
          return nutrient.amount;
        }
      }
      
      console.warn(`⚠️ No matching nutrient found for:`, targetNutrients);
      return 0;
    };

    // Get the default serving size from portions if available
    const defaultPortion = usdaFood['foodPortions']?.[0];
    const servingSize = defaultPortion
      ? `${defaultPortion.gramWeight}g (${defaultPortion.portionDescription})`
      : '100g';

    const foodData = {
      name: usdaFood.description,
      brand: usdaFood.brandName,
      servingSize,
      nutrients: {
        calories: getNutrientValue(['Energy', 'energy', 'calories', 'kcal']),
        protein: getNutrientValue(['Protein']),
        carbs: getNutrientValue(['Carbohydrate', 'carbohydrates', 'Carbohydrate, by difference']),
        fat: getNutrientValue(['Total lipid (fat)', 'fat', 'total fat']),
        fiber: getNutrientValue(['Fiber', 'dietary fiber', 'Fiber, total dietary']),
        sugar: getNutrientValue(['Sugars', 'Total Sugars', 'sugar']),
      },
    };

    console.log('✨ Converted food data:', JSON.stringify(foodData, null, 2));
    return foodData;
  },
}; 