import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchStats } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getRankInfo } from '../utils/stats';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const dispatch = useDispatch();
  const { stats, loading, refreshing } = useSelector((state) => state.goals);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const onRefresh = React.useCallback(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const [activeDay, setActiveDay] = React.useState(null);


  const rank = getRankInfo(stats?.totalCompleted || 0);
  const progressToNext = Math.min((stats?.totalCompleted || 0) / rank.target, 1);
  const maxTotal = Math.max(...(stats?.history?.map(h => h.total) || [1]), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Pilot Profile</Text>
         <TouchableOpacity style={styles.infoButton}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
         </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.secondary} />
        }
      >
        <View style={styles.rankCard}>
           <LinearGradient colors={[theme.colors.primary, '#1E293B']} style={styles.rankBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.rankTop}>
                 <View>
                    <Text style={styles.rankLabel}>CURRENT RANK</Text>
                    <Text style={styles.rankName}>{rank.name}</Text>
                 </View>
                 <View style={styles.rankIconContainer}>
                    <Ionicons name={rank.icon} size={32} color="#F59E0B" />
                 </View>
              </View>
              
              <View style={styles.rankProgress}>
                 <View style={styles.rankProgressInfo}>
                    <Text style={styles.rankNext}>Next: {rank.next}</Text>
                    <Text style={styles.rankNext}>{stats?.totalCompleted || 0} / {rank.target}</Text>
                 </View>
                 <View style={styles.progressBarTrack}>
                    <LinearGradient 
                      colors={['#F59E0B', '#FBBF24']} 
                      style={[styles.progressBarFill, { width: `${progressToNext * 100}%` }]} 
                      start={{ x: 0, y: 0 }} 
                      end={{ x: 1, y: 0 }} 
                    />
                 </View>
              </View>
           </LinearGradient>
        </View>

        <View style={styles.topStats}>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats?.streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
           </View>
           <View style={styles.verticalDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats?.totalCompleted || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
           </View>
           <View style={styles.verticalDivider} />
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(stats?.completionRate || 0)}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Consistency Matrix</Text>
           <Text style={styles.sectionSubtitle}>Your last 7 days of activity</Text>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartArea}>
            {stats?.history?.map((day, index) => {
              const height = day.total > 0 ? (day.completed / maxTotal) * 120 : 0;
              const totalHeight = (day.total / maxTotal) * 120;
              const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              const isToday = new Date(day.date).toDateString() === new Date().toDateString();
              const dateKey = new Date(day.date).toISOString();

              return (
                <TouchableOpacity 
                   key={index} 
                   style={styles.barWrapper} 
                   onPress={() => setActiveDay(activeDay === dateKey ? null : dateKey)}
                   activeOpacity={0.7}
                >
                  {activeDay === dateKey && (
                     <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{day.completed}/{day.total}</Text>
                     </View>
                  )}
                  <View style={styles.barTrack}>
                    <View style={[styles.barTotal, { height: totalHeight }]} />
                    <LinearGradient 
                      colors={isToday ? [theme.colors.secondary, '#60A5FA'] : ['#94A3B8', '#64748B']} 
                      style={[styles.barFill, { height: height }]} 
                    />
                  </View>
                  <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{dayName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.insightBanner}>
           <View style={styles.insightIcon}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
           </View>
           <View style={styles.insightContent}>
              <Text style={styles.insightHeader}>CONSISTENCY TIP</Text>
              <Text style={styles.insightText}>
                {stats?.streak > 3 
                  ? "Elite momentum detected! You're in the top 5% of consistent users. Keep the streak alive."
                  : stats?.streak > 0 
                  ? "Stabilizing focus... Aim for a 5-day streak to unlock advanced roadmap features."
                  : "Every mission starts with day one. Complete your baseline task to initialize your streak."}
              </Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Mission Milestones</Text>
        <View style={styles.milestoneGrid}>
           <View style={[styles.milestoneCard, stats?.totalCompleted >= 5 && styles.activeMilestone]}>
              <View style={styles.milestoneIcon}>
                 <Ionicons name="trophy" size={24} color={stats?.totalCompleted >= 5 ? '#F59E0B' : '#94A3B8'} />
              </View>
              <Text style={styles.milestoneName}>Initiator</Text>
              <Text style={styles.milestoneGoal}>5 Tasks</Text>
           </View>

           <View style={[styles.milestoneCard, stats?.streak >= 3 && styles.activeMilestone]}>
              <View style={styles.milestoneIcon}>
                 <Ionicons name="flash" size={24} color={stats?.streak >= 3 ? '#F59E0B' : '#94A3B8'} />
              </View>
              <Text style={styles.milestoneName}>Supercharged</Text>
              <Text style={styles.milestoneGoal}>3 Day Streak</Text>
           </View>

           <View style={[styles.milestoneCard, stats?.totalCompleted >= 50 && styles.activeMilestone]}>
              <View style={styles.milestoneIcon}>
                 <Ionicons name="ribbon" size={24} color={stats?.totalCompleted >= 50 ? '#F59E0B' : '#94A3B8'} />
              </View>
              <Text style={styles.milestoneName}>Commander</Text>
              <Text style={styles.milestoneGoal}>50 Tasks</Text>
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 20,
     paddingVertical: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.text, letterSpacing: -1 },
  infoButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 20 },
  topStats: { 
     flexDirection: 'row', 
     justifyContent: 'space-around', 
     marginBottom: 30,
     backgroundColor: theme.colors.white,
     paddingVertical: 20,
     borderRadius: 20,
     borderWidth: 1,
     borderColor: theme.colors.border,
     ...theme.shadows.soft,
  },
  statBox: { alignItems: 'center', flex: 1 },
  verticalDivider: { width: 1, height: '80%', backgroundColor: theme.colors.border },
  statValue: { fontSize: 24, fontWeight: '900', color: theme.colors.text },
  statLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 4 },
  rankCard: {
     marginBottom: 25,
     borderRadius: 24,
     overflow: 'hidden',
     ...theme.shadows.medium,
  },
  rankBackground: { padding: 25 },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  rankLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  rankName: { color: theme.colors.white, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  rankIconContainer: {
     width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)',
     justifyContent: 'center', alignItems: 'center',
     borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  rankProgressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rankNext: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  progressBarTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  tooltip: {
     position: 'absolute', top: -35, backgroundColor: theme.colors.text, 
     paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
     zIndex: 10,
  },
  tooltipText: { color: theme.colors.white, fontSize: 12, fontWeight: '700' },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  sectionSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  chartCard: {
     backgroundColor: theme.colors.white,
     borderRadius: 24,
     padding: 24,
     marginBottom: 30,
     ...theme.shadows.soft,
     borderWidth: 1,
     borderColor: theme.colors.border,
  },
  chartArea: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-end',
     height: 160,
  },
  barWrapper: { alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: {
     width: 14,
     height: 120,
     backgroundColor: '#F1F5F9',
     borderRadius: 7,
     justifyContent: 'flex-end',
     overflow: 'hidden',
  },
  barTotal: { width: '100%', backgroundColor: '#E2E8F0', position: 'absolute' },
  barFill: { width: '100%', borderRadius: 7 },
  dayLabel: { marginTop: 12, fontSize: 10, color: theme.colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  todayLabel: { color: theme.colors.secondary },
  insightBanner: {
     flexDirection: 'row',
     backgroundColor: '#FFFBEB',
     padding: 20,
     borderRadius: 24,
     borderWidth: 1,
     borderColor: '#FEF3C7',
     marginBottom: 30,
     gap: 15,
  },
  insightIcon: {
     width: 40,
     height: 40,
     borderRadius: 12,
     backgroundColor: '#FEF3C7',
     justifyContent: 'center',
     alignItems: 'center',
  },
  insightContent: { flex: 1 },
  insightHeader: { fontSize: 10, fontWeight: '900', color: '#B45309', letterSpacing: 0.5 },
  insightText: { fontSize: 14, color: '#92400E', lineHeight: 20, marginTop: 4, fontWeight: '500' },
  milestoneGrid: { flexDirection: 'row', gap: 12, marginTop: 15, marginBottom: 40 },
  milestoneCard: {
     flex: 1,
     backgroundColor: theme.colors.white,
     borderRadius: 20,
     padding: 15,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: theme.colors.border,
     opacity: 0.5,
  },
  activeMilestone: { opacity: 1, borderColor: theme.colors.secondary, backgroundColor: '#F0F9FF' },
  milestoneIcon: { marginBottom: 8 },
  milestoneName: { fontSize: 10, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  milestoneGoal: { fontSize: 9, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 2 },
});

export default ProgressScreen;
