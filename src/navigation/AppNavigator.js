import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import GoalSetupScreen from '../screens/GoalSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import GoalListScreen from '../screens/GoalListScreen';
import GoalDetailScreen from '../screens/GoalDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ onPress }) => (
  <View style={{ 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
  }}>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        top: -20,
        ...styles.shadow
      }}
    >
      <View style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
      }}>
        <Ionicons name="add" color="#FFF" size={32} />
      </View>
    </TouchableOpacity>
  </View>
);

const AnimatedTabIcon = ({ focused, iconName, color }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const circleScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
       Animated.spring(scaleAnim, {
          toValue: focused ? 1 : 0.8,
          useNativeDriver: true,
          friction: 5,
       }),
       Animated.timing(opacityAnim, {
          toValue: focused ? 1 : 0.6,
          duration: 200,
          useNativeDriver: true,
       }),
       Animated.timing(circleScale, {
          toValue: focused ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
       })
    ]).start();
  }, [focused]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', top: 5 }}>
      {/* Active Circle Background Animation */}
      <Animated.View 
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.colors.primary + '15', // light primary background
          position: 'absolute',
          transform: [{ scale: circleScale }],
          opacity: focused ? 1 : 0,
        }}
      />
      
      {/* Icon Animation */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <Ionicons 
          name={iconName} 
          size={24} 
          color={focused ? theme.colors.primary : theme.colors.textSecondary} 
        />
      </Animated.View>

      {/* Dot Indicator Animation */}
      {focused && (
         <Animated.View style={{
           width: 4, 
           height: 4, 
           borderRadius: 2, 
           backgroundColor: theme.colors.primary,
           position: 'absolute',
           bottom: -10,
           transform: [{ scale: circleScale }]
         }} />
      )}
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
           position: 'absolute',
           bottom: 25,
           left: 20,
           right: 20,
           elevation: 5,
           shadowColor: '#000',
           shadowOffset: { width: 0, height: 10 },
           shadowOpacity: 0.1,
           shadowRadius: 20,
           backgroundColor: '#FFFFFF',
           borderRadius: 25,
           height: 70,
           borderTopWidth: 0,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Goals') {
            iconName = focused ? 'file-tray-full' : 'file-tray-full-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <AnimatedTabIcon focused={focused} iconName={iconName} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalListScreen} 
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen 
        name="AddGoal" 
        component={GoalSetupScreen}
        options={{
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          )
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen} 
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useSelector(state => state.goals);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Onboarding" 
        screenOptions={{ 
           headerShown: false,
           animation: 'slide_from_right',
           animationDuration: 250,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="GoalSetup" component={GoalSetupScreen} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5
  }
});

export default AppNavigator;
