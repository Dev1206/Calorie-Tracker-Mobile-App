import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '../lib/theme/ThemeContext';

type Route = '/screens/FoodSearchScreen' | '/screens/BarcodeScannerScreen' | '/screens/ManualEntryScreen';

type EntryMethod = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: Route;
  gradient: readonly [string, string];
};

const FoodLoggingScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();

  const entryMethods: EntryMethod[] = [
    {
      id: 'search',
      title: 'Search for Food',
      description: 'Search our database of foods',
      icon: 'search-outline',
      route: '/screens/FoodSearchScreen',
      gradient: theme.gradient.primary,
    },
    {
      id: 'barcode',
      title: 'Scan Barcode',
      description: 'Quickly scan packaged foods',
      icon: 'barcode-outline',
      route: '/screens/BarcodeScannerScreen',
      gradient: [theme.primary, theme.secondary] as const,
    },
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Add custom food details',
      icon: 'create-outline',
      route: '/screens/ManualEntryScreen',
      gradient: [theme.secondary, theme.primary] as const,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={theme.gradient.background} style={styles.gradient}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Food</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>How would you like to add food?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose a method to log your meal</Text>

          <View style={styles.methodsContainer}>
            {entryMethods.map((method, index) => (
              <MotiView
                key={method.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 100, type: 'timing', duration: 500 }}
              >
                <TouchableOpacity
                  style={[styles.methodCard, { 
                    backgroundColor: theme.surface,
                    shadowColor: theme.primary 
                  }]}
                  onPress={() => router.push(method.route)}
                >
                  <LinearGradient
                    colors={method.gradient}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={method.icon} size={24} color={theme.surface} />
                  </LinearGradient>
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodTitle, { color: theme.text }]}>{method.title}</Text>
                    <Text style={[styles.methodDescription, { color: theme.textSecondary }]}>{method.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    padding:8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 32,
  },
  methodsContainer: {
    gap: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});

export default FoodLoggingScreen; 