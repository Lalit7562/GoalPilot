import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, '#1E293B']}
        style={styles.background}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>GoalPilot</Text>
          <Text style={styles.subtitle}>AI-Powered Daily Coaching</Text>
          <Text style={styles.description}>Navigate your success with precision and accountability.</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Onboarding')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.primary 
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  logoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 40,
    marginBottom: 40,
    ...theme.shadows.medium,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: { 
    fontSize: 48, 
    fontWeight: '900', 
    color: theme.colors.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.secondary,
    fontWeight: '700',
    marginTop: 5,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.8,
    justifyContent: 'center',
    gap: 10,
    ...theme.shadows.medium,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '800',
  }
});

export default SplashScreen;
