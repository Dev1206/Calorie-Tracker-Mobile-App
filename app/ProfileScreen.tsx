import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../lib/theme/ThemeContext';
import { useNetwork } from '../lib/context/NetworkContext';

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

const STORAGE_KEYS = {
  NOTIFICATIONS: '@settings_notifications',
  DARK_MODE: '@settings_dark_mode',
};

const ProfileScreen = () => {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  // Load saved settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const [notificationsSetting, darkModeSetting] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
      ]);

      setNotifications(notificationsSetting === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive reminders.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Schedule daily reminders
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Don't forget to log your meals!",
            body: "Stay on track with your nutrition goals by logging your food intake.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 60 * 60 * 24, // 24 hours
            repeats: true
          },
        });
      } else {
        // Cancel all scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      setNotifications(value);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, value.toString());
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    // Navigate to profile edit screen
    router.push({
      pathname: '/screens/ProfileEditScreen'
    });
  };

  const getActivityLevelText = (level: string) => {
    switch (level) {
      case 'sedentary':
        return 'Sedentary';
      case 'light':
        return 'Lightly Active';
      case 'moderate':
        return 'Moderately Active';
      case 'very':
        return 'Very Active';
      case 'athlete':
        return 'Athlete';
      default:
        return level;
    }
  };

  const getGoalText = (goal: string) => {
    switch (goal) {
      case 'lose':
        return 'Lose Weight';
      case 'maintain':
        return 'Maintain Weight';
      case 'gain':
        return 'Gain Weight';
      default:
        return goal;
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.surfaceSecondary }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.error} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {profile && (
            <>
              {/* Profile Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
              >
                <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
                  <LinearGradient
                    colors={theme.gradient.primary}
                    style={styles.avatarGradient}
                  >
                    <View style={styles.avatarContent}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {profile.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{profile.name}</Text>
                        <Text style={styles.userGoal}>{getGoalText(profile.goal)}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={handleEditProfile}
                      >
                        <Ionicons name="pencil" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                      <Ionicons name="scale-outline" size={24} color={theme.primary} />
                      <Text style={[styles.statValue, { color: theme.text }]}>{profile.current_weight} kg</Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current Weight</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                      <Ionicons name="flag-outline" size={24} color={theme.primary} />
                      <Text style={[styles.statValue, { color: theme.text }]}>{profile.target_weight} kg</Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Target Weight</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                      <Ionicons name="flame-outline" size={24} color={theme.primary} />
                      <Text style={[styles.statValue, { color: theme.text }]}>{profile.daily_calories}</Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Calories</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                      <Ionicons name="body-outline" size={24} color={theme.primary} />
                      <Text style={[styles.statValue, { color: theme.text }]}>{profile.height} cm</Text>
                      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Height</Text>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Details Section */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
              >
                <View style={[styles.detailsCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>
                  <View style={styles.detailsList}>
                    <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Age</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{profile.age} years</Text>
                      </View>
                    </View>
                    <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="person-outline" size={20} color={theme.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Gender</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{profile.gender}</Text>
                      </View>
                    </View>
                    <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="bicycle-outline" size={20} color={theme.primary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Activity Level</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{getActivityLevelText(profile.activity_level)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Settings Section */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 200 }}
              >
                <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
                  <View style={styles.settingsList}>
                    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, { backgroundColor: theme.surfaceSecondary }]}>
                          <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                        </View>
                        <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
                      </View>
                      <Switch
                        value={notifications}
                        onValueChange={handleNotificationsToggle}
                        trackColor={{ false: theme.border, true: theme.primary + '50' }}
                        thumbColor={notifications ? theme.primary : theme.textSecondary}
                      />
                    </View>
                    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, { backgroundColor: theme.surfaceSecondary }]}>
                          <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={20} color={theme.primary} />
                        </View>
                        <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                      </View>
                      <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: theme.border, true: theme.primary + '50' }}
                        thumbColor={isDark ? theme.primary : theme.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              </MotiView>
            </>
          )}
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
  logoutButton: {
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarGradient: {
    padding: 24,
  },
  avatarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userGoal: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
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
  detailsList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  settingsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen; 