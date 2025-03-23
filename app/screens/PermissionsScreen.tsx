import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';
import { MotiView } from 'moti';

type Permission = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: 'pending' | 'granted' | 'denied';
  request: () => Promise<boolean>;
};

export default function PermissionsScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Get reminders for meals, water intake, and daily goals',
      icon: 'notifications-outline',
      status: 'pending',
      request: async () => {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          if (existingStatus === 'granted') return true;

          const { status } = await Notifications.requestPermissionsAsync();
          return status === 'granted';
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      },
    },
    {
      id: 'camera',
      title: 'Camera',
      description: 'Take photos of your meals for better tracking',
      icon: 'camera-outline',
      status: 'pending',
      request: async () => {
        try {
          if (!cameraPermission) {
            const permission = await requestCameraPermission();
            return permission.granted;
          }
          return cameraPermission.granted;
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          return false;
        }
      },
    },
  ]);

  const requestPermission = async (index: number) => {
    const permission = permissions[index];
    const granted = await permission.request();
    
    setPermissions(current => 
      current.map((p, i) => 
        i === index 
          ? { ...p, status: granted ? 'granted' : 'denied' }
          : p
      )
    );
  };

  const handleContinue = async () => {
    const deniedPermissions = permissions.filter(p => p.status === 'denied');
    
    if (deniedPermissions.length > 0) {
      Alert.alert(
        'Permissions Required',
        'Some features may not work without required permissions. Would you like to proceed anyway?',
        [
          {
            text: 'Review Permissions',
            style: 'cancel',
          },
          {
            text: 'Continue Anyway',
            onPress: () => router.replace('/HomeScreen'),
          },
        ]
      );
    } else {
      router.replace('/HomeScreen');
    }
  };

  useEffect(() => {
    // Check existing permissions on mount
    permissions.forEach((_, index) => {
      requestPermission(index);
    });
  }, []);

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#5AA9E6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>One Last Step!</Text>
        <Text style={styles.subtitle}>
          Enable these permissions to get the most out of your calorie tracking experience
        </Text>

        <View style={styles.permissionsContainer}>
          {permissions.map((permission, index) => (
            <MotiView
              key={permission.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 100 }}
            >
              <TouchableOpacity
                style={[
                  styles.permissionItem,
                  permission.status === 'granted' && styles.permissionGranted,
                  permission.status === 'denied' && styles.permissionDenied,
                ]}
                onPress={() => requestPermission(index)}
              >
                <View style={[
                  styles.permissionIcon,
                  permission.status === 'granted' && styles.permissionIconGranted,
                  permission.status === 'denied' && styles.permissionIconDenied,
                ]}>
                  <Ionicons 
                    name={permission.status === 'granted' ? 'checkmark' : permission.icon} 
                    size={24} 
                    color={permission.status === 'granted' ? '#FFFFFF' : '#5AA9E6'} 
                  />
                </View>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionDescription}>
                    {permission.description}
                  </Text>
                </View>
                {permission.status === 'denied' && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => requestPermission(index)}
                  >
                    <Ionicons name="refresh" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={['#5AA9E6', '#7FC8F8'] as const}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.buttonIcon} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#333333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
    marginBottom: 32,
  },
  permissionsContainer: {
    gap: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#5AA9E6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionGranted: {
    borderColor: '#22C55E',
    borderWidth: 1,
  },
  permissionDenied: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIconGranted: {
    backgroundColor: '#22C55E',
  },
  permissionIconDenied: {
    backgroundColor: '#FEE2E2',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#64748B',
  },
  retryButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  footer: {
    padding: 20,
  },
  continueButton: {
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
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
}); 