import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Animated, Easing, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { updateTaskOnServer, fetchDashboardSummary, fetchStats, fetchTodayTasks } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getMoodTheme } from '../utils/theme';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;

const FocusTimerScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const dispatch = useDispatch();
  const { mood } = useSelector((state) => state.goals);
  const currentTheme = getMoodTheme(mood);

  const [timeLeft, setTimeLeft] = useState(task.time * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
      
      // Pulsing effect when active
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();

    } else if (timeLeft === 0 && !isCompleted) {
      handleComplete();
      clearInterval(interval);
    } else {
      clearInterval(interval);
      pulseAnim.stopAnimation();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const handleComplete = async () => {
    setIsActive(false);
    setIsCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      await dispatch(updateTaskOnServer({ id: task._id, status: 'completed' })).unwrap();
      dispatch(fetchDashboardSummary());
      dispatch(fetchStats());
      dispatch(fetchTodayTasks(mood));
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Deep Work Mode</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Task Info */}
          <View style={styles.taskInfo}>
            <Text style={styles.taskLabel}>CURRENT MISSION</Text>
            <Text style={styles.taskTitle}>{task.title}</Text>
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.glowContainer, { transform: [{ scale: pulseAnim }] }]}>
              <View style={[styles.circle, { borderColor: currentTheme.secondary + '40' }]} />
              <View style={styles.timerContent}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerSub}>{isActive ? 'EYES ON TARGET' : 'PAUSED'}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isCompleted ? (
              <>
                <TouchableOpacity 
                  style={[styles.mainButton, { backgroundColor: isActive ? '#F1F5F9' : currentTheme.secondary }]} 
                  onPress={toggleTimer}
                >
                  <Ionicons 
                    name={isActive ? "pause" : "play"} 
                    size={32} 
                    color={isActive ? "#0F172A" : "#FFF"} 
                  />
                  <Text style={[styles.buttonText, { color: isActive ? "#0F172A" : "#FFF" }]}>
                    {isActive ? 'Pause Mission' : 'Commence Work'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={() => {
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     handleComplete();
                  }}
                >
                  <Text style={styles.skipText}>Complete Manually</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.victoryCard}>
                <Ionicons name="checkmark-circle" size={80} color={currentTheme.secondary} />
                <Text style={styles.victoryTitle}>Mission Accomplished</Text>
                <Text style={styles.victorySub}>Focus protocols succeeded.</Text>
                <TouchableOpacity 
                  style={[styles.mainButton, { backgroundColor: currentTheme.secondary, marginTop: 20 }]} 
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Return to HQ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Decoration */}
          <View style={styles.footerInfo}>
             <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.4)" />
             <Text style={styles.footerText}>COGNITIVE SHIELD ACTIVE</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 25 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 15 
  },
  headerTitle: { color: 'rgba(255,255,255,0.6)', fontWeight: '900', letterSpacing: 2, fontSize: 12, textTransform: 'uppercase' },
  closeButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  taskInfo: { alignItems: 'center', marginTop: 40 },
  taskLabel: { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  taskTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  timerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  glowContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
  },
  timerContent: { alignItems: 'center' },
  timerText: { color: '#FFF', fontSize: 72, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  timerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '800', letterSpacing: 3, marginTop: 5 },
  controls: { paddingBottom: 50 },
  mainButton: {
    height: 70,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    ...theme.shadows.deep,
  },
  buttonText: { fontSize: 18, fontWeight: '900' },
  skipButton: { 
    padding: 20, 
    alignItems: 'center', 
    marginTop: 10 
  },
  skipText: { color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 14 },
  victoryCard: { alignItems: 'center', padding: 30 },
  victoryTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 20 },
  victorySub: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginTop: 5 },
  footerInfo: { 
    position: 'absolute', 
    bottom: 30, 
    alignSelf: 'center', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    opacity: 0.5
  },
  footerText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});

export default FocusTimerScreen;
