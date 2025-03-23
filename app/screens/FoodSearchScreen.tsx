import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '../../lib/theme/ThemeContext';
import { useNetwork } from '../../lib/context/NetworkContext';
import { foodDataApi, USDAFoodItem } from '../../lib/services/foodDataApi';
import debounce from 'lodash/debounce';

const FoodSearchScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<USDAFoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const foods = await foodDataApi.searchFoods(query);
      setResults(foods);
    } catch (err) {
      setError('Failed to search foods. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce the search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => searchFoods(query), 500),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleSelectFood = async (food: USDAFoodItem) => {
    try {
      setIsLoading(true);
      const foodDetails = await foodDataApi.getFoodDetails(food.fdcId);
      const foodData = foodDataApi.convertToFoodData(foodDetails);
      
      router.push({
        pathname: '/screens/FoodDetailsScreen',
        params: { foodData: JSON.stringify(foodData) }
      });
    } catch (err) {
      setError('Failed to get food details. Please try again.');
      console.error('Food details error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFoodItem = ({ item }: { item: USDAFoodItem }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <TouchableOpacity
        style={[styles.foodItem, { 
          backgroundColor: theme.surface,
          shadowColor: theme.primary 
        }]}
        onPress={() => handleSelectFood(item)}
      >
        <View style={styles.foodIconContainer}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            style={styles.foodIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="restaurant" size={24} color={theme.surface} />
          </LinearGradient>
        </View>
        <View style={styles.foodInfo}>
          <Text 
            style={[styles.foodName, { color: theme.text }]} 
            numberOfLines={2}
          >
            {item.description}
          </Text>
          {item.brandName && (
            <View style={styles.brandContainer}>
              <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
              <Text 
                style={[styles.brandName, { color: theme.textSecondary }]} 
                numberOfLines={1}
              >
                {item.brandName}
              </Text>
            </View>
          )}
          {item.foodNutrients?.length > 0 && (
            <View style={styles.nutrientsPreview}>
              {item.foodNutrients.find(n => 
                n.nutrient?.name?.toLowerCase().includes('energy')
              ) && (
                <View style={styles.nutrientBadge}>
                  <Text style={[styles.nutrientValue, { color: theme.primary }]}>
                    {item.foodNutrients.find(n => 
                      n.nutrient?.name?.toLowerCase().includes('energy')
                    )?.amount || 0}
                  </Text>
                  <Text style={[styles.nutrientLabel, { color: theme.textSecondary }]}>
                    kcal
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={theme.textSecondary}
            style={styles.chevron} 
          />
        </View>
      </TouchableOpacity>
    </MotiView>
  );

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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Search Food</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <View style={[styles.searchContainer, { 
              backgroundColor: theme.surface,
              shadowColor: theme.primary 
            }]}>
              <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search for a food..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setResults([]);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </MotiView>

          {error && (
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderFoodItem}
              keyExtractor={(item) => item.fdcId.toString()}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                {searchQuery 
                  ? 'No foods found. Try a different search.'
                  : 'Start typing to search for foods...'}
              </Text>
            </View>
          )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  resultsList: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  foodIconContainer: {
    marginRight: 12,
  },
  foodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: {
    flex: 1,
    marginRight: 8,
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
    lineHeight: 20,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginLeft: 4,
  },
  nutrientsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  nutrientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 169, 230, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nutrientValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginRight: 2,
  },
  nutrientLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  chevron: {
    opacity: 0.5,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});

export default FoodSearchScreen; 