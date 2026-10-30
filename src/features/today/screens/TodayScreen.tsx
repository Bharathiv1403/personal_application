import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
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
import { useCandidateProfileStore } from '@/features/career/state/candidate-profile-store';
import { WeatherService, WeatherData } from '@/core/utils/weather-service';
import { PedometerService } from '@/core/native-bridges/pedometer-adapter';
import { AIService } from '@/core/utils/ai-service';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { VaultSettingsModal } from '@/features/auth/components/VaultSettingsModal';
import { HabitsCard } from '../components/HabitsCard';
import { PomodoroTimerModal } from '../components/PomodoroTimerModal';
import { SecondBrainModal } from '@/features/notes/components/SecondBrainModal';
import { QuickBrainDumpModal } from '@/features/notes/components/QuickBrainDumpModal';
import { SundayResetModal } from '@/features/today/components/SundayResetModal';
import { KeePassVaultModal } from '@/features/vault/components/KeePassVaultModal';
import { AddTransactionModal } from '@/features/wealth/components/AddTransactionModal';

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
  const checkAndResetDay = useHealthStore((s) => s.checkAndResetDay);

  const loans = useWealthStore((s) => s.loans);
  const activeLoans = loans.filter((l) => l.status === 'active');
  const activeLoan = activeLoans[0];

  const jobs = useJobStore((s) => s.jobs);
  const upcomingInterviewJob = jobs.find((j) => j.interviews && j.interviews.length > 0);

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const userName = user?.name ? user.name.split(' ')[0] : 'User';

  const preferredLocations = useCandidateProfileStore((s) => s.preferences.preferredLocations);
  const userCity = preferredLocations && preferredLocations.length > 0 ? preferredLocations[0] : 'Chennai';

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
  const [isPomodoroVisible, setIsPomodoroVisible] = useState(false);
  const [activePomodoroTaskTitle, setActivePomodoroTaskTitle] = useState<string>('');
  const [isSecondBrainVisible, setIsSecondBrainVisible] = useState(false);
  const [isBrainDumpVisible, setIsBrainDumpVisible] = useState(false);
  const [isKeePassVisible, setIsKeePassVisible] = useState(false);
  const [isSundayResetVisible, setIsSundayResetVisible] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isAddTxModalVisible, setIsAddTxModalVisible] = useState(false);

  const formatInterviewCountdown = (scheduledAt?: string): string => {
    if (!scheduledAt) return 'Scheduled';
    const target = new Date(scheduledAt).getTime();
    if (isNaN(target)) return scheduledAt;
    const now = Date.now();
    const diffMs = target - now;

    if (diffMs < -24 * 60 * 60 * 1000) {
      return 'Completed';
    }
    if (diffMs < 0) {
      return 'Happening Today 🔥';
    }
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 60) {
      return `Starts in ${diffMins}m 🔥`;
    }
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours < 24) {
      const remMins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
      return `In ${diffHours}h ${remMins}m ⏰`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return 'Tomorrow ⏰';
    }
    return `In ${diffDays}d (${new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  };

  // Load weather, pedometer, and persistent tasks on mount
  useEffect(() => {
    // 1. Check day reset & fetch live weather
    checkAndResetDay();
    WeatherService.getCurrentWeather(userCity).then((res) => {
      if (res) setWeather(res);
    });

    // 2. Hardware pedometer sync
    let unsubscribePedometer: (() => void) | null = null;
    PedometerService.checkAvailability().then(({ isAvailable, permissionGranted, hasHistoricalSupport }) => {
      if (isAvailable && permissionGranted) {
        if (hasHistoricalSupport) {
          PedometerService.getTodaySteps().then((realSteps) => {
            if (realSteps > 0) setTodaySteps(realSteps);
          });
        }
        unsubscribePedometer = PedometerService.subscribeLiveSteps((delta) => {
          if (delta > 0) addLiveSteps(delta);
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const res = await WeatherService.getCurrentWeather(userCity);
      if (res) setWeather(res);
      const steps = await PedometerService.getTodaySteps();
      setTodaySteps(steps);
    } catch {
      // silently ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.greeting} numberOfLines={1}>{getGreeting()}, {userName} 👋</Text>
            <View style={styles.subHeaderRow}>
              <Text style={styles.subDate}>{formattedDate} • Life OS</Text>
              {weather && (
                <View style={styles.weatherBadge}>
                  <Text style={styles.weatherText}>⛅ {weather.tempCelsius}°C</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerActionsWrap}>
            <TouchableOpacity
              style={styles.bellButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bellButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            <Text style={styles.metricLabel}>
              Steps ({Math.min(100, Math.round((todaySteps / (stepGoal || 10000)) * 100)) || 0}%)
            </Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: Colors.cyanGlow }]}>
              <Ionicons name="water-outline" size={18} color={Colors.cyan} />
            </View>
            <Text style={styles.metricValue}>{(waterMl / 1000).toFixed(1)} L</Text>
            <Text style={styles.metricLabel}>
              Water ({Math.min(100, Math.round((waterMl / (waterGoal || 3000)) * 100)) || 0}%)
            </Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: Colors.goldGlow }]}>
              <Ionicons name="flame-outline" size={18} color={Colors.gold} />
            </View>
            <Text style={styles.metricValue}>{caloriesBurned}</Text>
            <Text style={styles.metricLabel}>Kcal Burned</Text>
          </GlassCard>
        </View>

        {/* Executive Command Hub (Second Brain, Dump, KeePass, Sunday Reset) */}
        <View style={styles.commandBeltRow}>
          <TouchableOpacity
            style={[styles.commandChip, { borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsBrainDumpVisible(true);
            }}
          >
            <Ionicons name="flash" size={14} color={Colors.gold} />
            <Text style={[styles.commandChipText, { color: Colors.gold }]}>Brain Dump</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commandChip, { borderColor: 'rgba(6, 182, 212, 0.3)', backgroundColor: 'rgba(6, 182, 212, 0.08)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsSecondBrainVisible(true);
            }}
          >
            <Ionicons name="journal-outline" size={14} color={Colors.cyan} />
            <Text style={[styles.commandChipText, { color: Colors.cyan }]}>Second Brain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commandChip, { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsKeePassVisible(true);
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.primary} />
            <Text style={[styles.commandChipText, { color: Colors.primary }]}>Passwords</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.commandChip, { borderColor: 'rgba(139, 92, 246, 0.3)', backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsSundayResetVisible(true);
            }}
          >
            <Ionicons name="sparkles-outline" size={14} color={Colors.purple} />
            <Text style={[styles.commandChipText, { color: Colors.purple }]}>Sunday Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Next Upcoming Event */}
        {upcomingInterviewJob && upcomingInterviewJob.interviews?.[0] && (
          <GlassCard variant="elevated" style={styles.eventCard}>
            <View style={styles.eventTop}>
              <Badge label="Upcoming Interview" variant="cyan" />
              <Text style={styles.eventCountdown}>
                {formatInterviewCountdown(upcomingInterviewJob.interviews[0].scheduledAt)}
              </Text>
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
              style={[styles.addTaskBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActivePomodoroTaskTitle(tasks[0]?.title || 'Deep Focus Session');
                setIsPomodoroVisible(true);
              }}
            >
              <Ionicons name="timer-outline" size={14} color={Colors.gold} />
              <Text style={[styles.addTaskBtnText, { color: Colors.gold }]}>Focus Timer</Text>
            </TouchableOpacity>

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
            <Text style={styles.emptyTasksText}>All tasks completed! Ready for new focus items?</Text>
            <TouchableOpacity
              style={styles.inlineAddPriorityBtn}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsAddTaskModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.inlineAddPriorityBtnText}>+ Add Daily Priority</Text>
            </TouchableOpacity>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {!task.done && (
                  <TouchableOpacity
                    style={styles.taskPomodoroBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setActivePomodoroTaskTitle(task.title);
                      setIsPomodoroVisible(true);
                    }}
                  >
                    <Ionicons name="play" size={12} color={Colors.gold} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.taskDeleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => deleteTask(task.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}

        {/* High-Performance Habits & Discipline Engine */}
        <HabitsCard />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={isAddTaskModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddTaskModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Vault Security & Backup Modal */}
      <VaultSettingsModal
        visible={isVaultSettingsVisible}
        onClose={() => setIsVaultSettingsVisible(false)}
      />

      {/* Pomodoro Focus Timer Modal */}
      <PomodoroTimerModal
        visible={isPomodoroVisible}
        onClose={() => setIsPomodoroVisible(false)}
        defaultTaskTitle={activePomodoroTaskTitle}
      />

      {/* Second Brain Knowledge & Code Vault */}
      <SecondBrainModal
        visible={isSecondBrainVisible}
        onClose={() => setIsSecondBrainVisible(false)}
      />

      {/* Quick Brain Dump Modal */}
      <QuickBrainDumpModal
        visible={isBrainDumpVisible}
        onClose={() => setIsBrainDumpVisible(false)}
      />

      {/* Sunday Reset Retrospective */}
      <SundayResetModal
        visible={isSundayResetVisible}
        onClose={() => setIsSundayResetVisible(false)}
      />

      {/* KeePass Password Vault */}
      <KeePassVaultModal
        visible={isKeePassVisible}
        onClose={() => setIsKeePassVisible(false)}
      />

      {/* Floating Action Button (FAB) Speed Dial */}
      {isFabOpen && (
        <TouchableOpacity
          style={styles.fabBackdrop}
          activeOpacity={1}
          onPress={() => setIsFabOpen(false)}
        />
      )}

      <View style={styles.fabContainer} pointerEvents="box-none">
        {isFabOpen && (
          <View style={styles.speedDialMenu}>
            <TouchableOpacity
              style={styles.speedDialItem}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsFabOpen(false);
                setIsAddTaskModalVisible(true);
              }}
            >
              <Text style={styles.speedDialLabel}>+ Daily Priority</Text>
              <View style={[styles.speedDialIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="checkbox-outline" size={17} color={Colors.primary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialItem}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsFabOpen(false);
                setIsBrainDumpVisible(true);
              }}
            >
              <Text style={styles.speedDialLabel}>📝 Quick Brain Dump</Text>
              <View style={[styles.speedDialIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Ionicons name="flash-outline" size={17} color={Colors.gold} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialItem}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                useHealthStore.getState().addWater(500);
                setIsFabOpen(false);
                Alert.alert('Hydration Logged 💧', '+500 ml water logged to your daily goal!');
              }}
            >
              <Text style={styles.speedDialLabel}>💧 +500ml Water</Text>
              <View style={[styles.speedDialIcon, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <Ionicons name="water-outline" size={17} color={Colors.cyan} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.speedDialItem}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsFabOpen(false);
                setIsAddTxModalVisible(true);
              }}
            >
              <Text style={styles.speedDialLabel}>💳 Quick Expense</Text>
              <View style={[styles.speedDialIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="card-outline" size={17} color={Colors.danger} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainFabBtn, isFabOpen && styles.mainFabBtnOpen]}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setIsFabOpen(!isFabOpen);
          }}
        >
          <Ionicons
            name={isFabOpen ? 'close' : 'add'}
            size={26}
            color="#09090B"
          />
        </TouchableOpacity>
      </View>

      <AddTransactionModal
        visible={isAddTxModalVisible}
        onClose={() => setIsAddTxModalVisible(false)}
        defaultType="expense"
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 160,
    marginRight: 6,
  },
  headerActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  greeting: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
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
    marginBottom: Spacing.md,
  },
  commandBeltRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  commandChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  commandChipText: {
    fontSize: 11,
    fontWeight: '700',
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
  inlineAddPriorityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    marginTop: 6,
  },
  inlineAddPriorityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  taskPomodoroBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: Spacing.sm,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSubtle,
    borderRadius: Radii.md,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  modalSaveText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 90,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 100,
    alignItems: 'flex-end',
  },
  speedDialMenu: {
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-end',
  },
  speedDialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: Radii.full,
    paddingVertical: 6,
    paddingLeft: 14,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    gap: 10,
  },
  speedDialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  speedDialIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainFabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  mainFabBtnOpen: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
});
