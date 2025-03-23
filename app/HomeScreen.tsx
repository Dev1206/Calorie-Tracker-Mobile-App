import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { MotiView, MotiText } from 'moti';
import { useTheme } from '../lib/theme/ThemeContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const PROGRESS_RING_SIZE = width * 0.45;
const STROKE_WIDTH = 12;
const RADIUS = (PROGRESS_RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type MacroData = {
  value: number;
  target: number;
  label: string;
  gradient: readonly [string, string];
};

type Meal = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  calories: number;
  gradient: readonly [string, string];
  time: string;
};

type Route = 
  | '/FoodLoggingScreen'
  | '/PastEntriesScreen'
  | '/screens/WeightTrackingScreen'
  | '/WaterIntakeScreen';

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: Route;
  gradient: readonly [string, string];
};

interface FoodEntry {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  date: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  daily_calories: number;
}

const HomeScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todaysFoodEntries, setTodaysFoodEntries] = useState<FoodEntry[]>([]);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [macros, setMacros] = useState<Record<string, MacroData>>({
    carbs: {
      value: 0,
      target: 0,
      label: 'Carbs',
      gradient: theme.gradient.primary,
    },
    protein: {
      value: 0,
      target: 0,
      label: 'Protein',
      gradient: ['#FF6B6B', '#FFB4B4'],
    },
    fats: {
      value: 0,
      target: 0,
      label: 'Fats',
      gradient: ['#22C55E', '#86EFAC'],
    },
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load today's food entries
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: entries, error: entriesError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today);

      if (entriesError) throw entriesError;
      setTodaysFoodEntries(entries || []);

      // Calculate total calories and macros
      const totalCalories = entries?.reduce((sum, entry) => sum + entry.calories, 0) || 0;
      setCaloriesConsumed(totalCalories);

      // Calculate macro targets based on daily calories (45% carbs, 30% protein, 25% fats)
      const dailyCalories = profileData.daily_calories;
      const carbsTarget = Math.round((dailyCalories * 0.45) / 4); // 4 calories per gram
      const proteinTarget = Math.round((dailyCalories * 0.30) / 4); // 4 calories per gram
      const fatsTarget = Math.round((dailyCalories * 0.25) / 9); // 9 calories per gram

      // Calculate consumed macros
      const consumedCarbs = entries?.reduce((sum, entry) => sum + entry.carbs, 0) || 0;
      const consumedProtein = entries?.reduce((sum, entry) => sum + entry.protein, 0) || 0;
      const consumedFat = entries?.reduce((sum, entry) => sum + entry.fat, 0) || 0;

      setMacros({
        carbs: {
          value: consumedCarbs,
          target: carbsTarget,
          label: 'Carbs',
          gradient: theme.gradient.primary,
        },
        protein: {
          value: consumedProtein,
          target: proteinTarget,
          label: 'Protein',
          gradient: ['#FF6B6B', '#FFB4B4'],
        },
        fats: {
          value: consumedFat,
          target: fatsTarget,
          label: 'Fats',
          gradient: ['#22C55E', '#86EFAC'],
        },
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getMealEntries = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    return todaysFoodEntries.filter(entry => entry.meal_type === mealType);
  };

  const calculateMealCalories = (entries: FoodEntry[]) => {
    return entries.reduce((sum, entry) => sum + entry.calories, 0);
  };

  const meals: Meal[] = [
    {
      id: 'breakfast',
      title: 'Breakfast',
      icon: 'sunny-outline',
      calories: calculateMealCalories(getMealEntries('breakfast')),
      gradient: ['#FFB4B4', '#FF6B6B'],
      time: '6:00 - 10:00',
    },
    {
      id: 'lunch',
      title: 'Lunch',
      icon: 'restaurant-outline',
      calories: calculateMealCalories(getMealEntries('lunch')),
      gradient: ['#86EFAC', '#22C55E'],
      time: '12:00 - 14:00',
    },
    {
      id: 'dinner',
      title: 'Dinner',
      icon: 'moon-outline',
      calories: calculateMealCalories(getMealEntries('dinner')),
      gradient: ['#7FC8F8', '#5AA9E6'],
      time: '18:00 - 21:00',
    },
    {
      id: 'snacks',
      title: 'Snacks',
      icon: 'cafe-outline',
      calories: calculateMealCalories(getMealEntries('snacks')),
      gradient: ['#FFD572', '#FFA940'],
      time: 'Any time',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: 'scale-outline',
      label: 'Weight',
      route: '/screens/WeightTrackingScreen',
      gradient: ['#22C55E', '#86EFAC'],
    },
  ];

  const renderProgressRing = () => {
    const percentage = profile ? (caloriesConsumed / profile.daily_calories) * 100 : 0;
    const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(percentage, 100)) / 100;

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', delay: 300 }}
        style={styles.progressRingContainer}
      >
        <Svg width={PROGRESS_RING_SIZE} height={PROGRESS_RING_SIZE}>
          <Defs>
            <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.gradient.primary[0]} />
              <Stop offset="1" stopColor={theme.gradient.primary[1]} />
            </SvgGradient>
          </Defs>
          <Circle
            cx={PROGRESS_RING_SIZE / 2}
            cy={PROGRESS_RING_SIZE / 2}
            r={RADIUS}
            stroke={theme.surfaceSecondary}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={PROGRESS_RING_SIZE / 2}
            cy={PROGRESS_RING_SIZE / 2}
            r={RADIUS}
            stroke="url(#grad)"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${PROGRESS_RING_SIZE / 2} ${PROGRESS_RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.progressContent}>
          <MotiText
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', delay: 600 }}
            style={[styles.caloriesConsumed, { color: theme.text }]}
          >
            {caloriesConsumed.toFixed(2)}
          </MotiText>
          <Text style={[styles.caloriesLabel, { color: theme.textSecondary }]}>
            of {(profile?.daily_calories || 0).toFixed(2)} kcal
          </Text>
        </View>
      </MotiView>
    );
  };

  const renderMacroProgress = (type: string, data: MacroData) => (
    <MotiView
      key={type}
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', delay: 400 + Object.keys(macros).indexOf(type) * 100 }}
      style={[styles.macroCard, { backgroundColor: theme.surface }]}
    >
      <LinearGradient
        colors={data.gradient}
        style={styles.macroIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons
          name={
            type === 'carbs'
              ? 'leaf-outline'
              : type === 'protein'
              ? 'fitness-outline'
              : 'flame-outline'
          }
          size={20}
          color="#FFFFFF"
        />
      </LinearGradient>
      <View style={styles.macroInfo}>
        <View style={styles.macroHeader}>
          <Text style={[styles.macroLabel, { color: theme.text }]}>{data.label}</Text>
          <Text style={[styles.macroValue, { color: theme.text }]}>
            {data.value.toFixed(2)}g / {data.target.toFixed(2)}g
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.surfaceSecondary }]}>
          <MotiView
            animate={{
              width: `${Math.min((data.value / data.target) * 100, 100)}%`,
            }}
            transition={{ type: 'timing', duration: 1000 }}
            style={[styles.progressFill, { backgroundColor: data.gradient[0] }]}
          />
        </View>
      </View>
    </MotiView>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
          <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring' }}
            style={styles.header}
          >
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Welcome back,
              </Text>
              <Text style={[styles.userName, { color: theme.text }]}>
                {profile?.name || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => router.push('/ProfileScreen')}
            >
              <Ionicons name="person-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          </MotiView>

          {/* Calories Progress */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Progress</Text>
              <TouchableOpacity
                style={[styles.weightButton, { backgroundColor: theme.surface }]}
                onPress={() => router.push('/screens/WeightTrackingScreen')}
              >
                <LinearGradient
                  colors={['#22C55E', '#86EFAC']}
                  style={styles.weightGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="scale-outline" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.weightButtonText, { color: theme.text }]}>Track Weight</Text>
              </TouchableOpacity>
            </View>
            {renderProgressRing()}
          </View>

          {/* Macros */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Macros</Text>
            <View style={styles.macrosContainer}>
              {Object.entries(macros).map(([type, data]) => renderMacroProgress(type, data))}
            </View>
          </View>

          {/* Meals */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Meals</Text>
            <View style={styles.mealsContainer}>
              {meals.map((meal, index) => (
                <MotiView
                  key={meal.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', delay: index * 100 }}
                >
                  <TouchableOpacity
                    style={[styles.mealCard, { backgroundColor: theme.surface }]}
                    onPress={() => router.push('/FoodLoggingScreen')}
                  >
                    <LinearGradient
                      colors={meal.gradient}
                      style={styles.mealIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={meal.icon} size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.mealInfo}>
                      <View>
                        <Text style={[styles.mealTitle, { color: theme.text }]}>{meal.title}</Text>
                        <Text style={[styles.mealTime, { color: theme.textSecondary }]}>
                          {meal.time}
                        </Text>
                      </View>
                      <Text style={[styles.mealCalories, { color: theme.text }]}>
                        {meal.calories.toFixed(2)} kcal
                      </Text>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          </View>
        </ScrollView>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
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
  greeting: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  caloriesConsumed: {
    fontSize: 32,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  macrosContainer: {
    gap: 12,
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  macroInfo: {
    flex: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  macroValue: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mealInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  mealCalories: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  weightGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  weightButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default HomeScreen; 