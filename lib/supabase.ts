import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project credentials
const supabaseUrl = 'https://gycsnrhbfosuemnqrwei.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y3NucmhiZm9zdWVtbnFyd2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTg5MDgsImV4cCI6MjA1NjI3NDkwOH0._wZkviuvS0M3_kozEh3PpZema3xWRcsNG4HLEZIWc3U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Food logging related types
export interface FoodEntry {
  id: string;
  user_id: string;
  food_name: string;
  brand_name?: string;
  serving_size: string;
  servings_per_container: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  created_at: string;
  date: string;
}

export interface CustomFood {
  id: string;
  user_id: string;
  food_name: string;
  brand_name?: string;
  serving_size: string;
  servings_per_container: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  created_at: string;
}

// Water tracking related types
export interface WaterEntry {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  created_at: string;
}

// Helper functions for food logging
export const foodLoggingApi = {
  // Add a food entry to the daily log
  addFoodEntry: async (entry: Omit<FoodEntry, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('food_entries')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get food entries for a specific date
  getFoodEntriesByDate: async (userId: string, date: string) => {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Add a custom food to the user's food library
  addCustomFood: async (food: Omit<CustomFood, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('custom_foods')
      .insert(food)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's custom foods
  getCustomFoods: async (userId: string) => {
    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Search custom foods
  searchCustomFoods: async (userId: string, query: string) => {
    const { data, error } = await supabase
      .from('custom_foods')
      .select('*')
      .eq('user_id', userId)
      .ilike('food_name', `%${query}%`)
      .limit(20);

    if (error) throw error;
    return data;
  },

  // Update a food entry
  updateFoodEntry: async (entryId: string, updates: Partial<FoodEntry>) => {
    const { data, error } = await supabase
      .from('food_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a food entry
  deleteFoodEntry: async (entryId: string) => {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  },

  // Get food entries within a date range
  getFoodEntriesInRange: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Helper functions for water tracking
export const waterTrackingApi = {
  // Add a water entry
  addWaterEntry: async (entry: Omit<WaterEntry, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('water_entries')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get water entries for a specific date
  getWaterEntriesByDate: async (userId: string, date: string) => {
    const { data, error } = await supabase
      .from('water_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get total water intake for a specific date
  getTotalWaterIntake: async (userId: string, date: string) => {
    const { data, error } = await supabase
      .from('water_entries')
      .select('amount')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
    return data.reduce((total, entry) => total + entry.amount, 0);
  },

  // Update a water entry
  updateWaterEntry: async (entryId: string, updates: Partial<WaterEntry>) => {
    const { data, error } = await supabase
      .from('water_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a water entry
  deleteWaterEntry: async (entryId: string) => {
    const { error } = await supabase
      .from('water_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  },

  // Get water entries within a date range
  getWaterEntriesInRange: async (userId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('water_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },
}; 