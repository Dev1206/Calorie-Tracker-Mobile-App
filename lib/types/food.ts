export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface FoodData {
  name: string;
  brand?: string;
  servingSize: string;
  servingsPerContainer?: number;
  nutrients: Nutrients;
}

export interface FoodEntry extends FoodData {
  id: string;
  user_id: string;
  meal_type: MealType;
  date: string;
  created_at: string;
}

export interface CustomFood extends Omit<FoodData, 'nutrients'> {
  id: string;
  user_id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  created_at: string;
}

export const NUTRITION_FACTS_INDICES = {
  CALORIES: 0,
  TOTAL_FAT: 3,
  TOTAL_CARBS: 4,
  FIBER: 5,
  SUGAR: 6,
  PROTEIN: 9,
} as const;

export const MEAL_CONFIG = [
  { id: 'breakfast' as MealType, label: 'Breakfast', icon: 'sunny-outline' },
  { id: 'lunch' as MealType, label: 'Lunch', icon: 'restaurant-outline' },
  { id: 'dinner' as MealType, label: 'Dinner', icon: 'moon-outline' },
  { id: 'snacks' as MealType, label: 'Snacks', icon: 'cafe-outline' },
] as const; 