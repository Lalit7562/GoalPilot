import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Animated, Image, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants';
import { logout } from '../redux/slices/goalSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, stats } = useSelector(state => state.goals);

  const handleLogout = () => {
    dispatch(logout());
    // Navigation automatically handles the redirect because of the auth stack switch in AppNavigator
  };

  const StatCard = ({ icon, label, value, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={50} color={theme.colors.primary} />
            )}
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'GoalPilot User'}</Text>
          <Text style={styles.emailText}>{user?.email || 'pilot@google.com'}</Text>
          <Text style={styles.statusBadge}>ELITE PILOT</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            icon="flame" 
            label="Day Streak" 
            value={stats?.streak || 0} 
            color="#F59E0B" 
          />
          <StatCard 
            icon="checkbox" 
            label="Completed" 
            value={stats?.totalCompleted || 0} 
            color="#10B981" 
          />
          <StatCard 
            icon="trophy" 
            label="Rank" 
            value="Novice" 
            color={theme.colors.primary} 
          />
          <StatCard 
            icon="time" 
            label="Avg. Time" 
            value="35m" 
            color="#6366F1" 
          />
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
            <Text style={styles.menuText}>Account Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
            <Text style={styles.menuText}>Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Alert.alert(
                "Help & Feedback",
                "Need help or have feedback? Reach out to us at support@goalpilot.com or join our Discord community.",
                [{ text: "OK" }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={22} color={theme.colors.text} />
            <Text style={styles.menuText}>Help & Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.accent} />
          <Text style={styles.logoutText}>Sign Out from Mission</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>GoalPilot v1.0.2</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
    marginBottom: 20,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  emailText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: theme.colors.primary + '20',
    color: theme.colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.white,
    padding: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: theme.colors.white,
    borderRadius: 25,
    padding: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '50',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent + '10',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.accent + '20',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  }
});

export default ProfileScreen;
