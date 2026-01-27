import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, SafeAreaView, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fetchStats } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getRankInfo } from '../utils/stats';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const dispatch = useDispatch();
  const { stats, loading, refreshing } = useSelector((state) => state.goals);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    dispatch(fetchStats());
    Animated.parallel([
       Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
       Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true })
    ]).start();
  }, [dispatch]);

  const onRefresh = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(fetchStats());
  }, [dispatch]);

  const [activeCell, setActiveCell] = React.useState(null);

  const rank = getRankInfo(stats?.totalCompleted || 0);
  const progressToNext = Math.min((stats?.totalCompleted || 0) / rank.target, 1);

  const matrixData = React.useMemo(() => {
    const historicalData = stats?.history || [];
    const paddedData = [...Array(28)].map((_, i) => {
      const dataIndex = historicalData.length - 1 - i;
      return dataIndex >= 0 ? historicalData[dataIndex] : null;
    }).reverse();
    return paddedData;
  }, [stats?.history]);

  const milestones = [
    { id: 1, name: 'Initiator', goal: 5, icon: 'trophy', achieved: (stats?.totalCompleted >= 5) },
    { id: 2, name: 'Supercharged', goal: 10, icon: 'flash', achieved: (stats?.streak >= 3) },
    { id: 3, name: 'Strategist', goal: 25, icon: 'map', achieved: (stats?.totalCompleted >= 25) },
    { id: 4, name: 'Commander', goal: 50, icon: 'ribbon', achieved: (stats?.totalCompleted >= 50) },
    { id: 5, name: 'Legend', goal: 100, icon: 'star', achieved: (stats?.totalCompleted >= 100) },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Pilot Command</Text>
         <TouchableOpacity style={styles.infoButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
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
        {/* Elite Rank Module */}
        <Animated.View style={[styles.rankCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
           <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.rankBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.rankTop}>
                 <View>
                    <Text style={styles.rankLabel}>OPERATIONAL RANK</Text>
                    <Text style={styles.rankName}>{rank.name}</Text>
                 </View>
                 <View style={styles.rankIconContainer}>
                    <Ionicons name={rank.icon} size={32} color="#F59E0B" />
                 </View>
              </View>
              
              <View style={styles.rankProgress}>
                 <View style={styles.rankProgressInfo}>
                    <Text style={styles.rankNext}>Level Progress</Text>
                    <Text style={styles.rankNext}>{stats?.totalCompleted || 0} / {rank.target} Missions</Text>
                 </View>
                 <View style={styles.progressBarTrack}>
                    <LinearGradient 
                      colors={['#38BDF8', '#0EA5E9']} 
                      style={[styles.progressBarFill, { width: `${progressToNext * 100}%` }]} 
                      start={{ x: 0, y: 0 }} 
                      end={{ x: 1, y: 0 }} 
                    />
                 </View>
              </View>
           </LinearGradient>
        </Animated.View>

        {/* Primary Stats Panel */}
        <Animated.View style={[styles.topStats, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
           <View style={styles.statBox}>
              <Ionicons name="flame" size={20} color="#F59E0B" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{stats?.streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
           </View>
           <View style={styles.verticalDivider} />
           <View style={styles.statBox}>
              <Ionicons name="checkmark-done-circle" size={20} color="#10B981" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{stats?.totalCompleted || 0}</Text>
              <Text style={styles.statLabel}>Missions</Text>
           </View>
           <View style={styles.verticalDivider} />
           <View style={styles.statBox}>
              <Ionicons name="speedometer" size={20} color="#38BDF8" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>{Math.round(stats?.completionRate || 0)}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
           </View>
        </Animated.View>

        {/* Tactical Consistency Matrix */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Consistency Matrix</Text>
              <Text style={styles.sectionSubtitle}>Last 28-day mission performance</Text>
           </View>

           <View style={styles.matrixCard}>
             <View style={styles.matrixHeader}>
               {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                 <Text key={i} style={styles.matrixDayLabel}>{day}</Text>
               ))}
             </View>
             <View style={styles.gridContainer}>
               {matrixData.map((day, index) => {
                 const intensity = day ? (day.total > 0 ? day.completed / day.total : 0) : 0;
                 const dateLabel = day ? new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Data';
                 
                 return (
                   <TouchableOpacity 
                     key={index}
                     onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setActiveCell(activeCell === index ? null : index);
                     }}
                     style={[
                       styles.gridCell,
                       day && { 
                         backgroundColor: intensity > 0.8 ? '#0EA5E9' : 
                                        intensity > 0.5 ? '#38BDF8A0' : 
                                        intensity > 0 ? '#38BDF840' : '#F1F5F9' 
                       },
                       activeCell === index && styles.activeCell
                     ]}
                   >
                     {activeCell === index && (
                       <View style={styles.gridTooltip}>
                         <View style={styles.tooltipPointer} />
                         <Text style={styles.tooltipDate}>{dateLabel}</Text>
                         <Text style={styles.tooltipStats}>{day ? `${day.completed}/${day.total}` : '0/0'}</Text>
                       </View>
                     )}
                   </TouchableOpacity>
                 );
               })}
             </View>
             <View style={styles.gridLegend}>
               <Text style={styles.legendLabel}>Dormant</Text>
               <View style={[styles.legendBox, { backgroundColor: '#F1F5F9' }]} />
               <View style={[styles.legendBox, { backgroundColor: '#38BDF840' }]} />
               <View style={[styles.legendBox, { backgroundColor: '#38BDF8A0' }]} />
               <View style={[styles.legendBox, { backgroundColor: '#0EA5E9' }]} />
               <Text style={styles.legendLabel}>Peak</Text>
             </View>
           </View>
        </Animated.View>

        {/* Dynamic Milestones Roadmap */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
           <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mission Milestones</Text>
              <Text style={styles.sectionSubtitle}>Your progression towards legend status</Text>
           </View>

           <View style={styles.roadmapContainer}>
             {milestones.map((m, index) => (
               <View key={m.id} style={styles.milestoneRow}>
                 <View style={styles.milestoneLeft}>
                   <View style={[
                     styles.milestoneIconOuter,
                     m.achieved && { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }
                   ]}>
                     <Ionicons 
                       name={m.achieved ? m.icon : 'lock-closed'} 
                       size={22} 
                       color={m.achieved ? theme.colors.primary : '#94A3B8'} 
                     />
                   </View>
                   {index < milestones.length - 1 && (
                     <View style={[styles.roadmapLine, m.achieved && milestones[index+1].achieved && { backgroundColor: theme.colors.primary }]} />
                   )}
                 </View>
                 <View style={styles.milestoneContent}>
                   <Text style={[styles.milestoneText, !m.achieved && { color: '#94A3B8' }]}>{m.name}</Text>
                   <Text style={styles.milestoneTarget}>{m.goal} {m.id === 2 ? 'Day Streak' : m.id === 3 ? 'AI Missions' : 'Tasks'}</Text>
                 </View>
                 {m.achieved && (
                   <View style={styles.achievedBadge}>
                     <Ionicons name="checkmark" size={12} color="#FFF" />
                   </View>
                 )}
               </View>
             ))}
           </View>
        </Animated.View>

        <View style={{ height: 40 }} />
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
     paddingHorizontal: 25,
     paddingVertical: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: '950', color: theme.colors.text, letterSpacing: -1.2 },
  infoButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 25 },
  rankCard: {
     marginBottom: 30,
     borderRadius: 30,
     overflow: 'hidden',
     ...theme.shadows.deep,
  },
  rankBackground: { padding: 30 },
  rankTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  rankLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 5 },
  rankName: { color: theme.colors.white, fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
  rankIconContainer: {
     width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
     justifyContent: 'center', alignItems: 'center',
     borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)'
  },
  rankProgress: {},
  rankProgressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rankNext: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  progressBarTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
  topStats: { 
     flexDirection: 'row', 
     justifyContent: 'space-around', 
     marginBottom: 35,
     backgroundColor: theme.colors.white,
     paddingVertical: 25,
     borderRadius: 25,
     borderWidth: 1.5,
     borderColor: 'rgba(15, 23, 42, 0.05)',
     ...theme.shadows.soft,
  },
  statBox: { alignItems: 'center', flex: 1 },
  verticalDivider: { width: 1.5, height: '60%', backgroundColor: 'rgba(15, 23, 42, 0.08)' },
  statValue: { fontSize: 26, fontWeight: '950', color: theme.colors.text, letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 4 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, fontWeight: '500' },
  matrixCard: {
     backgroundColor: theme.colors.white,
     borderRadius: 30,
     padding: 20,
     marginBottom: 35,
     borderWidth: 1.5,
     borderColor: 'rgba(15, 23, 42, 0.05)',
     ...theme.shadows.soft,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  matrixDayLabel: {
    width: (width - 130) / 7,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 8,
     justifyContent: 'center',
  },
  gridCell: {
     width: (width - 136) / 7,
     height: (width - 136) / 7,
     borderRadius: 6,
     backgroundColor: '#F8FAFC',
     borderWidth: 1,
     borderColor: 'rgba(15, 23, 42, 0.03)',
  },
  activeCell: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    transform: [{ scale: 1.1 }],
    zIndex: 100,
  },
  gridTooltip: {
    position: 'absolute',
    bottom: '140%',
    left: '50%',
    marginLeft: -45, 
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: 90,
    alignItems: 'center',
    ...theme.shadows.deep,
    zIndex: 1000,
  },
  tooltipPointer: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: '#0F172A',
    transform: [{ rotate: '45deg' }],
  },
  tooltipDate: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700' },
  tooltipStats: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: 2 },
  gridLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 6,
  },
  legendLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginHorizontal: 4 },
  legendBox: { width: 12, height: 12, borderRadius: 3 },
  roadmapContainer: {
    backgroundColor: theme.colors.white,
    padding: 25,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    ...theme.shadows.soft,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    height: 75,
  },
  milestoneLeft: {
    alignItems: 'center',
    height: '100%',
  },
  milestoneIconOuter: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  roadmapLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  milestoneContent: {
    flex: 1,
    paddingTop: 5,
  },
  milestoneText: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  milestoneTarget: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 4 },
  achievedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
});

export default ProgressScreen;
