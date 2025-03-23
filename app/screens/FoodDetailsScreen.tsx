import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase, foodLoggingApi } from '../../lib/supabase';
import { useTheme } from '../../lib/theme/ThemeContext';
import { useNetwork } from '../../lib/context/NetworkContext';
import { FoodData as FoodDataType, MealType, MEAL_CONFIG } from '../../lib/types/food';

type NutritionInfo = {
  label: string;
  value: number | undefined;
  unit: string;
  color: string;
  key: keyof FoodDataType['nutrients'];
};

const FoodDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [foodData, setFoodData] = useState<FoodDataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FoodDataType | null>(null);
  const [numberOfServings, setNumberOfServings] = useState(1);

  useEffect(() => {
    if (params.foodData) {
      const parsedData = JSON.parse(params.foodData as string) as FoodDataType;
      setFoodData(parsedData);
      setEditedData(parsedData);
    }
  }, [params.foodData]);

  const calculateNutrientValue = (value: number | undefined) => {
    const calculated = ((value || 0) * numberOfServings) || 0;
    return Number(calculated.toFixed(2));
  };

  const nutritionInfo: NutritionInfo[] = [
    { label: 'Calories', value: calculateNutrientValue(foodData?.nutrients.calories), unit: 'kcal', color: theme.primary, key: 'calories' },
    { label: 'Protein', value: calculateNutrientValue(foodData?.nutrients.protein), unit: 'g', color: '#FF6B6B', key: 'protein' },
    { label: 'Carbs', value: calculateNutrientValue(foodData?.nutrients.carbs), unit: 'g', color: '#5AA9E6', key: 'carbs' },
    { label: 'Fat', value: calculateNutrientValue(foodData?.nutrients.fat), unit: 'g', color: '#FFE45E', key: 'fat' },
    { label: 'Fiber', value: calculateNutrientValue(foodData?.nutrients.fiber), unit: 'g', color: '#22C55E', key: 'fiber' },
    { label: 'Sugar', value: calculateNutrientValue(foodData?.nutrients.sugar), unit: 'g', color: '#A78BFA', key: 'sugar' },
  ];

  const handleEdit = () => {
    if (foodData) {
      setEditedData({ ...foodData });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!editedData) return;

    // Validate the data
    if (!editedData.name?.trim()) {
      Alert.alert('Error', 'Food name is required');
      return;
    }

    // Validate nutrients
    const nutrients = editedData.nutrients;
    if (isNaN(nutrients.calories) || nutrients.calories < 0) {
      Alert.alert('Error', 'Calories must be a valid number');
      return;
    }

    setFoodData(editedData);
    setIsEditing(false);

    // Update params to reflect changes
    router.setParams({ foodData: JSON.stringify(editedData) });
  };

  const handleCancel = () => {
    if (foodData) {
      setEditedData({ ...foodData });
    }
    setIsEditing(false);
  };

  const updateNutrient = (key: keyof FoodDataType['nutrients'], value: string) => {
    if (!editedData) return;

    setEditedData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nutrients: {
          ...prev.nutrients,
          [key]: parseFloat(value) || 0
        }
      };
    });
  };

  if (!foodData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
          <View style={[styles.header, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Food Details</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>Food data not available</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Food Details</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={isEditing ? handleSave : handleEdit}
          >
            <Ionicons 
              name={isEditing ? "checkmark" : "create-outline"} 
              size={24} 
              color={theme.primary} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <View style={[styles.foodCard, { 
              backgroundColor: theme.surface,
              shadowColor: theme.primary 
            }]}>
              <View style={styles.foodHeader}>
                {isEditing ? (
                  <TextInput
                    style={[styles.foodName, { color: theme.text }]}
                    value={editedData?.name}
                    onChangeText={(text) => setEditedData(prev => prev ? { ...prev, name: text } : prev)}
                    placeholder="Food Name"
                    placeholderTextColor={theme.textSecondary}
                  />
                ) : (
                  <Text style={[styles.foodName, { color: theme.text }]}>
                    {foodData.name || 'Unknown Food'}
                  </Text>
                )}
                {foodData.brand && (
                  <Text style={[styles.brandName, { color: theme.textSecondary }]}>
                    {foodData.brand}
                  </Text>
                )}
              </View>
              <View style={styles.servingInfo}>
                <View style={styles.servingInputContainer}>
                  <Text style={[styles.servingText, { color: theme.textSecondary }]}>
                    Serving Size: {foodData.servingSize || 'Not specified'}
                  </Text>
                  <View style={styles.servingAmountContainer}>
                    <Text style={[styles.servingText, { color: theme.textSecondary }]}>
                      Number of Servings:
                    </Text>
                    <View style={styles.servingControls}>
                      <TouchableOpacity
                        style={[styles.servingButton, { backgroundColor: theme.surfaceSecondary }]}
                        onPress={() => setNumberOfServings(prev => Math.max(0.5, prev - 0.5))}
                      >
                        <Ionicons name="remove" size={20} color={theme.primary} />
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.servingInput, { 
                          color: theme.text,
                          backgroundColor: theme.surfaceSecondary 
                        }]}
                        value={numberOfServings.toString()}
                        onChangeText={(text) => {
                          const value = parseFloat(text);
                          if (!isNaN(value) && value > 0) {
                            setNumberOfServings(value);
                          }
                        }}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                      />
                      <TouchableOpacity
                        style={[styles.servingButton, { backgroundColor: theme.surfaceSecondary }]}
                        onPress={() => setNumberOfServings(prev => prev + 0.5)}
                      >
                        <Ionicons name="add" size={20} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <Text style={[styles.caloriesText, { color: theme.primary }]}>
                  {calculateNutrientValue(foodData.nutrients.calories).toFixed(2)} calories
                </Text>
              </View>
            </View>

            <View style={[styles.nutritionCard, { 
              backgroundColor: theme.surface,
              shadowColor: theme.primary 
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Nutrition Facts</Text>
              {nutritionInfo.map((item, index) => (
                <MotiView
                  key={item.label}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: index * 50 }}
                  style={styles.nutritionItem}
                >
                  <View style={styles.nutritionLabel}>
                    <View 
                      style={[
                        styles.nutritionDot, 
                        { backgroundColor: item.color }
                      ]} 
                    />
                    {isEditing ? (
                      <TextInput
                        style={[styles.nutritionInput, { color: theme.text }]}
                        value={String(editedData?.nutrients?.[item.key] || '')}
                        onChangeText={(text) => updateNutrient(item.key, text)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                      />
                    ) : (
                      <Text style={[styles.nutritionText, { color: theme.text }]}>{item.label}</Text>
                    )}
                  </View>
                  <Text style={[styles.nutritionValue, { color: theme.textSecondary }]}>
                    {(item.value || 0).toFixed(2)}{item.unit}
                  </Text>
                </MotiView>
              ))}
            </View>

            <View style={[styles.mealSelectionContainer, { 
              backgroundColor: theme.surface,
              shadowColor: theme.primary 
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Meal</Text>
              <View style={styles.mealsGrid}>
                {MEAL_CONFIG.map((meal) => (
                  <TouchableOpacity
                    key={meal.id}
                    style={[
                      styles.mealOption,
                      { backgroundColor: theme.surfaceSecondary },
                      selectedMeal === meal.id && [
                        styles.selectedMealOption,
                        { backgroundColor: theme.primary }
                      ]
                    ]}
                    onPress={() => setSelectedMeal(meal.id)}
                  >
                    <Ionicons
                      name={meal.icon as any}
                      size={24}
                      color={selectedMeal === meal.id ? theme.surface : theme.textSecondary}
                    />
                    <Text style={[
                      styles.mealOptionText,
                      { color: theme.textSecondary },
                      selectedMeal === meal.id && [
                        styles.selectedMealOptionText,
                        { color: theme.surface }
                      ]
                    ]}>
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </MotiView>
        </ScrollView>

        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.error }]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.success }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.footer, { backgroundColor: theme.surface }]}>
          <TouchableOpacity
            style={[
              styles.addButton,
              isLoading && { opacity: 0.7 }
            ]}
            onPress={async () => {
              setIsLoading(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');

                const today = new Date().toISOString().split('T')[0];
                
                await foodLoggingApi.addFoodEntry({
                  user_id: user.id,
                  food_name: foodData.name,
                  brand_name: foodData.brand || undefined,
                  serving_size: foodData.servingSize || '1 serving',
                  servings_per_container: numberOfServings,
                  meal_type: selectedMeal,
                  date: today,
                  calories: calculateNutrientValue(foodData.nutrients.calories),
                  protein: calculateNutrientValue(foodData.nutrients.protein),
                  carbs: calculateNutrientValue(foodData.nutrients.carbs),
                  fat: calculateNutrientValue(foodData.nutrients.fat),
                  fiber: calculateNutrientValue(foodData.nutrients.fiber),
                  sugar: calculateNutrientValue(foodData.nutrients.sugar),
                });

                Alert.alert(
                  'Success',
                  `Added ${foodData.name} to ${MEAL_CONFIG.find(m => m.id === selectedMeal)?.label}`,
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } catch (error: any) {
                Alert.alert('Error', error.message);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <LinearGradient
              colors={theme.gradient.primary}
              style={styles.addGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.addButtonText, { color: theme.surface }]}>
                {isLoading ? 'Adding...' : `Add to ${MEAL_CONFIG.find(m => m.id === selectedMeal)?.label}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  foodCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  foodHeader: {
    marginBottom: 12,
  },
  foodName: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  servingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  caloriesText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  nutritionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  nutritionText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  nutritionValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  nutritionInput: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    padding: 8,
    borderRadius: 8,
    width: 80,
    textAlign: 'right',
  },
  mealSelectionContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  selectedMealOption: {
    borderRadius: 12,
  },
  mealOptionText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginTop: 8,
  },
  selectedMealOptionText: {
    fontFamily: 'Outfit_600SemiBold',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  addButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  addGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  servingInputContainer: {
    flex: 1,
  },
  servingAmountContainer: {
    marginTop: 8,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingInput: {
    width: 60,
    height: 32,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
});

export default FoodDetailsScreen; 