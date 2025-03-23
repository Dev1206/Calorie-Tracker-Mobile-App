import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase, foodLoggingApi, type FoodEntry } from '../lib/supabase';
import { format, subDays, parseISO } from 'date-fns';
import { useTheme } from '../lib/theme/ThemeContext';
import { MealType, MEAL_CONFIG } from '../lib/types/food';

type GroupedEntries = {
  [date: string]: {
    [meal in MealType]?: FoodEntry[];
  };
};

const ENTRIES_PER_PAGE = 7; // Number of days per page

const PastEntriesScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<GroupedEntries>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterDays, setFilterDays] = useState(ENTRIES_PER_PAGE);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEntries = async (reset = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = subDays(new Date(), filterDays).toISOString().split('T')[0];

      const data = await foodLoggingApi.getFoodEntriesInRange(user.id, startDate, endDate);

      // Group entries by date and meal type
      const grouped = data.reduce((acc: GroupedEntries, entry) => {
        if (!acc[entry.date]) {
          acc[entry.date] = {};
        }
        if (!acc[entry.date][entry.meal_type as MealType]) {
          acc[entry.date][entry.meal_type as MealType] = [];
        }
        acc[entry.date][entry.meal_type as MealType]?.push(entry);
        return acc;
      }, {});

      // If we got less entries than requested, there are no more to load
      setHasMore(Object.keys(grouped).length >= ENTRIES_PER_PAGE);
      
      if (reset) {
        setEntries(grouped);
      } else {
        setEntries(prev => ({...prev, ...grouped}));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries(true);
  }, []);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    setFilterDays(prev => prev + ENTRIES_PER_PAGE);
    await loadEntries();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFilterDays(ENTRIES_PER_PAGE);
    await loadEntries(true);
  };

  const handleDelete = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await foodLoggingApi.deleteFoodEntry(entryId);
              await loadEntries(true); // Reload entries after deletion
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getMealIcon = (mealType: MealType) => {
    const meal = MEAL_CONFIG.find(m => m.id === mealType);
    return meal?.icon || 'restaurant-outline';
  };

  const getMealGradient = (mealType: MealType): [string, string] => {
    switch (mealType) {
      case 'breakfast':
        return ['#FFE45E', '#FFED8A'];
      case 'lunch':
        return ['#5AA9E6', '#7FC8F8'];
      case 'dinner':
        return ['#FF6B6B', '#FFB4B4'];
      case 'snacks':
        return ['#A78BFA', '#C4B5FD'];
      default:
        return ['#5AA9E6', '#7FC8F8'];
    }
  };

  const calculateMealTotalCalories = (entries: FoodEntry[]): number => {
    return entries.reduce((total, entry) => total + entry.calories, 0);
  };

  const mealTypes = MEAL_CONFIG.map(meal => meal.id);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Past Entries</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.primary}
              />
            }
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
              
              if (isCloseToBottom && hasMore && !isLoadingMore) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            {Object.entries(entries)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([date, mealEntries], dateIndex) => (
                <MotiView
                  key={date}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: dateIndex * 100 }}
                >
                  <View style={styles.dateSection}>
                    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                      {format(parseISO(date), 'EEEE, MMMM d')}
                    </Text>
                    <Text style={[styles.totalCalories, { color: theme.primary }]}>
                      {Object.values(mealEntries).flat().reduce((total, entry) => total + entry.calories, 0)} calories
                    </Text>
                    
                    {mealTypes.map((mealType) => {
                      const mealEntryList = mealEntries[mealType] || [];
                      if (mealEntryList.length === 0) return null;

                      return (
                        <View key={mealType} style={styles.mealSection}>
                          <View style={styles.mealHeader}>
                            <LinearGradient
                              colors={getMealGradient(mealType as MealType)}
                              style={styles.mealIconContainer}
                            >
                              <Ionicons
                                name={getMealIcon(mealType as MealType)}
                                size={20}
                                color={theme.surface}
                              />
                            </LinearGradient>
                            <Text style={[styles.mealTitle, { color: theme.text }]}>
                              {MEAL_CONFIG.find(m => m.id === mealType)?.label || 'Unknown Meal'}
                            </Text>
                            <Text style={[styles.mealCalories, { color: theme.primary }]}>
                              {calculateMealTotalCalories(mealEntryList)} cal
                            </Text>
                          </View>

                          {mealEntryList.map((entry, entryIndex) => (
                            <MotiView
                              key={entry.id}
                              from={{ opacity: 0, translateX: -20 }}
                              animate={{ opacity: 1, translateX: 0 }}
                              transition={{ delay: entryIndex * 50 }}
                            >
                              <View style={[styles.entryCard, { 
                                backgroundColor: theme.surface,
                                shadowColor: theme.primary 
                              }]}>
                                <View style={styles.entryInfo}>
                                  <View>
                                    <Text style={[styles.foodName, { color: theme.text }]}>
                                      {entry.food_name}
                                    </Text>
                                    {entry.brand_name && (
                                      <Text style={[styles.brandName, { color: theme.textSecondary }]}>
                                        {entry.brand_name}
                                      </Text>
                                    )}
                                    <Text style={[styles.servingSize, { color: theme.textSecondary }]}>
                                      {entry.serving_size}
                                    </Text>
                                  </View>
                                  <View style={styles.nutrientInfo}>
                                    <Text style={[styles.calories, { color: theme.primary }]}>
                                      {entry.calories}
                                      <Text style={[styles.macros, { color: theme.textSecondary }]}> cal</Text>
                                    </Text>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  style={styles.deleteButton}
                                  onPress={() => handleDelete(entry.id)}
                                >
                                  <Ionicons name="trash-outline" size={20} color={theme.error} />
                                </TouchableOpacity>
                              </View>
                            </MotiView>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                </MotiView>
              ))}

            {isLoadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingMoreText, { color: theme.textSecondary }]}>
                  Loading more entries...
                </Text>
              </View>
            )}
          </ScrollView>
        )}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    padding:8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  totalCalories: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  mealCalories: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  entryInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  servingSize: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  nutrientInfo: {
    alignItems: 'flex-end',
  },
  calories: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  macros: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});

export default PastEntriesScreen; 