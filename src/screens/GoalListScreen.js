import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchAllGoals } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getMoodTheme } from '../utils/theme';

const GoalListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { goalsList, loading, mood } = useSelector((state) => state.goals);
  
  const currentTheme = getMoodTheme(mood);

  useEffect(() => {
    dispatch(fetchAllGoals());
  }, [dispatch]);

  const renderItem = ({ item }) => {
    const progress = Math.round((item.completedTasks / (item.totalTasks || 1)) * 100);
    
    return (
      <TouchableOpacity 
        style={[styles.goalCard, { borderColor: currentTheme.secondary, borderWidth: 1 }]}
        onPress={() => navigation.navigate('GoalDetail', { goalId: item._id })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[currentTheme.cardBg, currentTheme.cardBg]} // Keep cards fairly neutral but consistent
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
             <View style={[styles.iconContainer, { backgroundColor: currentTheme.primary + '20' }]}>
                <Ionicons 
                   name={item.goalType === 'Career' ? 'briefcase' : item.goalType === 'Fitness' ? 'fitness' : 'star'} 
                   size={20} 
                   color={currentTheme.primary} 
                />
             </View>
             <View style={styles.titleSection}>
                <Text style={styles.goalTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.goalType}>{item.goalType} Mission</Text>
             </View>
             <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
               <Text style={styles.progressLabel}>Strategy Completion</Text>
               <Text style={[styles.progressPercent, { color: currentTheme.primary }]}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: currentTheme.primary }]} />
            </View>
          </View>

          <View style={styles.cardFooter}>
             <View style={styles.footerItem}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.footerText}>{item.totalDays} Days</Text>
             </View>
             <View style={styles.footerItem}>
                <Ionicons name="list-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.footerText}>{item.completedTasks}/{item.totalTasks} Tasks</Text>
             </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.mainGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
           <Text style={styles.headerTitle}>Mission Control</Text>
        </View>

        <View style={styles.container}>
          {loading && goalsList.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={currentTheme.secondary} />
              <Text style={styles.loadingText}>Fetching active missions...</Text>
            </View>
          ) : (
            <FlatList
              data={goalsList}
              renderItem={renderItem}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Image source={require('../../assets/images/logo.png')} style={styles.emptyLogo} />
                  <Text style={styles.emptyText}>Your flight path is empty.</Text>
                  <TouchableOpacity style={[styles.createBtn, { backgroundColor: currentTheme.secondary }]} onPress={() => navigation.navigate('GoalSetup')}>
                     <Text style={styles.createBtnText}>Initialize New Mission</Text>
                  </TouchableOpacity>
                </View>
              }
              refreshing={loading}
              onRefresh={() => dispatch(fetchAllGoals())}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainGradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 20,
     paddingVertical: 15,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: theme.colors.text, letterSpacing: -1 },
  container: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  goalCard: {
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: theme.colors.white,
    ...theme.shadows.medium,
    overflow: 'hidden',
  },
  cardGradient: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: {
     width: 44,
     height: 44,
     borderRadius: 14,
     backgroundColor: '#EFF6FF',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 15,
  },
  titleSection: { flex: 1 },
  goalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  goalType: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  progressSection: { marginBottom: 20 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  progressPercent: { fontSize: 14, fontWeight: '800', color: theme.colors.secondary },
  progressBar: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: theme.colors.secondary, borderRadius: 4 },
  cardFooter: {
     flexDirection: 'row',
     gap: 20,
     paddingTop: 15,
     borderTopWidth: 1,
     borderTopColor: '#F1F5F9',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: theme.colors.textSecondary, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyLogo: { width: 100, height: 100, opacity: 0.2, marginBottom: 20 },
  emptyText: { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  createBtn: {
     marginTop: 25,
     backgroundColor: theme.colors.secondary,
     paddingVertical: 15,
     paddingHorizontal: 30,
     borderRadius: 15,
  },
  createBtnText: { color: theme.colors.white, fontWeight: '800', fontSize: 14 }
});

export default GoalListScreen;
