import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createGoalWithAI, fetchTodayTasks, fetchDashboardSummary, fetchStats } from '../redux/slices/goalSlice';
import { theme } from '../constants';
import { getMoodTheme } from '../utils/theme';

const GoalSetupScreen = ({ navigation }) => {
  const [goal, setGoal] = useState('');
  const [goalType, setGoalType] = useState('Career');
  const [dailyTime, setDailyTime] = useState('1 hr');
  const [customHours, setCustomHours] = useState('1');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [activeInput, setActiveInput] = useState(null);
  
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        setTargetDate(selectedDate.toISOString().split('T')[0]);
      }
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  const confirmIosDate = () => {
    setTargetDate(tempDate.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Select Target Date";
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
  };
  
  const { loading, isGenerating, mood } = useSelector((state) => state.goals);
  const dispatch = useDispatch();
  
  const currentTheme = getMoodTheme(mood);

  const handleGenerate = async () => {
    if (!goal.trim() || !targetDate.trim()) {
      Alert.alert("Error", "Please fill in all fields!");
      return;
    }

    Keyboard.dismiss();

    try {
      const finalDailyTime = dailyTime === 'Custom' 
        ? `${customHours || '0'}h ${customMinutes || '0'}m` 
        : dailyTime;

      await dispatch(createGoalWithAI({ 
        title: goal, 
        goalType, 
        dailyTime: finalDailyTime, 
        targetDate,
        skillLevel
      })).unwrap();
      
      // Refresh stats and dashboard data immediately
      await Promise.all([
        dispatch(fetchTodayTasks(mood)),
        dispatch(fetchDashboardSummary()),
        dispatch(fetchStats())
      ]);

      // Auto-redirect on success
      navigation.navigate('MainTabs', { screen: 'Home' });
      
    } catch (error) {
      Alert.alert("Error", `Failed to generate: ${error.message}`);
    }
  };

  const types = [
    { label: 'Career', icon: 'briefcase' },
    { label: 'Fitness', icon: 'fitness' },
    { label: 'Personal', icon: 'person' },
    { label: 'Study', icon: 'book' }
  ];
  const times = ['30 min', '1 hr', '2 hr', 'Custom'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <LinearGradient
      colors={currentTheme.gradient}
      style={styles.mainGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.innerContainer}>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>New Goal</Text>
                  <View style={{ width: 44 }} />
                </View>

                <View style={styles.iconHeading}>
                   <View style={[styles.glowContainer, { shadowColor: currentTheme.secondary }]}>
                     <LinearGradient colors={[currentTheme.secondary, currentTheme.accent]} style={styles.roundedIcon}>
                        <Ionicons name="rocket" size={42} color={theme.colors.white} />
                     </LinearGradient>
                   </View>
                   <Text style={[styles.title, { color: currentTheme.darkStart }]}>Define Your Mission</Text>
                   <Text style={styles.subtitle}>AI will generate a custom flight path for your goal</Text>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.label}>Achievement Goal</Text>
                  <View style={[
                    styles.inputWrapper, 
                    { borderColor: currentTheme.primary + '30' },
                    activeInput === 'goal' && { borderColor: currentTheme.primary, borderWidth: 1.5, shadowOpacity: 0.1 }
                  ]}>
                    <Ionicons name="flag-outline" size={20} color={currentTheme.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Master React Native"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={goal}
                      onChangeText={setGoal}
                      onFocus={() => setActiveInput('goal')}
                      onBlur={() => setActiveInput(null)}
                    />
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.label}>Target Deadline</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setActiveInput('date');
                      if (targetDate) setTempDate(new Date(targetDate));
                      setShowDatePicker(true);
                    }} 
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.inputWrapper, 
                      { borderColor: currentTheme.primary + '30' },
                      activeInput === 'date' && { borderColor: currentTheme.primary, borderWidth: 1.5, shadowOpacity: 0.1 }
                    ]}>
                      <Ionicons name="calendar-outline" size={20} color={currentTheme.primary} style={styles.inputIcon} />
                      <Text style={[styles.input, !targetDate && { color: theme.colors.textSecondary }, { paddingVertical: 18 }]}>
                        {formatDate(targetDate)}
                      </Text>
                      {targetDate ? (
                         <View style={{ backgroundColor: currentTheme.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <Text style={{ fontSize: 10, color: currentTheme.primary, fontWeight: '800' }}>{Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24))} DAYS</Text>
                         </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Android Picker */}
                  {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                      value={targetDate ? new Date(targetDate) : new Date()}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={handleDateChange}
                    />
                  )}

                  {/* iOS Modal Picker */}
                  <Modal visible={showDatePicker && Platform.OS === 'ios'} transparent animationType="slide">
                    <View style={styles.iosModalOverlay}>
                      <View style={styles.iosDatePickerContainer}>
                        <View style={styles.iosHeader}>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={styles.iosCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <Text style={styles.iosHeaderText}>Select Deadline</Text>
                          <TouchableOpacity onPress={confirmIosDate}>
                            <Text style={[styles.iosDoneText, { color: currentTheme.primary }]}>Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          display="inline"
                          minimumDate={new Date()}
                          onChange={handleDateChange}
                          themeVariant="light"
                          style={{ height: 320 }}
                        />
                      </View>
                    </View>
                  </Modal>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.label}>Mission Category</Text>
                  <View style={styles.grid}>
                    {types.map(t => (
                      <TouchableOpacity 
                        key={t.label} 
                        style={[styles.typeButton, goalType === t.label ? { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary } : { borderColor: theme.colors.border }]}
                        onPress={() => setGoalType(t.label)}
                      >
                        <Ionicons name={t.icon} size={20} color={goalType === t.label ? theme.colors.white : theme.colors.textSecondary} />
                        <Text style={[styles.typeText, goalType === t.label && styles.activeTypeText]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.rowSection}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Daily Time Availability</Text>
                    <View style={styles.selectorRow}>
                      {times.map(t => (
                        <TouchableOpacity 
                          key={t} 
                          style={[
                            styles.smallChip, 
                            dailyTime === t && { backgroundColor: currentTheme.secondary, borderColor: currentTheme.secondary }
                          ]}
                          onPress={() => setDailyTime(t)}
                        >
                          <Text style={[styles.smallChipText, dailyTime === t && styles.activeSmallChipText]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {dailyTime === 'Custom' && (
                      <View style={styles.customTimeContainer}>
                        <View style={styles.customTimeRow}>
                          <View style={styles.customInputGroup}>
                            <Text style={styles.customInputLabel}>Hours</Text>
                            <TextInput
                              style={[styles.customInput, { borderColor: currentTheme.primary + '40' }]}
                              keyboardType="number-pad"
                              value={customHours}
                              onChangeText={setCustomHours}
                              maxLength={2}
                            />
                          </View>
                          <View style={styles.customInputGroup}>
                            <Text style={styles.customInputLabel}>Minutes</Text>
                            <TextInput
                              style={[styles.customInput, { borderColor: currentTheme.primary + '40' }]}
                              keyboardType="number-pad"
                              value={customMinutes}
                              onChangeText={setCustomMinutes}
                              maxLength={2}
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.label}>Current Skill Level</Text>
                  <View style={styles.selectorRow}>
                    {levels.map(l => (
                      <TouchableOpacity 
                        key={l} 
                        style={[styles.chip, skillLevel === l && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                        onPress={() => setSkillLevel(l)}
                      >
                        <Text style={[styles.chipText, skillLevel === l && styles.activeChipText]}>{l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  style={[
                    styles.mainButton, 
                    (!goal.trim() || !targetDate || isGenerating) ? styles.buttonDisabled : { backgroundColor: currentTheme.secondary }
                  ]} 
                  onPress={handleGenerate}
                  disabled={!goal.trim() || !targetDate || isGenerating}
                  activeOpacity={0.8}
                >
                  {isGenerating ? (
                    <Text style={styles.mainButtonText}>Generating...</Text>
                  ) : (
                    <>
                      <Text style={styles.mainButtonText}>Initialize AI Roadmap</Text>
                      <Ionicons name="sparkles" size={20} color={theme.colors.white} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={() => navigation.navigate('MainTabs')}
                >
                  <Text style={styles.skipText}>Configure later in Dashboard</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Immersive Loading Overlay */}
        <Modal visible={loading || isGenerating} transparent animationType="fade">
          <LinearGradient
            colors={[currentTheme.darkStart, currentTheme.primary]}
            style={styles.loadingOverlay}
          >
             <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={theme.colors.white} style={{ transform: [{ scale: 1.5 }] }} />
                <Text style={styles.loadingTitle}>Preparing Your Flight Plan...</Text>
                <Text style={styles.loadingSubtitle}>AI is analyzing your mission parameters</Text>
             </View>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainGradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  scrollContainer: { paddingBottom: 40 },
  innerContainer: { padding: 25 },
  header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 30,
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
  iconHeading: {
     alignItems: 'center',
     marginBottom: 45,
  },
  glowContainer: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  roundedIcon: {
     width: 100,
     height: 100,
     borderRadius: 40,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 25,
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.5)',
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
     fontSize: 14,
     color: theme.colors.textSecondary,
     textAlign: 'center',
     marginTop: 8,
     paddingHorizontal: 20,
  },
  formSection: { width: '100%', marginBottom: 25 },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
    marginLeft: 2,
  },
  inputWrapper: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.9)',
     borderRadius: 24,
     paddingHorizontal: 20,
     height: 65,
     shadowColor: "#000",
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.05,
     shadowRadius: 10,
     elevation: 5,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  grid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 12,
  },
  typeButton: {
     width: '48%',
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.9)',
     padding: 18,
     borderRadius: 22,
     gap: 12,
     shadowColor: "#000",
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.05,
     shadowRadius: 10,
     elevation: 3,
     borderWidth: 0,
  },
  typeText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  activeTypeText: { color: theme.colors.white },
  selectorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    minWidth: 90,
    alignItems: 'center',
  },
  activeChip: {},
  chipText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
  activeChipText: { color: theme.colors.white },
  smallChip: {
     backgroundColor: theme.colors.white,
     paddingVertical: 8,
     paddingHorizontal: 12,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: theme.colors.border,
  },
  activeSmallChip: {},
  smallChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  activeSmallChipText: { color: theme.colors.white },
  mainButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
    ...theme.shadows.medium,
  },
  mainButtonText: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
  buttonDisabled: { backgroundColor: '#CBD5E1', opacity: 1, elevation: 0, shadowOpacity: 0 },
  customTimeContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  customTimeRow: {
    flexDirection: 'row',
    gap: 20,
  },
  customInputGroup: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  customInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    height: 45,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    borderWidth: 1,
  },
  skipButton: { marginTop: 25, alignItems: 'center' },
  skipText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  loadingContent: {
    alignItems: 'center',
    padding: 30,
  },
  loadingTitle: {
    color: theme.colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 25,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  loadingSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  },
  iosModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  iosDatePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  iosCancelText: { fontSize: 16, color: '#888' },
  iosHeaderText: { fontSize: 16, fontWeight: '700', color: '#000' },
  iosDoneText: { fontSize: 16, fontWeight: '700' }
});

export default GoalSetupScreen;
