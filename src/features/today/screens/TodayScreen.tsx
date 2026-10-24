import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { useHealthStore } from '@/features/health/state/health-store';
import { useWealthStore } from '@/features/wealth/state/wealth-store';
import { useJobStore } from '@/features/career/state/job-store';
import { WeatherService, WeatherData } from '@/core/utils/weather-service';
import { PedometerService } from '@/core/native-bridges/pedometer-adapter';
import { AIService } from '@/core/utils/ai-service';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { VaultSettingsModal } from '@/features/auth/components/VaultSettingsModal';

interface DailyTask {
  id: string;
  title: string;
  done: boolean;
}

const STORAGE_KEY_TASKS = '@personal_app:daily_tasks_v2';

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  // Live Store Bindings
  const todaySteps = useHealthStore((s) => s.todaySteps);
  const stepGoal = useHealthStore((s) => s.stepGoal);
  const caloriesBurned = useHealthStore((s) => s.caloriesBurnedKcal);
  const waterMl = useHealthStore((s) => s.waterIntakeMl);
  const waterGoal = useHealthStore((s) => s.waterGoalMl);
  const addLiveSteps = useHealthStore((s) => s.addLiveSteps);
  const setTodaySteps = useHealthStore((s) => s.setTodaySteps);

  const loans = useWealthStore((s) => s.loans);
  const activeLoans = loans.filter((l) => l.status === 'active');
  const activeLoan = activeLoans[0];

  const jobs = useJobStore((s) => s.jobs);
  const upcomingInterviewJob = jobs.find((j) => j.interviews && j.interviews.length > 0);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const userName = user?.name ? user.name.split(' ')[0] : 'Bharathi';

  // Dynamic Date and Greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Dynamic Briefing
  const [aiBriefing, setAiBriefing] = useState<string>('Generating your morning executive briefing...');

  // Tasks with persistence
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddTaskModalVisible, setIsAddTaskModalVisible] = useState(false);
  const [isVaultSettingsVisible, setIsVaultSettingsVisible] = useState(false);

  // Load weather, pedometer, and persistent tasks on mount
  useEffect(() => {
    // 1. Fetch live weather
    WeatherService.getCurrentWeather('Chennai').then((res) => {
      if (res) setWeather(res);
    });

    // 2. Hardware pedometer sync
    let unsubscribePedometer: (() => void) | null = null;
    PedometerService.checkAvailability().then(({ isAvailable, permissionGranted }) => {
      if (isAvailable && permissionGranted) {
        PedometerService.getTodaySteps().then((realSteps) => {
          if (realSteps > 0) setTodaySteps(realSteps);
        });
        unsubscribePedometer = PedometerService.subscribeLiveSteps((delta) => {
          addLiveSteps(delta);
        });
      }
    });

    // 3. Load saved tasks
    AsyncStorage.getItem(STORAGE_KEY_TASKS).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
            return;
          }
        } catch {}
      }
      setTasks([]);
    });

    return () => {
      if (unsubscribePedometer) unsubscribePedometer();
    };
  }, []);

  // Update AI Briefing when metrics change
  useEffect(() => {
    AIService.generateDailyBriefing({
      steps: todaySteps,
      stepGoal,
      waterMl,
      waterGoal,
      activeLoanCount: activeLoans.length,
      nearestDueDate: activeLoan?.dueDayOfMonth,
      upcomingJob: upcomingInterviewJob?.companyName,
    }).then((briefing) => {
      setAiBriefing(briefing);
    });
  }, [todaySteps, activeLoans.length, upcomingInterviewJob?.companyName]);

  const saveTasks = (newTasks: DailyTask[]) => {
    setTasks(newTasks);
    AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks)).catch(() => {});
  };

  const toggleTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const updated: DailyTask[] = [
      ...tasks,
      { id: Date.now().toString(), title: newTaskTitle.trim(), done: false },
    ];
    saveTasks(updated);
    setNewTaskTitle('');
    setIsAddTaskModalVisible(false);
  };

  const handleJoinCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const link = upcomingInterviewJob?.interviews[0]?.meetLink || 'https://meet.google.com';
    Alert.alert(
      'Join Interview Call 📹',
      `Launching Google Meet for ${upcomingInterviewJob?.companyName || 'Scheduled'} interview...\nLink: ${link}`
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
            <View style={styles.subHeaderRow}>
              <Text style={styles.subDate}>{formattedDate} • Life OS</Text>
              {weather && (
                <View style={styles.weatherBadge}>
                  <Text style={styles.weatherText}>⛅ {weather.tempCelsius}°C {weather.city}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                Alert.alert('Lock Vault 🔒', 'Lock your personal session?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Lock App', onPress: () => signOut() },
                ]);
              }}
            >
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                const alertMsg = activeLoan
                  ? `1. ${activeLoan.lenderName} vatti ${formatINR(activeLoan.monthlyInterestAmount)} due on ${activeLoan.dueDayOfMonth}th!\n2. Target: Walk ${stepGoal.toLocaleString()} steps today.`
                  : `1. You are debt free! All loans clear.\n2. Target: Walk ${stepGoal.toLocaleString()} steps today.`;
                Alert.alert('Today Alerts 🔔', alertMsg);
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Executive Daily Briefing Card */}
        <GlassCard variant="highlight" style={styles.briefingCard}>
          <View style={styles.briefingHeader}>
            <Badge label="AI Executive Briefing" variant="purple" />
            <Text style={styles.briefingTime}>Live Engine</Text>
          </View>
          <Text style={styles.briefingText}>{aiBriefing}</Text>
        </GlassCard>

        {/* Quick Health Summary Rings */}
        <View style={styles.metricsRow}>
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="footsteps-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{todaySteps.toLocaleString('en-IN')}</Text>
            <Text style={styles.metricLabel}>Steps ({Math.min(100, Math.round((todaySteps / stepGoal) * 100))}%)</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: Colors.cyanGlow }]}>
              <Ionicons name="water-outline" size={18} color={Colors.cyan} />
            </View>
            <Text style={styles.metricValue}>{(waterMl / 1000).toFixed(1)} L</Text>
            <Text style={styles.metricLabel}>Water ({Math.min(100, Math.round((waterMl / waterGoal) * 100))}%)</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: Colors.goldGlow }]}>
              <Ionicons name="flame-outline" size={18} color={Colors.gold} />
            </View>
            <Text style={styles.metricValue}>{caloriesBurned}</Text>
            <Text style={styles.metricLabel}>Kcal Burned</Text>
          </GlassCard>
        </View>

        {/* Next Upcoming Event */}
        {upcomingInterviewJob && upcomingInterviewJob.interviews?.[0] && (
          <GlassCard variant="elevated" style={styles.eventCard}>
            <View style={styles.eventTop}>
              <Badge label="Upcoming Interview" variant="cyan" />
              <Text style={styles.eventCountdown}>Scheduled</Text>
            </View>
            <Text style={styles.eventTitle}>
              {upcomingInterviewJob.companyName} • {upcomingInterviewJob.interviews[0].roundName}
            </Text>
            <Text style={styles.eventDesc}>
              {upcomingInterviewJob.role} ({upcomingInterviewJob.workMode})
            </Text>
            <TouchableOpacity style={styles.joinCallBtn} onPress={handleJoinCall}>
              <Ionicons name="videocam-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.joinCallText}>Join Meeting</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Top Focus Priorities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Focus Priorities</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate('TodoList');
              }}
            >
              <Ionicons name="list" size={14} color={Colors.cyan} />
              <Text style={[styles.addTaskBtnText, { color: Colors.cyan }]}>Full List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTaskBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsAddTaskModalVisible(true);
              }}
            >
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addTaskBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {tasks.length === 0 ? (
          <GlassCard style={styles.emptyTasksCard}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color={Colors.primary} />
            <Text style={styles.emptyTasksText}>All tasks completed! Tap + Add Task to add new priorities.</Text>
          </GlassCard>
        ) : (
          tasks.map((task, index) => (
            <GlassCard
              key={task.id}
              style={[styles.taskCard, task.done ? styles.taskCardDone : null]}
            >
              <TouchableOpacity
                style={styles.taskToggleRow}
                activeOpacity={0.8}
                onPress={() => toggleTask(task.id)}
              >
                <Ionicons
                  name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={task.done ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.taskTitle, task.done ? styles.taskTitleDone : null]}>
                  {index + 1}. {task.title}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.taskDeleteBtn}
                onPress={() => deleteTask(task.id)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={isAddTaskModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Daily Priority</Text>
            <TextInput
              style={styles.modalInput}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="e.g. System design interview practice"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddTaskModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddTask}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vault Security & Backup Modal */}
      <VaultSettingsModal
        visible={isVaultSettingsVisible}
        onClose={() => setIsVaultSettingsVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 3,
  },
  subDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  weatherBadge: {
    backgroundColor: Colors.cardSubtle || '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  weatherText: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '600',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.danger,
    position: 'absolute',
    top: 9,
    right: 9,
  },
  briefingCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  briefingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  briefingTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  briefingText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  eventCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  eventCountdown: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  joinCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  joinCallText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addTaskBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyTasksCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTasksText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskCardDone: {
    opacity: 0.5,
  },
  taskToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  taskTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskDeleteBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
  },
  modalSaveText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
});
