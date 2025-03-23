import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../lib/theme/ThemeContext';

type Route = 'dashboard' | 'water' | 'food' | 'history' | 'profile';

type AppRoute = 
  | '/HomeScreen'
  | '/WaterIntakeScreen'
  | '/FoodLoggingScreen'
  | '/PastEntriesScreen'
  | '/ProfileScreen';

interface NavItem {
  route: Route;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  href: AppRoute;
}

const navItems: NavItem[] = [
  {
    route: 'dashboard',
    label: 'Dashboard',
    icon: 'home-outline',
    activeIcon: 'home',
    href: '/HomeScreen',
  },
  {
    route: 'water',
    label: 'Water',
    icon: 'water-outline',
    activeIcon: 'water',
    href: '/WaterIntakeScreen',
  },
  {
    route: 'food',
    label: 'Food',
    icon: 'restaurant-outline',
    activeIcon: 'restaurant',
    href: '/FoodLoggingScreen',
  },
  {
    route: 'history',
    label: 'History',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    href: '/PastEntriesScreen',
  },
  {
    route: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    href: '/ProfileScreen',
  },
] as const;

interface BottomNavBarProps {
  currentRoute: Route;
}

const BottomNavBar = ({ currentRoute }: BottomNavBarProps) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleNavigation = (item: NavItem) => {
    if (currentRoute !== item.route) {
      router.replace(item.href);
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.surface,
      borderTopColor: theme.border,
      shadowColor: theme.primary 
    }]}>
      {navItems.map((item, index) => (
        <MotiView
          key={item.route}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: index * 100 }}
        >
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => handleNavigation(item)}
          >
            <Ionicons
              name={currentRoute === item.route ? item.activeIcon : item.icon}
              size={24}
              color={currentRoute === item.route ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.navLabel,
                { color: theme.textSecondary },
                currentRoute === item.route && [styles.activeNavLabel, { color: theme.primary }],
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        </MotiView>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 4,
  },
  activeNavLabel: {
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default BottomNavBar; 