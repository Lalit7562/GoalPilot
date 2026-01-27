import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  RefreshControl, 
  Alert,
  Animated,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  fetchTodayTasks, 
  fetchStats, 
  updateTaskOnServer, 
  setMood, 
  fetchDashboardSummary, 
  activateGoal 
} from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getMoodTheme } from '../utils/theme';
import { getRankInfo } from '../utils/stats';
import { scheduleDailyReminder } from '../utils/notifications';

const moods = [
  { label: 'Focused', icon: 'eye-outline', activeIcon: 'eye', color: '#0EA5E9', bg: '#E0F2FE' },
  { label: 'Energized', icon: 'flash-outline', activeIcon: 'flash', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Relaxed', icon: 'leaf-outline', activeIcon: 'leaf', color: '#10B981', bg: '#D1FAE5' },
  { label: 'Anxious', icon: 'pulse-outline', activeIcon: 'pulse', color: '#EF4444', bg: '#FEE2E2' },
  { label: 'Neutral', icon: 'sunny-outline', activeIcon: 'sunny', color: '#64748B', bg: '#F1F5F9' },
];

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const HomeScreen = ({ navigation }) => {
  const { 
    tasks, 
    mood, 
    loading, 
    refreshing, 
    isUpdating, 
    stats, 
    dashboardSummary, 
    microHabit, 
    token 
  } = useSelector((state) => state.goals);
  
  const dispatch = useDispatch();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
    ]).start();

    const hasTasks = tasks && Array.isArray(tasks) && tasks.length > 0;
    if (!hasTasks || !dashboardSummary) {
      dispatch(fetchTodayTasks(mood));
      dispatch(fetchDashboardSummary());
    }
    dispatch(fetchStats());

    if (token) {
      scheduleDailyReminder(token);
    }
  }, [dispatch, mood, token]);

  const handleStatusUpdate = async (id, status) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await dispatch(updateTaskOnServer({ id, status })).unwrap();
      dispatch(fetchStats()); 
      dispatch(fetchDashboardSummary());
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Task update failed:", error);
    }
  };

  const handleMoodSelect = (m) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(setMood(m));
  };

  const onRefresh = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(fetchTodayTasks(mood));
    dispatch(fetchStats());
    dispatch(fetchDashboardSummary());
  }, [dispatch, mood]);

  const handleActivate = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(activateGoal(id));
  };

  const currentTheme = getMoodTheme(mood);
  const rank = getRankInfo(stats?.totalCompleted || 0);

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.mainGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
           <View style={styles.headerInfo}>
              <Text style={styles.greetingText}>{getTimeGreeting()}</Text>
              <Text style={styles.rankNameLabel}>{rank.name}</Text>
           </View>
           <View style={styles.headerActions}>
             <TouchableOpacity 
               style={[styles.profileButton, { borderColor: currentTheme.secondary + '20' }]}
               onPress={() => {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 Alert.alert(
                   "Mission Control",
                   "AI Commander is active. Strategic briefings are sent daily.",
                   [{ text: "Copy That" }]
                 );
               }}
             >
                <Ionicons name="notifications" size={20} color={currentTheme.primary} />
             </TouchableOpacity>
           </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />
          }
        >
          {/* Dashboard Summary Card */}
          <Animated.View style={[styles.dashboardCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
             <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.cardInfo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.summaryTop}>
                   <View style={styles.progressCircle}>
                      <Text style={styles.progressVal}>{dashboardSummary?.progressPercentage || 0}%</Text>
                      <Text style={styles.progressLab}>MISSION</Text>
                   </View>
                   <View style={styles.summaryText}>
                      <Text style={styles.summaryTitle}>{dashboardSummary?.goalTitle || "GoalPilot Core"}</Text>
                      <View style={styles.streakIndicator}>
                         <Ionicons name="flame" size={14} color="#F59E0B" />
                         <Text style={styles.streakText}>{dashboardSummary?.streakText || "0 Day Streak"}</Text>
                      </View>
                   </View>
                </View>
                
                <View style={[styles.briefingBox, { borderColor: currentTheme.secondary + '30' }]}>
                   <View style={styles.briefingHeader}>
                      <Ionicons name="mic" size={14} color={currentTheme.secondary} />
                      <Text style={styles.briefingTitle}>COMMANDER_BREIFING</Text>
                   </View>
                   <Text style={[styles.briefingText, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                     {dashboardSummary?.aiInsight || "Establishing cognitive link... Ready for today's mission."}
                   </Text>
                   
                   {microHabit && (
                     <View style={styles.microHabitBox}>
                        <View style={styles.microHabitIcon}>
                           <Ionicons name="flash" size={18} color={currentTheme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                           <Text style={styles.microHabitLabel}>MICRO_HABIT_TRIGGER</Text>
                           <Text style={styles.microHabitText}>{microHabit}</Text>
                        </View>
                     </View>
                   )}
                </View>
             </LinearGradient>
          </Animated.View>

          {/* Mood Section */}
          <View style={styles.moodSection}>
            <Text style={styles.sectionTitle}>Operational Energy</Text>
            <View style={styles.moodGrid}>
              {moods.map((m) => (
                <TouchableOpacity
                  key={m.label}
                  onPress={() => handleMoodSelect(m.label)}
                  style={[styles.moodItem, mood === m.label && { backgroundColor: m.bg, borderColor: m.color }]}
                >
                  <Ionicons name={mood === m.label ? m.activeIcon : m.icon} size={28} color={m.color} />
                  <Text style={[styles.moodLabel, { color: m.color }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Today's Checklist */}
          <View style={styles.checklistSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tactical Roadmap</Text>
              <Text style={styles.dayTag}>Day {dashboardSummary?.currentDay || 1}</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={currentTheme.primary} style={{ marginTop: 40 }} />
            ) : tasks && tasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color={theme.colors.border} />
                <Text style={styles.emptyText}>No flight path for today. Set a new goal!</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {tasks.map((item, index) => (
                  <Animated.View 
                    key={item._id} 
                    style={{ 
                      opacity: fadeAnim, 
                      transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(index * 5)) }] 
                    }}
                  >
                    <TouchableOpacity 
                      style={[styles.taskCard, item.status === 'completed' && styles.taskCardDone]}
                      onPress={() => item.status === 'pending' && handleStatusUpdate(item._id, 'completed')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskCardContent}>
                        <View style={[styles.taskTypeIndicator, { backgroundColor: item.status === 'completed' ? currentTheme.secondary : '#F1F5F9' }]}>
                          <Ionicons 
                            name={item.type === 'Learn' ? 'book' : item.type === 'Practice' ? 'rocket' : 'pulse'} 
                            size={16} 
                            color={item.status === 'completed' ? theme.colors.white : theme.colors.textSecondary} 
                          />
                        </View>
                        
                        <View style={styles.taskMainInfo}>
                          <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskDoneText]}>
                            {item.title}
                          </Text>
                          <View style={styles.taskMetaRow}>
                            <View style={styles.metaItem}>
                              <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
                              <Text style={styles.metaText}>{item.time}m</Text>
                            </View>
                            <View style={styles.metaDivider} />
                            <Text style={styles.metaText}>{item.difficulty}</Text>
                          </View>
                        </View>
                        
                        <View style={[styles.statusToggle, item.status === 'completed' && { backgroundColor: currentTheme.primary }]}>
                          <Ionicons 
                            name={item.status === 'completed' ? 'checkmark' : 'ellipse-outline'} 
                            size={20} 
                            color={item.status === 'completed' ? theme.colors.white : theme.colors.border} 
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* Other Goals */}
          {dashboardSummary?.otherGoals?.length > 0 && (
            <View style={styles.otherGoalsSection}>
               <Text style={styles.sectionTitle}>Standby Missions</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                  {dashboardSummary.otherGoals.map((g) => (
                    <TouchableOpacity 
                      key={g._id} 
                      style={styles.miniGoalCard}
                      onPress={() => handleActivate(g._id)}
                    >
                       <View style={styles.miniCardHeader}>
                          <Ionicons 
                             name={g.goalType === 'Health' ? 'fitness' : g.goalType === 'Skill' ? 'ribbon' : 'briefcase'} 
                             size={20} 
                             color={theme.colors.textSecondary} 
                          />
                          <View style={styles.miniCardBadge}>
                             <Text style={styles.miniCardBadgeText}>STANDBY</Text>
                          </View>
                       </View>
                       <Text style={styles.miniGoalTitle} numberOfLines={2}>{g.title}</Text>
                       <TouchableOpacity style={styles.activateButton} onPress={() => handleActivate(g._id)}>
                          <Text style={styles.activateButtonText}>ACTIVATE</Text>
                       </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.strategyPreview, { backgroundColor: currentTheme.darkStart || '#0F172A' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const gId = dashboardSummary?.goalId || (tasks?.[0]?.goalId);
              if (gId) navigation.navigate('GoalDetail', { goalId: gId });
            }}
          >
             <Ionicons name="map" size={20} color={theme.colors.white} />
             <Text style={styles.strategyLink}>View Strategic Roadmap</Text>
             <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainGradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  headerInfo: { flex: 1 },
  greetingText: { fontSize: 28, fontWeight: '900', color: theme.colors.text, letterSpacing: -1 },
  rankNameLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  headerActions: { flexDirection: 'row', gap: 10 },
  profileButton: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: theme.colors.white,
    justifyContent: 'center', alignItems: 'center', ...theme.shadows.soft,
    borderWidth: 1.5,
  },
  scrollContent: { padding: 25, paddingBottom: 100 },
  dashboardCard: {
    borderRadius: 35, overflow: 'hidden', ...theme.shadows.deep, marginBottom: 35,
  },
  cardInfo: { padding: 25 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  progressCircle: {
     width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)',
     borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
     justifyContent: 'center', alignItems: 'center', marginRight: 20
  },
  progressVal: { fontSize: 18, fontWeight: '900', color: theme.colors.white },
  progressLab: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '800' },
  summaryText: { flex: 1 },
  summaryTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.white, letterSpacing: -0.5 },
  streakIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  streakText: { fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  briefingBox: {
     backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20,
     borderWidth: 1,
  },
  briefingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  briefingTitle: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 },
  briefingText: { fontSize: 15, color: '#F8FAFC', lineHeight: 24, fontWeight: '500' },
  microHabitBox: {
     flexDirection: 'row', 
     backgroundColor: 'rgba(255,255,255,0.08)', 
     borderRadius: 18, 
     padding: 15,
     marginTop: 20, 
     alignItems: 'center', 
     gap: 15,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.1)',
  },
  microHabitIcon: { 
     width: 40, height: 40, borderRadius: 12, 
     backgroundColor: 'rgba(255,255,255,0.1)', 
     justifyContent: 'center', alignItems: 'center' 
  },
  microHabitLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  microHabitText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  moodSection: { marginBottom: 35 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: 15, letterSpacing: -0.5 },
  moodGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  moodItem: {
     flex: 1, height: 85, backgroundColor: theme.colors.white, borderRadius: 22,
     justifyContent: 'center', alignItems: 'center', marginHorizontal: 4,
     borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.03)', ...theme.shadows.soft,
  },
  moodLabel: { fontSize: 10, fontWeight: '700', marginTop: 6, textTransform: 'uppercase' },
  checklistSection: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dayTag: { fontSize: 12, fontWeight: '900', color: theme.colors.primary, backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  list: { gap: 12 },
  taskCard: {
     backgroundColor: theme.colors.white, borderRadius: 24, padding: 15,
     flexDirection: 'row', alignItems: 'center', ...theme.shadows.soft,
     borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)',
  },
  taskCardDone: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  taskCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  taskTypeIndicator: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  taskMainInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 4 },
  taskDoneText: { textDecorationLine: 'line-through', color: theme.colors.textSecondary },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.border },
  statusToggle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 30, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
  emptyText: { color: theme.colors.textSecondary, marginTop: 10, textAlign: 'center', fontWeight: '600' },
  otherGoalsSection: { marginBottom: 35 },
  miniGoalCard: { backgroundColor: '#FFF', width: 160, padding: 20, borderRadius: 25, marginRight: 15, ...theme.shadows.soft },
  miniCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  miniCardBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  miniCardBadgeText: { fontSize: 8, fontWeight: '900', color: theme.colors.textSecondary },
  miniGoalTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text, marginBottom: 15, height: 36 },
  activateButton: { backgroundColor: '#F8FAFC', paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  activateButtonText: { fontSize: 11, fontWeight: '900', color: theme.colors.primary },
  strategyPreview: {
     flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 25,
     marginBottom: 30, gap: 15, ...theme.shadows.medium,
  },
  strategyLink: { flex: 1, fontSize: 15, fontWeight: '900', color: '#FFF' },
});

export default HomeScreen;
