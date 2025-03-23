import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const activityLevels = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise', icon: 'bed-outline', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', description: '1-3 days/week', icon: 'walk-outline', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', description: '3-5 days/week', icon: 'bicycle-outline', multiplier: 1.55 },
  { id: 'very', label: 'Very Active', description: '6-7 days/week', icon: 'barbell-outline', multiplier: 1.725 },
  { id: 'athlete', label: 'Athlete', description: 'Training 2x/day', icon: 'trophy-outline', multiplier: 1.9 },
] as const;

const goals = [
  { 
    id: 'loss', 
    label: 'Weight Loss', 
    description: 'Caloric deficit', 
    icon: 'trending-down-outline', 
    calories: -500,
    color: '#FF6392'
  },
  { 
    id: 'maintenance', 
    label: 'Maintenance', 
    description: 'Stay current', 
    icon: 'fitness-outline', 
    calories: 0,
    color: '#5AA9E6'
  },
  { 
    id: 'gain', 
    label: 'Weight Gain', 
    description: 'Caloric surplus', 
    icon: 'trending-up-outline', 
    calories: 500,
    color: '#7FC8F8'
  },
] as const;

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: 'person-outline' },
  { id: 'activity', label: 'Activity', icon: 'fitness-outline' },
  { id: 'goals', label: 'Goals', icon: 'trophy-outline' },
  { id: 'password', label: 'Password', icon: 'lock-closed-outline' },
] as const;

