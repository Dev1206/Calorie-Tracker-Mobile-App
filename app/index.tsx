import { Text, View, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#F9F9F9', '#F9F9F9']}
      style={styles.container}
      onLayout={onLayoutRootView}
    >
      <View style={styles.contentContainer}>
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: "https://cdn.prod.website-files.com/62c82c2449b0ebd57821fd87/653d8b67a494cdf3059b8a39_nutrition-hero-graphic.webp"
            }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Achieve Your{'\n'}
            <Text style={styles.titleHighlight}>Nutrition Goals</Text>
          </Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badgeIcon}>
              <Text style={styles.starIcon}>★</Text>
            </View>
            <Text style={styles.badge}>
              Trusted by 1M+ health enthusiasts
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.push('/screens/ProfileSetupScreen')}
        >
          <LinearGradient
            colors={['#5AA9E6', '#7FC8F8']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signInButton}
          activeOpacity={0.8}
          onPress={() => router.push('/screens/SignInScreen')}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  heroContainer: {
    width: width,
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroImage: {
    width: "90%",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_700Bold',
    textAlign: "center",
    marginBottom: 30,
    color: "#333333",
    lineHeight: 44,
  },
  titleHighlight: {
    color: "#FF6392",
    fontFamily: 'Outfit_700Bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#5AA9E6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  badgeIcon: {
    marginRight: 8,
  },
  starIcon: {
    fontSize: 16,
    color: "#FFE45E",
    fontFamily: 'Outfit_400Regular',
  },
  badge: {
    fontSize: 16,
    color: "#5AA9E6",
    fontFamily: 'Outfit_600SemiBold',
  },
  button: {
    width: width * 0.85,
    height: 56,
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
  buttonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  signInButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signInButtonText: {
    color: "#5AA9E6",
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
});
