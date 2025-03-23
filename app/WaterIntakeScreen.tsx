import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../lib/theme/ThemeContext';
import { supabase } from '../lib/supabase';

const WaterIntakeScreen = () => {
  const { theme } = useTheme();
  const [waterIntake, setWaterIntake] = useState(0); // in ml
  const [dailyGoal, setDailyGoal] = useState(2000); // in ml
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const percentage = Math.min((waterIntake / dailyGoal) * 100, 100);
  
  const quickAddOptions = [
    { amount: 200, label: 'Small Glass' },
    { amount: 300, label: 'Medium Glass' },
    { amount: 500, label: 'Large Glass' },
    { amount: 750, label: 'Water Bottle' },
  ];

  useEffect(() => {
    loadWaterGoal();
  }, []);

  const loadWaterGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('water_goal')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data && data.water_goal) {
        setDailyGoal(data.water_goal);
      }
    } catch (error) {
      console.error('Error loading water goal:', error);
    }
  };

  const saveWaterGoal = async (newGoal: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ water_goal: newGoal })
        .eq('id', user.id);

      if (error) throw error;
      setDailyGoal(newGoal);
      Alert.alert('Success', 'Water intake goal updated successfully');
    } catch (error) {
      console.error('Error saving water goal:', error);
      Alert.alert('Error', 'Failed to update water intake goal');
    }
  };

  const handleGoalSubmit = () => {
    const newGoal = parseInt(tempGoal);
    if (isNaN(newGoal) || newGoal < 500 || newGoal > 5000) {
      Alert.alert('Invalid Goal', 'Please enter a value between 500ml and 5000ml');
      return;
    }
    saveWaterGoal(newGoal);
    setIsEditingGoal(false);
  };

  const addWater = (amount: number) => {
    setWaterIntake(prev => Math.min(prev + amount, dailyGoal));
  };

  const resetWater = () => {
    setWaterIntake(0);
  };

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.gradient.background}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Water Intake</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={() => setIsEditingGoal(true)}
            >
              <Ionicons name="settings-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={resetWater}
            >
              <Ionicons name="refresh" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Circle */}
          <View style={styles.progressContainer}>
            <Svg width={radius * 2 + 40} height={radius * 2 + 40}>
              {/* Background Circle */}
              <Circle
                cx={radius + 20}
                cy={radius + 20}
                r={radius}
                stroke={theme.border}
                strokeWidth={20}
                fill="none"
              />
              {/* Progress Circle */}
              <Circle
                cx={radius + 20}
                cy={radius + 20}
                r={radius}
                stroke={theme.primary}
                strokeWidth={20}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${radius + 20} ${radius + 20})`}
              />
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressText, { color: theme.text }]}>
                {waterIntake}
                <Text style={[styles.unitText, { color: theme.textSecondary }]}>ml</Text>
              </Text>
              <Text style={[styles.goalText, { color: theme.textSecondary }]}>
                of {dailyGoal}ml goal
              </Text>
              <Text style={[styles.percentageText, { color: theme.primary }]}>
                {Math.round(percentage)}%
              </Text>
            </View>
          </View>

          {/* Quick Add Options */}
          <View style={styles.quickAddContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Add</Text>
            <View style={styles.quickAddGrid}>
              {quickAddOptions.map((option, index) => (
                <MotiView
                  key={option.label}
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 100 }}
                >
                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={() => addWater(option.amount)}
                  >
                    <LinearGradient
                      colors={theme.gradient.primary}
                      style={styles.quickAddGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.quickAddAmount, { color: theme.surface }]}>
                        {option.amount}ml
                      </Text>
                      <Text style={[styles.quickAddLabel, { color: theme.surface }]}>
                        {option.label}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Hydration Tips</Text>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={[styles.tipCard, { 
                backgroundColor: theme.surface,
                shadowColor: theme.primary 
              }]}
            >
              <Ionicons name="water-outline" size={24} color={theme.primary} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.text }]}>Stay Consistent</Text>
                <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                  Try to drink water at regular intervals throughout the day instead of large amounts at once.
                </Text>
              </View>
            </MotiView>
          </View>
        </ScrollView>

        {/* Edit Goal Modal */}
        <Modal
          visible={isEditingGoal}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditingGoal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Set Daily Water Goal</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                }]}
                placeholder="Enter goal in ml (500-5000)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={tempGoal}
                onChangeText={setTempGoal}
              />
              <Text style={[styles.modalHelper, { color: theme.textSecondary }]}>
                Recommended: 2000ml - 3000ml per day
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={() => setIsEditingGoal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleGoalSubmit}
                >
                  <LinearGradient
                    colors={theme.gradient.primary}
                    style={styles.modalButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 48,
    fontFamily: 'Outfit_700Bold',
  },
  unitText: {
    fontSize: 24,
    fontFamily: 'Outfit_400Regular',
  },
  goalText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  percentageText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginTop: 8,
  },
  quickAddContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickAddButton: {
    width: (Platform.OS === 'ios' ? 165 : 150),
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickAddGradient: {
    padding: 16,
    alignItems: 'center',
  },
  quickAddAmount: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  quickAddLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  tipsContainer: {
    marginTop: 32,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 8,
  },
  modalHelper: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    padding: 12,
  },
});

export default WaterIntakeScreen; 