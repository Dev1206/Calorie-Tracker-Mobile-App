import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { supabase, foodLoggingApi } from '../../lib/supabase';
import { useTheme } from '../../lib/theme/ThemeContext';
import { useNetwork } from '../../lib/context/NetworkContext';
import { FoodData } from '../../lib/types/food';

// Define nutrition facts indices
export const NUTRITION_FACTS_INDICES = {
  CALORIES: 0,
  CHOLESTEROL: 1,
  SODIUM: 2,
  POTASSIUM: 3,
  TOTAL_CARBS: 4,
  FIBER: 5,
  SUGAR: 6,
  ADDED_SUGARS: 7,
  SUGAR_ALCOHOLS: 8,
  PROTEIN: 9,
  VITAMIN_A: 10,
  VITAMIN_C: 11,
  CALCIUM: 12,
  IRON: 13,
  VITAMIN_D: 14,
} as const;

interface NutritionFact {
  label: string;
  unit: string;
  value: string;
  isRequired?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  suggestions?: string[];
  error?: string;
  min?: number;
  max?: number;
}

const { width } = Dimensions.get('window');

const validateNumber = (value: string, min = 0, max?: number): boolean => {
  const num = parseFloat(value);
  if (isNaN(num) || num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

const ManualEntryScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [servingsPerContainer, setServingsPerContainer] = useState('1');
  const [expandedSection, setExpandedSection] = useState<'basic' | 'nutrition'>('basic');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const servingSizeSuggestions = [
    '1 cup (240ml)',
    '1 tbsp (15ml)',
    '1 tsp (5ml)',
    '100g',
    '1 piece',
    '1 serving',
  ];

  const [nutritionFacts, setNutritionFacts] = useState<NutritionFact[]>([
    { 
      label: 'Calories', 
      unit: 'kcal', 
      value: '', 
      isRequired: true, 
      icon: 'flame-outline',
      suggestions: ['100', '200', '300', '400']
    },
    { 
      label: 'Cholesterol', 
      unit: 'mg', 
      value: '', 
      icon: 'water-outline',
      suggestions: ['0', '5', '10', '15']
    },
    { 
      label: 'Sodium', 
      unit: 'mg', 
      value: '', 
      icon: 'analytics-outline',
      suggestions: ['0', '50', '100', '200']
    },
    { 
      label: 'Potassium', 
      unit: 'mg', 
      value: '', 
      icon: 'leaf-outline',
      suggestions: ['0', '100', '200', '300']
    },
    { 
      label: 'Total Carbohydrates', 
      unit: 'g', 
      value: '', 
      icon: 'nutrition-outline',
      suggestions: ['0', '15', '30', '45']
    },
    { 
      label: 'Dietary Fiber', 
      unit: 'g', 
      value: '', 
      icon: 'leaf-outline',
      suggestions: ['0', '2', '4', '6']
    },
    { 
      label: 'Sugars', 
      unit: 'g', 
      value: '', 
      icon: 'cafe-outline',
      suggestions: ['0', '5', '10', '15']
    },
    { 
      label: 'Added Sugars', 
      unit: 'g', 
      value: '', 
      icon: 'add-circle-outline',
      suggestions: ['0', '5', '10', '15']
    },
    { 
      label: 'Sugar Alcohols', 
      unit: 'g', 
      value: '', 
      icon: 'wine-outline',
      suggestions: ['0', '2', '4', '6']
    },
    { 
      label: 'Protein', 
      unit: 'g', 
      value: '', 
      icon: 'barbell-outline',
      suggestions: ['0', '5', '10', '20']
    },
    { 
      label: 'Vitamin A', 
      unit: '%', 
      value: '', 
      icon: 'sunny-outline',
      suggestions: ['0', '25', '50', '100']
    },
    { 
      label: 'Vitamin C', 
      unit: '%', 
      value: '', 
      icon: 'medical-outline',
      suggestions: ['0', '25', '50', '100']
    },
    { 
      label: 'Calcium', 
      unit: '%', 
      value: '', 
      icon: 'fitness-outline',
      suggestions: ['0', '25', '50', '100']
    },
    { 
      label: 'Iron', 
      unit: '%', 
      value: '', 
      icon: 'shield-outline',
      suggestions: ['0', '25', '50', '100']
    },
    { 
      label: 'Vitamin D', 
      unit: '%', 
      value: '', 
      icon: 'sunny-outline',
      suggestions: ['0', '25', '50', '100']
    },
  ]);

  const handleNutritionChange = (index: number, value: string) => {
    const newNutritionFacts = [...nutritionFacts];
    newNutritionFacts[index].value = value;
    // Clear any previous error
    newNutritionFacts[index].error = undefined;
    setNutritionFacts(newNutritionFacts);
  };

  const isFormValid = () => {
    return description.trim() !== '' && servingSize.trim() !== '' && validateNumber(servingsPerContainer, 1, 1000);
  };

  const validateRequiredFields = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Food name is required');
      return false;
    }

    if (!servingSize.trim()) {
      Alert.alert('Error', 'Serving size is required');
      return false;
    }

    const servingsNum = parseFloat(servingsPerContainer);
    if (!servingsPerContainer.trim() || !validateNumber(servingsPerContainer, 1, 1000)) {
      Alert.alert('Error', 'Servings per container must be between 1 and 1000');
      return false;
    }

    const newNutritionFacts = [...nutritionFacts];
    let hasError = false;

    nutritionFacts.forEach((fact, index) => {
      if (fact.isRequired && !fact.value.trim()) {
        newNutritionFacts[index].error = 'This field is required';
        hasError = true;
      } else if (fact.value.trim()) {
        const min = fact.min ?? 0;
        const max = fact.max;
        if (!validateNumber(fact.value, min, max)) {
          newNutritionFacts[index].error = max 
            ? `Must be between ${min} and ${max}`
            : `Must be at least ${min}`;
          hasError = true;
        }
      }
    });

    if (hasError) {
      setNutritionFacts(newNutritionFacts);
      Alert.alert('Error', 'Please correct the errors in the nutrition facts');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setHasAttemptedSave(true);
    if (!validateRequiredFields()) {
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const foodData: FoodData = {
        name: description,
        brand: brandName || undefined,
        servingSize: servingSize,
        nutrients: {
          calories: parseInt(nutritionFacts[NUTRITION_FACTS_INDICES.CALORIES].value) || 0,
          protein: parseFloat(nutritionFacts[NUTRITION_FACTS_INDICES.PROTEIN].value) || 0,
          carbs: parseFloat(nutritionFacts[NUTRITION_FACTS_INDICES.TOTAL_CARBS].value) || 0,
          fat: 0, // Add fat input if needed
          fiber: parseFloat(nutritionFacts[NUTRITION_FACTS_INDICES.FIBER].value) || 0,
          sugar: parseFloat(nutritionFacts[NUTRITION_FACTS_INDICES.SUGAR].value) || 0,
        },
      };

      // First, save as a custom food
      const customFood = await foodLoggingApi.addCustomFood({
        user_id: user.id,
        food_name: foodData.name,
        brand_name: foodData.brand,
        serving_size: foodData.servingSize,
        servings_per_container: parseInt(servingsPerContainer),
        calories: foodData.nutrients.calories,
        protein: foodData.nutrients.protein,
        carbs: foodData.nutrients.carbs,
        fat: foodData.nutrients.fat,
        fiber: foodData.nutrients.fiber,
        sugar: foodData.nutrients.sugar,
      });

      // Navigate to FoodDetailsScreen with the food data
      router.push({
        pathname: '/screens/FoodDetailsScreen',
        params: {
          foodData: JSON.stringify(foodData),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
        <View style={[styles.header, { 
          backgroundColor: theme.surface,
          borderBottomColor: theme.border 
        }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Create Food</Text>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.surfaceSecondary },
              (!isFormValid() || isLoading) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons 
              name="checkmark" 
              size={24} 
              color={isFormValid() && !isLoading ? theme.primary : theme.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Section Tabs */}
        <View style={[styles.tabContainer, { 
          backgroundColor: theme.surface,
          borderBottomColor: theme.border 
        }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: theme.surfaceSecondary },
              expandedSection === 'basic' && { backgroundColor: theme.primary + '20' }
            ]}
            onPress={() => setExpandedSection('basic')}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color={expandedSection === 'basic' ? theme.primary : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: theme.textSecondary },
              expandedSection === 'basic' && { color: theme.primary }
            ]}>Basic Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: theme.surfaceSecondary },
              expandedSection === 'nutrition' && { backgroundColor: theme.primary + '20' }
            ]}
            onPress={() => setExpandedSection('nutrition')}
          >
            <Ionicons 
              name="nutrition-outline" 
              size={20} 
              color={expandedSection === 'nutrition' ? theme.primary : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: theme.textSecondary },
              expandedSection === 'nutrition' && { color: theme.primary }
            ]}>Nutrition</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AnimatePresence>
            {expandedSection === 'basic' && (
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: 20 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                {/* Basic Information */}
                <View style={styles.section}>
                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="business-outline" size={20} color={theme.textSecondary} />
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Brand Name</Text>
                      <Text style={[styles.optional, { color: theme.textSecondary }]}>(Optional)</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.surface,
                        color: theme.text,
                        shadowColor: theme.primary 
                      }]}
                      value={brandName}
                      onChangeText={setBrandName}
                      placeholder="ex. Campbell's"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="fast-food-outline" size={20} color={theme.textSecondary} />
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
                      <Text style={[styles.required, { color: theme.error }]}>(Required)</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: theme.surface,
                          color: theme.text,
                          shadowColor: theme.primary 
                        },
                        !description && [styles.requiredInput, { borderColor: theme.error + '40' }]
                      ]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="ex. Chicken Soup"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="resize-outline" size={20} color={theme.textSecondary} />
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Serving Size</Text>
                      <Text style={[styles.required, { color: theme.error }]}>(Required)</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: theme.surface,
                          color: theme.text,
                          shadowColor: theme.primary 
                        },
                        !servingSize && [styles.requiredInput, { borderColor: theme.error + '40' }]
                      ]}
                      value={servingSize}
                      onChangeText={setServingSize}
                      placeholder="ex. 1 cup"
                      placeholderTextColor={theme.textSecondary}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && (
                      <View style={[styles.suggestionsContainer, { 
                        backgroundColor: theme.surface,
                        shadowColor: theme.primary 
                      }]}>
                        {servingSizeSuggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={suggestion}
                            style={styles.suggestionItem}
                            onPress={() => {
                              setServingSize(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
                              {suggestion}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="apps-outline" size={20} color={theme.textSecondary} />
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Servings per container</Text>
                      <Text style={[styles.required, { color: theme.error }]}>(Required)</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          backgroundColor: theme.surface,
                          color: theme.text,
                          shadowColor: theme.primary 
                        },
                        !servingsPerContainer && [styles.requiredInput, { borderColor: theme.error + '40' }]
                      ]}
                      value={servingsPerContainer}
                      onChangeText={setServingsPerContainer}
                      placeholder="1"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>
                </View>
              </MotiView>
            )}

            {expandedSection === 'nutrition' && (
              <MotiView
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -20 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                {/* Nutrition Facts */}
                <View style={styles.section}>
                  {nutritionFacts.map((fact, index) => (
                    <MotiView
                      key={fact.label}
                      from={{ opacity: 0, translateY: 10 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ delay: index * 50 }}
                      style={styles.nutritionInputContainer}
                    >
                      <View style={styles.labelContainer}>
                        <Ionicons 
                          name={fact.icon || 'information-circle-outline'} 
                          size={20} 
                          color={theme.textSecondary} 
                        />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>{fact.label}</Text>
                        <Text style={[
                          fact.isRequired ? styles.required : styles.optional,
                          { color: fact.isRequired ? theme.error : theme.textSecondary }
                        ]}>
                          ({fact.isRequired ? 'Required' : 'Optional'})
                        </Text>
                      </View>
                      <View style={styles.nutritionInputWrapper}>
                        <TextInput
                          style={[
                            styles.nutritionInput,
                            { 
                              backgroundColor: theme.surface,
                              color: theme.text,
                              shadowColor: theme.primary 
                            },
                            fact.isRequired && !fact.value && [styles.requiredInput, { borderColor: theme.error + '40' }],
                            fact.error && { borderColor: theme.error }
                          ]}
                          value={fact.value}
                          onChangeText={(value) => handleNutritionChange(index, value)}
                          keyboardType="decimal-pad"
                          placeholder={`Enter ${fact.label.toLowerCase()}`}
                          placeholderTextColor={theme.textSecondary}
                        />
                        {fact.error && (
                          <Text style={[styles.errorText, { color: theme.error }]}>
                            {fact.error}
                          </Text>
                        )}
                        <Text style={[styles.unitText, { color: theme.textSecondary }]}>{fact.unit}</Text>
                      </View>
                      {fact.suggestions && (
                        <View style={styles.quickValues}>
                          {fact.suggestions.map((suggestion) => (
                            <TouchableOpacity
                              key={suggestion}
                              style={[styles.quickValueButton, { backgroundColor: theme.surfaceSecondary }]}
                              onPress={() => handleNutritionChange(index, suggestion)}
                            >
                              <Text style={[styles.quickValueText, { color: theme.textSecondary }]}>
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </MotiView>
                  ))}
                </View>
              </MotiView>
            )}
          </AnimatePresence>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  saveButton: {
    padding: 8,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  nutritionInputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
  required: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 4,
  },
  optional: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 4,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  requiredInput: {
    borderWidth: 1,
  },
  nutritionInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutritionInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  unitText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    width: 40,
  },
  suggestionsContainer: {
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  quickValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  quickValueButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  quickValueText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
});

export default ManualEntryScreen; 