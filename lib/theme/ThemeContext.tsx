import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme types
type GradientColors = {
  primary: readonly [string, string];
  background: readonly [string, string];
};

type ThemeType = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  gradient: GradientColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

// Define theme colors
export const lightTheme: ThemeType = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  primary: '#5AA9E6',
  secondary: '#7FC8F8',
  text: '#333333',
  textSecondary: '#64748B',
  border: '#F1F5F9',
  error: '#FF6B6B',
  success: '#22C55E',
  warning: '#FFB4B4',
  gradient: {
    primary: ['#5AA9E6', '#7FC8F8'],
    background: ['#F8FAFC', '#F1F5F9'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

export const darkTheme: ThemeType = {
  background: '#1E293B',
  surface: '#334155',
  surfaceSecondary: '#1E293B',
  primary: '#5AA9E6',
  secondary: '#7FC8F8',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  border: '#475569',
  error: '#FF6B6B',
  success: '#22C55E',
  warning: '#FFB4B4',
  gradient: {
    primary: ['#5AA9E6', '#7FC8F8'],
    background: ['#1E293B', '#0F172A'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_mode');
      setIsDark(savedTheme === 'dark');
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('@theme_mode', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 