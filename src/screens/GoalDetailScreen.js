import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, Dimensions, RefreshControl, Alert, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fetchGoalDetails, deleteGoal } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getMoodTheme } from '../utils/theme';

const { width } = Dimensions.get('window');

const GoalDetailScreen = ({ route, navigation }) => {
  const { goalId } = route.params;
  const dispatch = useDispatch();
  const { currentGoal, loading, refreshing, mood } = useSelector((state) => state.goals);
  const [showStrategy, setShowStrategy] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  const currentTheme = getMoodTheme(mood);

  useEffect(() => {
    dispatch(fetchGoalDetails(goalId));
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 8, useNativeDriver: true })
    ]).start();
  }, [dispatch, goalId]);

  const onRefresh = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(fetchGoalDetails(goalId));
  }, [dispatch, goalId]);

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Abort Mission?",
      "Deleting this goal will erase all flight data and mission tasks. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Abort", 
          style: "destructive",
          onPress: async () => {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
             await dispatch(deleteGoal(goalId)).unwrap();
             navigation.navigate('MainTabs', { screen: 'Goals' });
          }
        }
      ]
    );
  };

  if (loading || !currentGoal) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.secondary} />
        <Text style={styles.loadingText}>Coordinating flight path...</Text>
      </View>
    );
  }

  const progress = Math.round((currentGoal.completedTasks / (currentGoal.totalTasks || 1)) * 100);
  
  const startDate = new Date(currentGoal.createdAt);
  const now = new Date();
  const dayNum = Math.ceil(Math.abs(now - startDate) / (1000 * 60 * 60 * 24)) || 1;
  const currentWeek = Math.ceil(dayNum / 7);
  const currentPhase = currentGoal.phases?.find(p => 
    p.weeks && Array.isArray(p.weeks) && p.weeks.length >= 2 &&
    currentWeek >= p.weeks[0] && currentWeek <= p.weeks[1]
  ) || (currentGoal.phases && currentGoal.phases.length > 0 ? currentGoal.phases[0] : null);

  return (
    <LinearGradient
      key={mood} // Force full re-render when mood changes to catch all style updates
      colors={currentTheme.gradient}
      style={styles.mainGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Mission Details</Text>
           <TouchableOpacity style={[styles.editButton, { backgroundColor: '#FEE2E2' }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
           </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.secondary} />
          }
        >
          <Animated.View style={[styles.headerCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
              key={mood + "_mission_header"} 
              colors={[currentTheme.primary, currentTheme.darkStart || '#0F172A']}
              style={styles.headerCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
            <View style={styles.typeBadge}>
              <Ionicons 
                name={currentGoal.goalType === 'Career' ? 'briefcase' : currentGoal.goalType === 'Fitness' ? 'fitness' : currentGoal.goalType === 'Personal' ? 'person' : 'book'} 
                size={14} 
                color={currentTheme.secondary} 
              />
              <Text style={[styles.typeBadgeText, { color: currentTheme.secondary }]}>{currentGoal.goalType}</Text>
            </View>
            <Text style={styles.title}>{currentGoal.title}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                 <Text style={styles.statVal}>{progress}%</Text>
                 <Text style={styles.statLab}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={styles.statVal}>{dayNum}/{currentGoal.totalDays}</Text>
                 <Text style={styles.statLab}>Days In</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={styles.statVal}>{currentGoal.totalTasks}</Text>
                 <Text style={styles.statLab}>Checkpoints</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                 <View style={[styles.progressThumb, { width: `${progress}%`, backgroundColor: currentTheme.secondary }]} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Active Phase</Text>
           <View style={[styles.weekBadge, { backgroundColor: currentTheme.primary + '15' }]}>
              <Text style={[styles.weekText, { color: currentTheme.primary }]}>
                Week {currentPhase?.weeks?.[0] || '1'} - {currentPhase?.weeks?.[1] || '?'}
              </Text>
           </View>
        </View>

        <View style={[styles.phaseCard, { borderColor: currentTheme.secondary + '20', backgroundColor: 'rgba(255,255,255,0.95)' }]}>
           <View style={[styles.phaseIcon, { backgroundColor: currentTheme.primary }]}>
              <Ionicons name="navigate" size={24} color={theme.colors.white} />
           </View>
           <View style={styles.phaseInfo}>
              <Text style={styles.phaseName}>{currentPhase?.phase || 'Plan Operational'}</Text>
              <Text style={styles.phaseDescription}>{currentPhase?.focus || currentGoal.summary}</Text>
           </View>
        </View>

        <View style={[styles.sopSection, { borderLeftColor: currentTheme.primary, borderLeftWidth: 4, backgroundColor: 'rgba(255,255,255,0.95)' }]}>
          <View style={styles.sopHeader}>
             <Ionicons name="bulb" size={20} color={currentTheme.secondary} />
             <Text style={[styles.sopTitle, { color: currentTheme.darkStart }]}>Coach's Briefing</Text>
          </View>
          <Text style={styles.sopText}>{currentGoal.summary || currentGoal.sop}</Text>
        </View>

        <View style={styles.actions}>
           <TouchableOpacity 
             style={[styles.mainAction, { backgroundColor: currentTheme.secondary }]}
             onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('MainTabs', { screen: 'Home' });
             }}
           >
             <Text style={styles.mainActionText}>Resume Mission Today</Text>
             <Ionicons name="play" size={18} color={theme.colors.white} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={[styles.secondaryAction, { borderColor: currentTheme.primary }]}
             onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowStrategy(true);
             }}
           >
             <Ionicons name="map" size={20} color={currentTheme.primary} />
             <Text style={[styles.secondaryActionText, { color: currentTheme.primary }]}>Open Full Flight Plan</Text>
           </TouchableOpacity>
        </View>

        <Modal
          visible={showStrategy}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowStrategy(false)}
        >
          {showStrategy && (
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Full Strategic Roadmap</Text>
                <TouchableOpacity onPress={() => setShowStrategy(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={24} color={currentTheme.primary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.fullBriefing}>
                   <Text style={[styles.briefingLabel, { color: currentTheme.primary }]}>OBJECTIVE STATEMENT</Text>
                   <Text style={styles.fullSopText}>{currentGoal.sop || currentGoal.summary}</Text>
                </View>
                
                {currentGoal.fullPlan && currentGoal.fullPlan.length > 0 ? (
                  <View style={{ marginTop: 30 }}>
                    <Text style={styles.modalSectionTitle}>Complete Mission Timeline</Text>
                    <Text style={styles.roadmapSubtitle}>Every single day of your journey, mapped by AI.</Text>
                    
                    {currentGoal.fullPlan.map((dayItem, index) => (
                      <View key={index} style={styles.dayCard}>
                        <View style={[styles.dayBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                          <Text style={[styles.dayBadgeText, { color: currentTheme.primary }]}>DAY {dayItem.day}</Text>
                        </View>
                        <View style={styles.dayContent}>
                          <Text style={styles.dayTheme}>{dayItem.theme || 'Operation Progress'}</Text>
                          <View style={styles.dayTasksList}>
                            {dayItem.tasks?.map((t, tIdx) => (
                              <View key={tIdx} style={styles.dayTaskRow}>
                                <Ionicons name="radio-button-on" size={12} color={currentTheme.secondary} />
                                <Text style={styles.dayTaskTitle}>{t.title}</Text>
                                {t.time && <Text style={styles.dayTaskTime}>{t.time}m</Text>}
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : currentGoal.roadmap && currentGoal.roadmap.length > 0 ? (
                  <View style={{ marginTop: 30 }}>
                    <Text style={styles.modalSectionTitle}>Mission Landmarks</Text>
                    {currentGoal.roadmap.map((item, index) => (
                      <View key={index} style={styles.roadmapCard}>
                        <View style={[styles.roadmapBadge, { backgroundColor: currentTheme.primary + '15' }]}>
                          <Text style={[styles.roadmapBadgeText, { color: currentTheme.primary }]}>{item.label}</Text>
                        </View>
                        <Text style={styles.roadmapTitle}>{item.title}</Text>
                        <View style={styles.pointsList}>
                          {item.points?.map((point, pIndex) => (
                            <View key={pIndex} style={styles.pointRow}>
                              <View style={[styles.pointDot, { backgroundColor: currentTheme.secondary }]} />
                              <Text style={styles.pointText}>{point}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : currentGoal.phases && (
                  <View style={{ marginTop: 30 }}>
                    <Text style={styles.modalSectionTitle}>Phased Approach</Text>
                    {currentGoal.phases.map((p, i) => (
                      <View key={i} style={styles.modalPhaseItem}>
                        <View style={[styles.modalPhaseNum, { backgroundColor: currentTheme.primary + '15' }]}>
                           <Text style={[styles.phaseNumText, { color: currentTheme.primary }]}>{i+1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalPhaseTitle}>{p.phase}</Text>
                          <Text style={[styles.modalPhaseMeta, { color: currentTheme.secondary }]}>
                            Week {p.weeks?.[0] || '1'} - {p.weeks?.[1] || '?'}
                          </Text>
                          <Text style={styles.modalPhaseFocus}>{p.focus}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
  
                {currentGoal.rules && (
                  <View style={[styles.recoveryCard, { backgroundColor: currentTheme.primary + '15', borderColor: currentTheme.secondary }]}>
                    <View style={styles.recoveryHeader}>
                       <Ionicons name="shield-checkmark" size={20} color={currentTheme.primary} />
                       <Text style={[styles.recoveryTitle, { color: currentTheme.darkStart }]}>Operational Rules</Text>
                    </View>
                    <View style={styles.ruleRow}>
                       <Text style={[styles.ruleLabel, { color: currentTheme.primary }]}>Buffer Days</Text>
                       <Text style={[styles.ruleValue, { color: currentTheme.darkStart }]}>{currentGoal.rules.bufferDaysPerWeek} per week</Text>
                    </View>
                    <View style={styles.ruleRow}>
                       <Text style={[styles.ruleLabel, { color: currentTheme.primary }]}>Daily Load</Text>
                       <Text style={[styles.ruleValue, { color: currentTheme.darkStart }]}>Max {currentGoal.rules.maxTasksPerDay} checkpoints</Text>
                    </View>
                    <Text style={[styles.recoveryNote, { color: currentTheme.darkStart }]}>Skip Protocol: {currentGoal.rules.skipLogic}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </Modal>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainGradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: theme.colors.textSecondary, fontWeight: '600' },
  header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 20,
     paddingVertical: 15,
  },
  backButton: {
     width: 44,
     height: 44,
     borderRadius: 15,
     backgroundColor: theme.colors.white,
     justifyContent: 'center',
     alignItems: 'center',
     ...theme.shadows.soft,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  editButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  container: { flex: 1 },
  content: { padding: 20 },
  headerCard: {
    borderRadius: 30,
    marginBottom: 25,
    ...theme.shadows.deep,
    overflow: 'hidden',
  },
  headerCardGradient: {
    padding: 24,
  },
  typeBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.1)',
     paddingVertical: 6,
     paddingHorizontal: 12,
     borderRadius: 12,
     alignSelf: 'flex-start',
     gap: 6,
     marginBottom: 15,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.white, marginBottom: 25, letterSpacing: -0.5 },
  statsRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 25,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: theme.colors.white },
  statLab: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressContainer: { marginTop: 5 },
  progressTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden' },
  progressThumb: { height: '100%', borderRadius: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  weekBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  weekText: { fontSize: 12, fontWeight: '700' },
  phaseCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 25,
    ...theme.shadows.soft,
    borderWidth: 1,
  },
  phaseIcon: {
     width: 50,
     height: 50,
     borderRadius: 18,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 15,
  },
  phaseInfo: { flex: 1 },
  phaseName: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  phaseDescription: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
  sopSection: {
     backgroundColor: theme.colors.white,
     padding: 20,
     borderRadius: 24,
     borderWidth: 1.5,
     borderColor: 'rgba(15, 23, 42, 0.05)',
     marginBottom: 30,
     ...theme.shadows.soft,
  },
  sopHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sopTitle: { fontSize: 15, fontWeight: '800' },
  sopText: { fontSize: 14, color: theme.colors.text, lineHeight: 22, fontWeight: '500' },
  actions: { gap: 12, marginBottom: 40 },
  mainAction: {
     paddingVertical: 18,
     borderRadius: 20,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     gap: 10,
     ...theme.shadows.medium,
  },
  mainActionText: { color: theme.colors.white, fontSize: 16, fontWeight: '900' },
  secondaryAction: {
     backgroundColor: theme.colors.white,
     paddingVertical: 18,
     borderRadius: 20,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     gap: 10,
     borderWidth: 1,
  },
  secondaryActionText: { fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1, backgroundColor: theme.colors.background },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.border 
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  modalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalContent: { padding: 25 },
  fullBriefing: { backgroundColor: theme.colors.white, padding: 20, borderRadius: 20, ...theme.shadows.soft },
  briefingLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  fullSopText: { fontSize: 15, color: theme.colors.text, lineHeight: 24, fontWeight: '500' },
  modalSectionTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: 20 },
  modalPhaseItem: {
     flexDirection: 'row',
     marginBottom: 20,
     backgroundColor: theme.colors.white,
     padding: 15,
     borderRadius: 20,
     ...theme.shadows.soft,
  },
  modalPhaseNum: {
     width: 32,
     height: 32,
     borderRadius: 16,
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 15,
  },
  phaseNumText: { fontSize: 14, fontWeight: '900' },
  modalPhaseTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  modalPhaseMeta: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  modalPhaseFocus: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 10, lineHeight: 18 },
  recoveryCard: {
     marginTop: 30,
     padding: 20,
     borderRadius: 24,
     borderWidth: 1,
  },
  recoveryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  recoveryTitle: { fontSize: 16, fontWeight: '800' },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  ruleLabel: { fontSize: 14, fontWeight: '600' },
  ruleValue: { fontSize: 14, fontWeight: '800' },
  recoveryNote: { fontSize: 13, fontStyle: 'italic', marginTop: 5 },
  roadmapCard: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 24,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.soft,
  },
  roadmapBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  roadmapBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  roadmapTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 12,
  },
  pointsList: {
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  roadmapSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    fontWeight: '500',
  },
  dayCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.soft,
    gap: 15,
  },
  dayBadge: {
    width: 60,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  dayContent: {
    flex: 1,
  },
  dayTheme: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  dayTasksList: {
    gap: 6,
  },
  dayTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTaskTitle: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  dayTaskTime: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    opacity: 0.6,
    fontWeight: '700',
  },
});

export default GoalDetailScreen;
