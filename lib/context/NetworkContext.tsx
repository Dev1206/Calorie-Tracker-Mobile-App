import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { MotiView } from 'moti';

interface NetworkContextType {
  isConnected: boolean;
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<Props> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      if (!state.isConnected && !isOfflineMode) {
        setShowBanner(true);
      }
    });

    return () => unsubscribe();
  }, [isOfflineMode]);

  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
  };

  return (
    <NetworkContext.Provider value={{ isConnected, isOfflineMode, toggleOfflineMode }}>
      {showBanner && (!isConnected || isOfflineMode) && (
        <MotiView
          from={{ opacity: 0, translateY: -50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
          style={[
            styles.banner,
            { backgroundColor: isOfflineMode ? theme.warning : theme.error }
          ]}
        >
          <Ionicons 
            name={isOfflineMode ? 'cloud-offline' : 'wifi'} 
            size={20} 
            color={theme.surface} 
          />
          <Text style={[styles.bannerText, { color: theme.surface }]}>
            {isOfflineMode 
              ? 'Offline Mode Enabled'
              : 'No Internet Connection'
            }
          </Text>
        </MotiView>
      )}
      {children}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  bannerText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
}); 