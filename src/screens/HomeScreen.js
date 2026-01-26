import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator, Image, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { updateTaskOnServer, setMood, fetchTodayTasks, fetchStats, fetchDashboardSummary, activateGoal } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { requestNotificationPermissions, scheduleDailyReminder, sendTestNotification } from '../utils/notifications';
import { getMoodTheme } from '../utils/theme';
import { getRankInfo } from '../utils/stats';

const moods = [
  { icon: 'happy-outline', activeIcon: 'happy', label: 'Great', color: '#10B981', bg: '#D1FAE5' },
  { icon: 'help-circle-outline', activeIcon: 'help-circle', label: 'Good', color: '#F59E0B', bg: '#FEF3C7' },
  { icon: 'sad-outline', activeIcon: 'sad', label: 'Tired', color: '#64748B', bg: '#F1F5F9' },
  { icon: 'flame-outline', activeIcon: 'flame', label: 'Epic', color: '#EF4444', bg: '#FEE2E2' },
];

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const HomeScreen = ({ navigation }) => {
  const { tasks, mood, progress, loading, refreshing, isUpdating, stats, coachMessage, dashboardSummary, dailyFocus, microHabit } = useSelector((state) => state.goals);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchTodayTasks(mood));
    dispatch(fetchStats());
    dispatch(fetchDashboardSummary());
  }, [dispatch, mood]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await dispatch(updateTaskOnServer({ id, status })).unwrap();
      // Background refresh stats without causing full screen jitter
      dispatch(fetchStats()); 
      dispatch(fetchDashboardSummary());
    } catch (error) {
      console.error("Task update failed:", error);
    }
  };

  const handleMoodSelect = (m) => {
    dispatch(setMood(m));
  };

  const onRefresh = React.useCallback(() => {
    dispatch(fetchTodayTasks(mood));
    dispatch(fetchStats());
    dispatch(fetchDashboardSummary());
  }, [dispatch, mood]);






  const handleActivate = (id) => {
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
              <Text style={styles.greetingText}>{getTimeGreeting()}, {rank.name}</Text>
              <Text style={styles.dateLabel}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' })}</Text>
           </View>
           <TouchableOpacity 
             style={[styles.profileButton, { borderColor: currentTheme.secondary + '20' }]}
             onPress={() => {
               Alert.alert(
                 "Notifications Active",
                 "Your daily mission briefing will be sent at 9:00 AM every morning.",
                 [{ text: "Great!" }]
               );
             }}
           >
              <Ionicons name="notifications" size={20} color={currentTheme.primary} />
              {/* Optional: Add badge logic if there are actual new alerts */}
           </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={currentTheme.primary} />
          }
        >
          {stats?.missedYesterday && (
            <LinearGradient
              colors={['#FFF7ED', '#FFEDD5']}
              style={[styles.missedWarning, { borderColor: currentTheme.secondary }]}
            >
              <Ionicons name="warning" size={24} color={theme.colors.accent} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Consistency Insight</Text>
                <Text style={styles.warningText}>You missed yesterday's target. Let's regain the streak today!</Text>
              </View>
            </LinearGradient>
          )}

          <View style={styles.moodSection}>
            <Text style={styles.sectionHeading}>How are you feeling?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodScrollContainer}>
              {moods.map((m) => (
                <TouchableOpacity 
                  key={m.label} 
                  style={[
                    styles.moodCard, 
                    mood === m.label && { 
                      borderColor: m.color, 
                      backgroundColor: m.bg, 
                      transform: [{ scale: 1.05 }] 
                    }
                  ]}
                  onPress={() => handleMoodSelect(m.label)}
                >
                  <View style={[styles.moodIconBg, { backgroundColor: mood === m.label ? theme.colors.white : m.bg }]}>
                    <Ionicons 
                      name={mood === m.label ? m.activeIcon : m.icon} 
                      size={28} 
                      color={m.color} 
                    />
                  </View>
                  <Text style={[styles.moodLabel, { color: mood === m.label ? m.color : theme.colors.textSecondary, fontWeight: mood === m.label ? '800' : '600' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        {dashboardSummary ? (
          <TouchableOpacity 
            style={styles.summaryCard}
            onPress={() => navigation.navigate('GoalDetail', { goalId: dashboardSummary.goalId })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.summaryHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryTopRow}>
                <View style={[styles.mainBadge, { backgroundColor: currentTheme.primary }]}>
                   <Ionicons name="rocket" size={12} color={theme.colors.white} />
                   <Text style={styles.mainBadgeText}>ACTIVE MISSION</Text>
                </View>
                <View style={styles.streakBadge}>
                   <Ionicons name="flame" size={16} color="#FCD34D" />
                   <Text style={styles.streakText}>{dashboardSummary.streakText}</Text>
                </View>
              </View>

              <Text style={styles.summaryTitle} numberOfLines={1}>{dashboardSummary.goalTitle}</Text>
              <Text style={styles.summarySubtitle}>{dashboardSummary.dayStatusText}</Text>

              <View style={styles.progressContainer}>
                 <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>MISSION PROGRESS</Text>
                    <Text style={styles.progressPercentage}>{dashboardSummary.progressPercentage}%</Text>
                 </View>
                 <View style={styles.progressBarBg}>
                    <LinearGradient
                       colors={[currentTheme.primary, currentTheme.secondary]}
                       start={{ x: 0, y: 0 }}
                       end={{ x: 1, y: 0 }}
                       style={[styles.progressBarFill, { width: `${dashboardSummary.progressPercentage}%` }]}
                    />
                 </View>
              </View>

              <View style={styles.statsGrid}>
                 <View style={styles.statBox}>
                    <Text style={styles.statVal}>{dashboardSummary.quickStats?.tasksCompleted || 0}</Text>
                    <Text style={styles.statLab}>Completed</Text>
                 </View>
                 <View style={styles.statDivider} />
                 <View style={styles.statBox}>
                    <Text style={styles.statVal}>{dashboardSummary.quickStats?.daysMissed || 0}</Text>
                    <Text style={styles.statLab}>Missed</Text>
                 </View>
                 <View style={styles.statDivider} />
                 <View style={styles.statBox}>
                    <Text style={styles.statVal}>{dashboardSummary.quickStats?.averageTime || '0m'}</Text>
                    <Text style={styles.statLab}>Avg. Focus</Text>
                 </View>
              </View>
            </LinearGradient>

            <View style={styles.coachInsightModule}>
               <View style={styles.coachHeader}>
                  <View style={[styles.coachIcon, { backgroundColor: currentTheme.primary + '20' }]}>
                     <Ionicons name="sparkles" size={16} color={currentTheme.primary} />
                  </View>
                  <Text style={[styles.coachTitle, { color: currentTheme.primary }]}>COMMANDER'S BRIEFING</Text>
               </View>
               <Text style={styles.coachText}>{dashboardSummary.aiInsight}</Text>
               
               <LinearGradient 
                  colors={[theme.colors.white, '#F8FAFC']}
                  style={[styles.nextActionCard, { borderLeftColor: currentTheme.primary }]}
               >
                  <View style={styles.actionHeader}>
                     <Ionicons name="flash" size={14} color={currentTheme.primary} />
                     <Text style={[styles.actionTag, { color: currentTheme.primary }]}>NEXT OBJECTIVE</Text>
                  </View>
                  <Text style={styles.actionDesc} numberOfLines={2}>{dashboardSummary.primaryAction}</Text>
               </LinearGradient>
            </View>
          </TouchableOpacity>
        ) : loading ? (
          <View style={styles.loadingSummary}>
             <ActivityIndicator size="small" color={currentTheme.primary} />
             <Text style={styles.loadingSummaryText}>Analyzing your progress...</Text>
          </View>
        ) : null}

        <View style={styles.tasksHeader}>
           <Text style={styles.sectionHeading}>Today's Mission</Text>
           {isUpdating && <ActivityIndicator size="small" color={currentTheme.primary} style={{ marginLeft: 10 }} />}
        </View>

        {dailyFocus ? (
          <LinearGradient colors={[currentTheme.primary, currentTheme.darkStart]} style={styles.dailyBriefingCard}>
             <View style={styles.briefingHeader}>
                <Ionicons name="telescope" size={20} color={theme.colors.white} />
                <Text style={styles.briefingTitle}>DAILY DIRECTIVE</Text>
             </View>
             <Text style={styles.briefingText}>{dailyFocus}</Text>
             
             {microHabit && (
               <View style={styles.microHabitBox}>
                  <View style={styles.microHabitIcon}>
                     <Ionicons name="timer-outline" size={16} color={currentTheme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={styles.microHabitLabel}>QUICK START (2 MIN)</Text>
                     <Text style={styles.microHabitText}>{microHabit}</Text>
                  </View>
               </View>
             )}
          </LinearGradient>
        ) : null}

        {tasks && tasks.length === 0 && !loading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.border} />
            <Text style={styles.emptyText}>No flight path for today. Set a new goal!</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={({ item }) => (
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
            )}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
          />
        )}

        {dashboardSummary?.otherGoals?.length > 0 && (
          <View style={styles.otherGoalsSection}>
             <Text style={styles.sectionHeading}>Side Missions</Text>
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
                           <Text style={styles.miniCardBadgeText}>INACTIVE</Text>
                        </View>
                     </View>
                     <Text style={styles.miniGoalTitle} numberOfLines={2}>{g.title}</Text>
                     <Text style={styles.miniGoalMeta}>{g.completedTasks} tasks done</Text>
                     <TouchableOpacity style={styles.activateButton} onPress={() => handleActivate(g._id)}>
                        <Text style={styles.activateButtonText}>Activate</Text>
                     </TouchableOpacity>
                  </TouchableOpacity>
                ))}
             </ScrollView>
          </View>
        )}

        {(tasks && tasks.length > 0) || dashboardSummary ? (
          <TouchableOpacity 
            style={[styles.strategyPreview, { backgroundColor: currentTheme.darkStart || '#1E293B' }]}
            onPress={() => {
              const goalId = dashboardSummary?.goalId || tasks?.[0]?.goalId;
              if (goalId) {
                navigation.navigate('GoalDetail', { goalId });
              }
            }}
          >
             <Ionicons name="map" size={20} color={theme.colors.white} />
             <Text style={styles.strategyLink}>View Full Roadmap & Strategy</Text>
             <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainGradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 5,
  },
  headerInfo: { flex: 1 },
  dateLabel: { 
    fontSize: 12, 
    color: 'rgba(0,0,0,0.4)', 
    fontWeight: '700',
    marginTop: 2,
  },
  greetingText: { fontSize: 22, color: theme.colors.text, fontWeight: '900', letterSpacing: -0.5 },
  mainTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: theme.colors.text, 
    letterSpacing: -1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
    borderWidth: 1.5,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  missedWarning: {
    padding: 18,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    ...theme.shadows.soft,
  },
  warningContent: { marginLeft: 15, flex: 1 },
  warningTitle: { fontSize: 15, fontWeight: '800', color: '#9A3412' },
  warningText: { fontSize: 13, color: '#C2410C', marginTop: 2, lineHeight: 18 },
  
  moodSection: { marginBottom: 20 },
  sectionHeading: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: theme.colors.text, 
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  moodScrollContainer: { paddingLeft: 5, paddingRight: 20, paddingVertical: 2 },
  moodCard: {
    width: 85,
    height: 95,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...theme.shadows.soft,
  },
  moodIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  moodLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  summaryCard: {
    borderRadius: 28,
    backgroundColor: theme.colors.white,
    marginBottom: 20,
    overflow: 'hidden',
    ...theme.shadows.deep,
  },
  summaryHeader: {
    padding: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  mainBadgeText: { fontSize: 8, fontWeight: '900', color: theme.colors.white, letterSpacing: 0.5 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  streakText: { fontSize: 12, fontWeight: '800', color: '#FCD34D' },
  summaryTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.white, marginBottom: 4, letterSpacing: -0.5 },
  summarySubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  
  progressContainer: { marginTop: 15, marginBottom: 15 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  progressLabel: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  progressPercentage: { fontSize: 16, fontWeight: '900', color: theme.colors.white },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontWeight: '900', color: theme.colors.white },
  statLab: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: 1 },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  coachInsightModule: { padding: 25 },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  coachIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  coachTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  coachText: { fontSize: 15, color: theme.colors.text, lineHeight: 24, fontWeight: '500' },
  
  nextActionCard: {
    marginTop: 20,
    padding: 15,
    borderRadius: 20,
    borderLeftWidth: 4,
    ...theme.shadows.soft,
  },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  actionTag: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  actionDesc: { fontSize: 13, fontWeight: '700', color: theme.colors.text, lineHeight: 18 },
  
  tasksHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 15,
  },
  taskCard: {
     backgroundColor: theme.colors.white,
     borderRadius: 24,
     marginBottom: 12,
     padding: 12,
     ...theme.shadows.soft,
     borderWidth: 1,
     borderColor: 'rgba(0,0,0,0.03)',
  },
  taskCardDone: { backgroundColor: '#F8FAFC', opacity: 0.8 },
  taskCardContent: { flexDirection: 'row', alignItems: 'center' },
  taskTypeIndicator: {
     width: 40,
     height: 40,
     borderRadius: 14,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 15,
  },
  taskMainInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  taskDoneText: { textDecorationLine: 'line-through', color: theme.colors.textSecondary },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.border },
  statusToggle: {
     width: 32,
     height: 32,
     borderRadius: 16,
     borderWidth: 2,
     borderColor: 'rgba(0,0,0,0.05)',
     justifyContent: 'center',
     alignItems: 'center',
     marginLeft: 10,
  },
  
  emptyCard: { padding: 60, alignItems: 'center' },
  emptyText: { color: theme.colors.textSecondary, marginTop: 15, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  
  strategyPreview: {
     flexDirection: 'row',
     padding: 18,
     borderRadius: 24,
     alignItems: 'center',
     marginTop: 10,
     marginBottom: 40,
     ...theme.shadows.medium,
     gap: 15,
  },
  strategyLink: { flex: 1, fontSize: 14, fontWeight: '800', color: theme.colors.white },
  
  dailyBriefingCard: {
     padding: 24,
     borderRadius: 32,
     marginBottom: 25,
     ...theme.shadows.deep,
  },
  briefingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  briefingTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  briefingText: { color: theme.colors.white, fontSize: 19, fontWeight: '800', lineHeight: 28, marginBottom: 20 },
  microHabitBox: {
     flexDirection: 'row',
     backgroundColor: 'rgba(255,255,255,0.98)',
     padding: 15,
     borderRadius: 20,
     alignItems: 'center',
     gap: 15,
  },
  microHabitIcon: {
     width: 42, 
     height: 42, 
     borderRadius: 15, 
     backgroundColor: '#F8FAFC',
     justifyContent: 'center', 
     alignItems: 'center'
  },
  microHabitLabel: { fontSize: 10, fontWeight: '900', color: theme.colors.textSecondary, marginBottom: 4 },
  microHabitText: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  
  otherGoalsSection: { marginBottom: 40 },
  miniGoalCard: {
     backgroundColor: theme.colors.white,
     width: 165,
     padding: 20,
     borderRadius: 28,
     marginRight: 15,
     ...theme.shadows.medium,
     borderWidth: 1,
     borderColor: 'rgba(0,0,0,0.03)',
  },
  miniCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  miniCardBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  miniCardBadgeText: { fontSize: 8, fontWeight: '900', color: theme.colors.textSecondary, letterSpacing: 0.5 },
  miniGoalTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 6, height: 42 },
  miniGoalMeta: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 15, fontWeight: '600' },
  activateButton: {
     backgroundColor: '#F8FAFC',
     paddingVertical: 10,
     borderRadius: 14,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#E2E8F0',
  },
  activateButtonText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
});

export default HomeScreen;
