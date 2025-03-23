import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme/ThemeContext';
import { useNetwork } from '../../lib/context/NetworkContext';

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  current_weight: number;
  target_weight: number;
  activity_level: string;
  goal: string;
  daily_calories: number;
}

const activityLevels = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise' },
  { id: 'light', label: 'Lightly Active', description: '1-3 days/week' },
  { id: 'moderate', label: 'Moderately Active', description: '3-5 days/week' },
  { id: 'very', label: 'Very Active', description: '6-7 days/week' },
  { id: 'athlete', label: 'Athlete', description: 'Training 2x/day' },
] as const;

const goals = [
  { id: 'maintain', label: 'Maintain Weight' },
  { id: 'lose', label: 'Lose Weight' },
  { id: 'gain', label: 'Gain Weight' },
] as const;

const genders = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
] as const;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 0,
    gender: 'male',
    height: 0,
    current_weight: 0,
    target_weight: 0,
    activity_level: 'moderate',
    goal: 'maintain',
    daily_calories: 2000,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            {/* Basic Information */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                  }]}
                  value={profile.name}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Age</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                  }]}
                  value={profile.age.toString()}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, age: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="Enter your age"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Gender</Text>
                <View style={styles.optionsContainer}>
                  {genders.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.optionButton,
                        { backgroundColor: theme.surfaceSecondary },
                        profile.gender === item.id && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => setProfile(prev => ({ ...prev, gender: item.id }))}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: theme.textSecondary },
                        profile.gender === item.id && { color: '#FFFFFF' }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Body Measurements */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Body Measurements</Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Height (cm)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                  }]}
                  value={profile.height.toString()}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, height: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="Enter your height"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Current Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                  }]}
                  value={profile.current_weight.toString()}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, current_weight: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="Enter your current weight"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Target Weight (kg)</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                  }]}
                  value={profile.target_weight.toString()}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, target_weight: parseFloat(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="Enter your target weight"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            {/* Activity & Goals */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity & Goals</Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Activity Level</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.activityContainer}
                >
                  {activityLevels.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.activityButton,
                        { backgroundColor: theme.surfaceSecondary },
                        profile.activity_level === item.id && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => setProfile(prev => ({ ...prev, activity_level: item.id }))}
                    >
                      <Text style={[
                        styles.activityLabel,
                        { color: theme.text },
                        profile.activity_level === item.id && { color: '#FFFFFF' }
                      ]}>
                        {item.label}
                      </Text>
                      <Text style={[
                        styles.activityDescription,
                        { color: theme.textSecondary },
                        profile.activity_level === item.id && { color: '#E0F2FE' }
                      ]}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Goal</Text>
                <View style={styles.optionsContainer}>
                  {goals.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.optionButton,
                        { backgroundColor: theme.surfaceSecondary },
                        profile.goal === item.id && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => setProfile(prev => ({ ...prev, goal: item.id }))}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: theme.textSecondary },
                        profile.goal === item.id && { color: '#FFFFFF' }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Daily Calorie Goal</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text,
                  }]}
                  value={profile.daily_calories.toString()}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, daily_calories: parseInt(text) || 0 }))}
                  keyboardType="numeric"
                  placeholder="Enter your daily calorie goal"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
          </MotiView>
        </ScrollView>

        <View style={[styles.footer, { 
          backgroundColor: theme.surface,
          borderTopColor: theme.border
        }]}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={theme.gradient.primary}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

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
  section: {
    marginBottom: 24,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  activityContainer: {
    flexGrow: 0,
  },
  activityButton: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
  },
  activityLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: "#5AA9E6",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
}); 