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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme/ThemeContext';
import Svg, { Line, Circle, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

interface WeightEntry {
  id: string;
  user_id: string;
  weight: number;
  date: string;
  note?: string;
}

interface WeightStats {
  currentWeight: number;
  startWeight: number;
  lowestWeight: number;
  highestWeight: number;
  averageWeight: number;
  totalChange: number;
}

interface UserProfile {
  current_weight: number;
  target_weight: number;
}

const { width } = Dimensions.get('window');
const GRAPH_HEIGHT = 200;
const GRAPH_WIDTH = width - 40;
const POINT_RADIUS = 4;

const WeightTrackingScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadWeightEntries();
  }, []);

  const loadWeightEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('current_weight, target_weight')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData as UserProfile);

      // Then fetch weight entries
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
      calculateStats(data || [], profileData.current_weight);
    } catch (error) {
      console.error('Error loading weight entries:', error);
      Alert.alert('Error', 'Failed to load weight entries');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: WeightEntry[], profileCurrentWeight: number) => {
    if (data.length === 0) {
      // If no entries, use profile's current weight for all stats
      setStats({
        currentWeight: profileCurrentWeight,
        startWeight: profileCurrentWeight,
        lowestWeight: profileCurrentWeight,
        highestWeight: profileCurrentWeight,
        averageWeight: profileCurrentWeight,
        totalChange: 0,
      });
      return;
    }

    const weights = data.map(e => e.weight);
    const stats: WeightStats = {
      currentWeight: data[data.length - 1].weight,
      startWeight: profileCurrentWeight,
      lowestWeight: Math.min(...weights),
      highestWeight: Math.max(...weights),
      averageWeight: weights.reduce((a, b) => a + b, 0) / weights.length,
      totalChange: data[data.length - 1].weight - profileCurrentWeight,
    };
    setStats(stats);
  };

  const handleAddEntry = async () => {
    if (!newWeight.trim()) {
      Alert.alert('Error', 'Please enter a weight');
      return;
    }

    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: user.id,
          weight,
          date: new Date().toISOString().split('T')[0],
          note: newNote.trim() || null,
        });

      if (error) throw error;

      setNewWeight('');
      setNewNote('');
      loadWeightEntries();
      Alert.alert('Success', 'Weight entry added successfully');
    } catch (error) {
      console.error('Error adding weight entry:', error);
      Alert.alert('Error', 'Failed to add weight entry');
    }
  };

  const renderGraph = () => {
    if (entries.length === 0) return null;

    const weights = entries.map(e => e.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const range = maxWeight - minWeight;
    const padding = Math.max(range * 0.1, 0.5);

    return (
      <View style={styles.timelineContainer}>
        {/* Start Weight Entry */}
        <View style={styles.timelineEntry}>
          <View style={styles.timelineLeft}>
            <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
            <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
          </View>
          <View style={[styles.timelineCard, { backgroundColor: theme.surfaceSecondary }]}>
            <Text style={[styles.timelineWeight, { color: theme.text }]}>
              {stats?.startWeight.toFixed(1)} kg
            </Text>
            <Text style={[styles.timelineDate, { color: theme.textSecondary }]}>
              Starting Weight
            </Text>
          </View>
        </View>

        {/* Weight Entries */}
        {entries.map((entry, index) => {
          const prevWeight = index === 0 ? stats?.startWeight || entry.weight : entries[index - 1].weight;
          const weightChange = entry.weight - prevWeight;
          const changeColor = weightChange > 0 ? theme.error : weightChange < 0 ? theme.success : theme.textSecondary;

          return (
            <View key={entry.id} style={styles.timelineEntry}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
                {index < entries.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                )}
              </View>
              <View style={[styles.timelineCard, { backgroundColor: theme.surfaceSecondary }]}>
                <View style={styles.timelineHeader}>
                  <Text style={[styles.timelineWeight, { color: theme.text }]}>
                    {entry.weight.toFixed(1)} kg
                  </Text>
                  <Text style={[styles.timelineChange, { color: changeColor }]}>
                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                  </Text>
                </View>
                <Text style={[styles.timelineDate, { color: theme.textSecondary }]}>
                  {new Date(entry.date).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
                {entry.note && (
                  <Text style={[styles.timelineNote, { color: theme.textSecondary }]}>
                    {entry.note}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    const StatItem = ({ label, value, change }: { label: string; value: number; change?: number }) => (
      <View style={[styles.statItem, { backgroundColor: theme.surfaceSecondary }]}>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>{value.toFixed(1)} kg</Text>
        {change !== undefined && (
          <Text style={[
            styles.statChange,
            { color: change > 0 ? theme.error : change < 0 ? theme.success : theme.textSecondary }
          ]}>
            {change > 0 ? '+' : ''}{change.toFixed(1)} kg
          </Text>
        )}
      </View>
    );

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatItem label="Current" value={stats.currentWeight} change={stats.totalChange} />
          <StatItem label="Start" value={stats.startWeight} />
        </View>
        <View style={styles.statsRow}>
          <StatItem label="Lowest" value={stats.lowestWeight} />
          <StatItem label="Highest" value={stats.highestWeight} />
        </View>
        <StatItem label="Average" value={stats.averageWeight} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Weight Tracking</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add new entry section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <View style={[styles.addEntryCard, { 
              backgroundColor: theme.surface,
              shadowColor: theme.primary 
            }]}>
              <Text style={[styles.addEntryTitle, { color: theme.text }]}>Add New Entry</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.weightInput, { 
                    backgroundColor: theme.surfaceSecondary,
                    color: theme.text 
                  }]}
                  placeholder="Enter weight"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <Text style={[styles.unitText, { color: theme.textSecondary }]}>kg</Text>
              </View>
              <TextInput
                style={[styles.noteInput, { 
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text 
                }]}
                placeholder="Add a note (optional)"
                placeholderTextColor={theme.textSecondary}
                value={newNote}
                onChangeText={setNewNote}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddEntry}
              >
                <LinearGradient
                  colors={theme.gradient.primary}
                  style={styles.addButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.addButtonText, { color: theme.surface }]}>
                    Add Entry
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </MotiView>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {/* Stats Section */}
              {stats && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 100 }}
                >
                  <View style={[styles.statsCard, { 
                    backgroundColor: theme.surface,
                    shadowColor: theme.primary 
                  }]}>
                    <Text style={[styles.statsTitle, { color: theme.text }]}>Statistics</Text>
                    {renderStats()}
                  </View>
                </MotiView>
              )}

              {/* Progress Graph */}
              {entries.length > 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 200 }}
                >
                  <View style={[styles.graphCard, { 
                    backgroundColor: theme.surface,
                    shadowColor: theme.primary 
                  }]}>
                    <Text style={[styles.graphTitle, { color: theme.text }]}>Progress</Text>
                    {renderGraph()}
                  </View>
                </MotiView>
              )}

              {/* History */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 300 }}
              >
                <View style={[styles.historyCard, { 
                  backgroundColor: theme.surface,
                  shadowColor: theme.primary 
                }]}>
                  <Text style={[styles.historyTitle, { color: theme.text }]}>History</Text>
                  {entries.slice().reverse().map((entry, index) => (
                    <MotiView
                      key={entry.id}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: index * 50 }}
                    >
                      <View 
                        style={[
                          styles.historyItem,
                          index !== entries.length - 1 && { borderBottomColor: theme.border }
                        ]}
                      >
                        <View style={styles.historyItemContent}>
                          <View>
                            <Text style={[styles.weightText, { color: theme.text }]}>
                              {entry.weight} kg
                            </Text>
                            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                              {new Date(entry.date).toLocaleDateString()}
                            </Text>
                          </View>
                          {entry.note && (
                            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                              {entry.note}
                            </Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={[styles.deleteButton, { backgroundColor: theme.surfaceSecondary }]}
                          onPress={() => Alert.alert(
                            'Delete Entry',
                            'Are you sure you want to delete this entry?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('weight_entries')
                                      .delete()
                                      .eq('id', entry.id);
                                    
                                    if (error) throw error;
                                    loadWeightEntries();
                                  } catch (error) {
                                    console.error('Error deleting entry:', error);
                                    Alert.alert('Error', 'Failed to delete entry');
                                  }
                                },
                              },
                            ]
                          )}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.error} />
                        </TouchableOpacity>
                      </View>
                    </MotiView>
                  ))}
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
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
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  addEntryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  addEntryTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginRight: 12,
  },
  unitText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  noteInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 16,
  },
  addButton: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  statsContainer: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 2,
  },
  statChange: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  graphCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  graphTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  timelineContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -8,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 12,
    padding: 12,
    borderRadius: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineWeight: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  timelineChange: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  timelineDate: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 4,
  },
  timelineNote: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    fontStyle: 'italic',
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyItemContent: {
    flex: 1,
  },
  weightText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
});

export default WeightTrackingScreen; 