const ProgressBar = ({ activeTab }: { activeTab: string }) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarContent}>
        {/* Background lines first */}
        <View style={styles.progressLinesContainer}>
          {tabs.map((_, index) => (
            index > 0 && (
              <LinearGradient
                key={`line-${index}`}
                colors={index <= activeIndex ? ['#5AA9E6', '#7FC8F8'] : ['#E2E8F0', '#E2E8F0']}
                style={[
                  styles.progressLine,
                  index <= activeIndex && styles.progressLineActive
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )
          ))}
        </View>

        {/* Circles and labels on top */}
        <View style={styles.stepsContainer}>
          {tabs.map((tab, index) => (
            <View key={tab.id} style={styles.progressStepContainer}>
              <MotiView
                animate={{
                  scale: index === activeIndex ? 1.1 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <LinearGradient
                  colors={index <= activeIndex ? ['#5AA9E6', '#7FC8F8'] : ['#E2E8F0', '#E2E8F0']}
                  style={styles.progressCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[
                    styles.progressNumber,
                    index <= activeIndex && styles.progressNumberActive
                  ]}>
                    {index + 1}
                  </Text>
                </LinearGradient>
              </MotiView>

              <Text style={[
                styles.progressLabel,
                index === activeIndex && styles.progressLabelActive
              ]}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'male',
    height: '',
    currentWeight: '',
    targetWeight: '',
    activityLevel: '',
    goal: '',
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const calculateBMR = () => {
    const weight = parseFloat(formData.currentWeight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    
    console.log('\n=== BMR Calculation ===');
    console.log('Input Values:');
    console.log('Weight:', weight, 'kg');
    console.log('Height:', height, 'cm');
    console.log('Age:', age, 'years');
    console.log('Gender:', formData.gender);

    let bmr;
    if (formData.gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      console.log('\nMale BMR Formula:');
      console.log('88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)');
      console.log(`88.362 + (13.397 × ${weight}) + (4.799 × ${height}) - (5.677 × ${age})`);
      console.log(`88.362 + ${13.397 * weight} + ${4.799 * height} - ${5.677 * age}`);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      console.log('\nFemale BMR Formula:');
      console.log('447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)');
      console.log(`447.593 + (9.247 × ${weight}) + (3.098 × ${height}) - (4.330 × ${age})`);
      console.log(`447.593 + ${9.247 * weight} + ${3.098 * height} - ${4.330 * age}`);
    }

    console.log('\nCalculated BMR:', Math.round(bmr), 'calories/day');
    return bmr;
  };

  const calculateDailyCalories = () => {
    console.log('\n=== Daily Calorie Calculation ===');
    
    const bmr = calculateBMR();
    console.log('\nStep 1: Base BMR =', Math.round(bmr), 'calories/day');

    const activity = activityLevels.find(a => a.id === formData.activityLevel);
    if (!activity) {
      console.log('Error: No activity level selected');
      return 0;
    }
    console.log('\nStep 2: Activity Level Adjustment');
    console.log('Activity Level:', activity.label);
    console.log('Multiplier:', activity.multiplier);
    console.log('BMR × Activity Multiplier =', Math.round(bmr), '×', activity.multiplier, '=', Math.round(bmr * activity.multiplier));

    const goal = goals.find(g => g.id === formData.goal);
    if (!goal) {
      console.log('Error: No goal selected');
      return 0;
    }
    console.log('\nStep 3: Goal Adjustment');
    console.log('Goal:', goal.label);
    console.log('Calorie Adjustment:', goal.calories);

    const totalCalories = Math.round((bmr * activity.multiplier) + goal.calories);
    console.log('\nFinal Calculation:');
    console.log(`(BMR × Activity Multiplier) + Goal Adjustment = (${Math.round(bmr)} × ${activity.multiplier}) + ${goal.calories}`);
    console.log('Total Daily Calories:', totalCalories);
    
    return totalCalories;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleRegistration = async () => {
    if (!formData.email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsRegistering(true);
    try {
      // Register the user with Supabase
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password,
        options: {
          data: {
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            height: parseFloat(formData.height),
            current_weight: parseFloat(formData.currentWeight),
            target_weight: parseFloat(formData.targetWeight),
            activity_level: formData.activityLevel,
            goal: formData.goal,
            daily_calories: calculateDailyCalories(),
          }
        }
      });

      if (signUpError) throw signUpError;

      if (user) {
        // Create a profile record in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            height: parseFloat(formData.height),
            current_weight: parseFloat(formData.currentWeight),
            target_weight: parseFloat(formData.targetWeight),
            activity_level: formData.activityLevel,
            goal: formData.goal,
            daily_calories: calculateDailyCalories(),
          });

        if (profileError) throw profileError;

        Alert.alert(
          'Registration Successful',
          'Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/screens/PermissionsScreen'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your name"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            placeholder="Enter your age"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.inputSuffix}>years</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.gender === 'male' && styles.genderButtonActive,
            ]}
            onPress={() => setFormData({ ...formData, gender: 'male' })}
          >
            <Ionicons 
              name="male" 
              size={24} 
              color={formData.gender === 'male' ? '#ffffff' : '#64748b'} 
            />
            <Text style={[
              styles.genderButtonText,
              formData.gender === 'male' && styles.genderButtonTextActive,
            ]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.gender === 'female' && styles.genderButtonActive,
            ]}
            onPress={() => setFormData({ ...formData, gender: 'female' })}
          >
            <Ionicons 
              name="female" 
              size={24} 
              color={formData.gender === 'female' ? '#ffffff' : '#64748b'} 
            />
            <Text style={[
              styles.genderButtonText,
              formData.gender === 'female' && styles.genderButtonTextActive,
            ]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Height</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.height}
            onChangeText={(text) => setFormData({ ...formData, height: text })}
            placeholder="Enter your height"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.inputSuffix}>cm</Text>
        </View>
      </View>

      <View style={styles.weightContainer}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Current Weight</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={formData.currentWeight}
              onChangeText={(text) => setFormData({ ...formData, currentWeight: text })}
              placeholder="Current"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.inputSuffix}>kg</Text>
          </View>
        </View>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>Target Weight</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={formData.targetWeight}
              onChangeText={(text) => setFormData({ ...formData, targetWeight: text })}
              placeholder="Target"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.inputSuffix}>kg</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderActivity = () => (
    <View style={styles.section}>
      <View style={styles.activityContainer}>
        {activityLevels.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.activityButton,
              formData.activityLevel === activity.id && styles.activityButtonActive,
            ]}
            onPress={() => setFormData({ ...formData, activityLevel: activity.id })}
          >
            <View style={styles.activityContent}>
              <Ionicons 
                name={activity.icon} 
                size={24} 
                color={formData.activityLevel === activity.id ? '#ffffff' : '#64748b'} 
              />
              <View style={styles.activityTextContainer}>
                <Text style={[
                  styles.activityButtonText,
                  formData.activityLevel === activity.id && styles.activityButtonTextActive,
                ]}>{activity.label}</Text>
                <Text style={[
                  styles.activityDescription,
                  formData.activityLevel === activity.id && styles.activityDescriptionActive,
                ]}>{activity.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGoals = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Your Goal</Text>
      <Text style={styles.sectionDescription}>Choose what you want to achieve with your nutrition plan</Text>
      <View style={styles.goalsContainer}>
        {goals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalButton,
              formData.goal === goal.id && styles.goalButtonActive,
              { borderColor: goal.color, borderWidth: formData.goal === goal.id ? 0 : 2 }
            ]}
            onPress={() => setFormData({ ...formData, goal: goal.id })}
          >
            <View style={[
              styles.goalIconContainer,
              { backgroundColor: formData.goal === goal.id ? '#ffffff' : goal.color + '20' }
            ]}>
              <Ionicons 
                name={goal.icon} 
                size={24} 
                color={formData.goal === goal.id ? goal.color : goal.color} 
              />
            </View>
            <View style={styles.goalContent}>
              <Text style={[
                styles.goalButtonText,
                formData.goal === goal.id && styles.goalButtonTextActive,
                { color: formData.goal === goal.id ? '#ffffff' : goal.color }
              ]}>{goal.label}</Text>
              <Text style={[
                styles.goalDescription,
                formData.goal === goal.id && styles.goalDescriptionActive,
              ]}>{goal.description}</Text>
            </View>
            {formData.goal === goal.id && (
              <View style={styles.goalSelectedIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#FFE45E" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.goalInfoContainer}>
        <View style={styles.goalInfoItem}>
          <Ionicons name="information-circle-outline" size={20} color="#5AA9E6" />
          <Text style={styles.goalInfoText}>
            Your daily calorie target will be adjusted based on your goal
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPassword = () => (
    <View style={styles.section}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
        <Text style={styles.helperText}>
          Password must be at least 8 characters long
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );

  const getProgressWidth = () => {
    switch (activeTab) {
      case 'basic':
        return '33%';
      case 'activity':
        return '66%';
      case 'goals':
        return '100%';
      default:
        return '33%';
    }
  };

  const getNextTab = () => {
    switch (activeTab) {
      case 'basic':
        return 'activity';
      case 'activity':
        return 'goals';
      case 'goals':
        return 'password';
      case 'password':
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F9F9F9', '#F0F9FF']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#5AA9E6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ProgressBar activeTab={activeTab} />

        <KeyboardAvoidingView 
          style={styles.formContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View>
                {activeTab === 'basic' && renderBasicInfo()}
                {activeTab === 'activity' && renderActivity()}
                {activeTab === 'goals' && renderGoals()}
                {activeTab === 'password' && renderPassword()}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          {getNextTab() ? (
            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={() => setActiveTab(getNextTab())}
            >
              <LinearGradient
                colors={['#5AA9E6', '#7FC8F8']}
                style={styles.calculateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.calculateButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={handleRegistration}
              disabled={isRegistering}
            >
              <LinearGradient
                colors={['#5AA9E6', '#7FC8F8']}
                style={styles.calculateButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.calculateButtonText}>
                  {isRegistering ? 'Creating Account...' : 'Create Account'}
                </Text>
                <Ionicons 
                  name={isRegistering ? 'hourglass-outline' : 'checkmark'} 
                  size={20} 
                  color="#ffffff" 
                  style={styles.buttonIcon} 
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
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
  formContainer: {
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
    color: '#333333',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  progressBarContent: {
    position: 'relative',
    height: 80,
  },
  progressLinesContainer: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  progressLine: {
    height: 3,
    width: '100%',
    flex: 1,
    marginHorizontal: -1,
  },
  progressLineActive: {
    opacity: 1,
  },
  stepsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  progressStepContainer: {
    alignItems: 'center',
    width: 80,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#5AA9E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  progressNumber: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#94A3B8',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#94A3B8',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#5AA9E6',
    fontFamily: 'Outfit_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#333333',
  },
  inputSuffix: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#94a3b8',
    marginLeft: 8,
  },
  weightContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  genderButtonActive: {
    backgroundColor: '#5AA9E6',
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748b',
  },
  genderButtonTextActive: {
    color: '#ffffff',
  },
  activityContainer: {
    gap: 12,
  },
  activityButton: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  activityButtonActive: {
    backgroundColor: '#5AA9E6',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#64748b',
    marginBottom: 4,
  },
  activityButtonTextActive: {
    color: '#ffffff',
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#94a3b8',
  },
  activityDescriptionActive: {
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
    marginBottom: 24,
  },
  goalsContainer: {
    gap: 16,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  goalButtonActive: {
    backgroundColor: '#5AA9E6',
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalContent: {
    flex: 1,
  },
  goalButtonText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  goalButtonTextActive: {
    color: '#ffffff',
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
  },
  goalDescriptionActive: {
    color: '#ffffff',
  },
  goalSelectedIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#5AA9E6',
  },
  goalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
  },
  calculateButton: {
    marginVertical: 30,
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
  calculateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    marginTop: 4,
    marginLeft: 4,
  },
}); 