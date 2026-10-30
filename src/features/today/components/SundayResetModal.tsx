import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHealthStore } from '@/features/health/state/health-store';
import { useJobStore } from '@/features/career/state/job-store';
import { useHabitStore } from '@/features/today/state/habit-store';
import { useTodoStore } from '@/features/todo/state/todo-store';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface SundayResetModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SundayResetModal: React.FC<SundayResetModalProps> = ({ visible, onClose }) => {
  const todaySteps = useHealthStore((s) => s.todaySteps);
  const jobs = useJobStore((s) => s.jobs);
  const habits = useHabitStore((s) => s.habits);
  const todos = useTodoStore((s) => s.todos);
  const addTodo = useTodoStore((s) => s.addTodo);

  const appliedJobsCount = jobs.filter((j) => j.stage === 'applied' || j.stage === 'interview').length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const completedTodosCount = todos.filter((t) => t.completed).length;

  const [winsText, setWinsText] = useState('');
  const [learningText, setLearningText] = useState('');
  const [goal1, setGoal1] = useState('');
  const [goal2, setGoal2] = useState('');
  const [goal3, setGoal3] = useState('');

  const handleFinishReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Auto-schedule the 3 goals into the Todo store for the upcoming week
    if (goal1.trim()) addTodo({ title: `🎯 Priority 1: ${goal1.trim()}`, category: 'Work', priority: 'high' });
    if (goal2.trim()) addTodo({ title: `🎯 Priority 2: ${goal2.trim()}`, category: 'Tech', priority: 'high' });
    if (goal3.trim()) addTodo({ title: `🎯 Priority 3: ${goal3.trim()}`, category: 'Personal', priority: 'medium' });

    // Save ritual completion in storage
    try {
      const resetRecord = {
        date: new Date().toISOString(),
        wins: winsText,
        learning: learningText,
        goals: [goal1, goal2, goal3].filter(Boolean),
      };
      await AsyncStorage.setItem('@aayon:last_sunday_reset', JSON.stringify(resetRecord));
    } catch {}

    Alert.alert(
      'Sunday Reset Complete! 🕯️🚀',
      'Your 3 critical goals have been pinned to your Daily Agenda. Have an exceptional week ahead!'
    );

    setWinsText('');
    setLearningText('');
    setGoal1('');
    setGoal2('');
    setGoal3('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={20} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Sunday Reset & Retrospective 🕯️</Text>
              <Text style={styles.headerSubtitle}>Weekly High-Performance Executive Review</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Weekly Performance Scorecard */}
            <Text style={styles.sectionTitle}>1. Weekly Performance Scorecard</Text>
            <View style={styles.scorecardGrid}>
              <View style={styles.scorecardBox}>
                <Ionicons name="briefcase" size={16} color={Colors.cyan} />
                <Text style={styles.scoreNumber}>{appliedJobsCount}</Text>
                <Text style={styles.scoreLabel}>Active Pipeline</Text>
              </View>

              <View style={styles.scorecardBox}>
                <Ionicons name="flame" size={16} color={Colors.gold} />
                <Text style={styles.scoreNumber}>{longestStreak}d</Text>
                <Text style={styles.scoreLabel}>Top Habit Streak</Text>
              </View>

              <View style={styles.scorecardBox}>
                <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
                <Text style={styles.scoreNumber}>{completedTodosCount}</Text>
                <Text style={styles.scoreLabel}>Tasks Crushed</Text>
              </View>

              <View style={styles.scorecardBox}>
                <Ionicons name="footsteps" size={16} color={Colors.purple} />
                <Text style={styles.scoreNumber}>{todaySteps.toLocaleString()}</Text>
                <Text style={styles.scoreLabel}>Today Steps</Text>
              </View>
            </View>

            {/* Wins & Gratitude */}
            <Text style={styles.sectionTitle}>2. Wins & Breakthroughs This Week</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What went exceptionally well? (e.g. Mastered React 19 compiler internals, cleared HR screening call, kept hydration streak...)"
              placeholderTextColor={Colors.textMuted}
              value={winsText}
              onChangeText={setWinsText}
              multiline
              textAlignVertical="top"
            />

            {/* Lessons & Growth */}
            <Text style={styles.sectionTitle}>3. Key Lessons & Adjustments</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What was your biggest distraction or lesson? What will you do differently next week?"
              placeholderTextColor={Colors.textMuted}
              value={learningText}
              onChangeText={setLearningText}
              multiline
              textAlignVertical="top"
            />

            {/* Upcoming Week 3 Critical Goals */}
            <Text style={styles.sectionTitle}>4. Next Week's 3 Critical Big Bets</Text>
            <View style={styles.goalRow}>
              <View style={styles.goalNumBadge}><Text style={styles.goalNumText}>1</Text></View>
              <TextInput
                style={styles.goalInput}
                placeholder="High-leverage Goal 1 (e.g. Apply to 10 tier-1 startups)"
                placeholderTextColor={Colors.textMuted}
                value={goal1}
                onChangeText={setGoal1}
              />
            </View>

            <View style={styles.goalRow}>
              <View style={styles.goalNumBadge}><Text style={styles.goalNumText}>2</Text></View>
              <TextInput
                style={styles.goalInput}
                placeholder="High-leverage Goal 2 (e.g. Solve 5 Graph/Tree problems on LeetCode)"
                placeholderTextColor={Colors.textMuted}
                value={goal2}
                onChangeText={setGoal2}
              />
            </View>

            <View style={styles.goalRow}>
              <View style={styles.goalNumBadge}><Text style={styles.goalNumText}>3</Text></View>
              <TextInput
                style={styles.goalInput}
                placeholder="High-leverage Goal 3 (e.g. Walk 8k steps daily & sleep by 11:30 PM)"
                placeholderTextColor={Colors.textMuted}
                value={goal3}
                onChangeText={setGoal3}
              />
            </View>
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinishReset}>
            <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
            <Text style={styles.finishBtnText}>Complete Reset & Lock In Week</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#11121C',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scorecardGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  scorecardBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    padding: 12,
    fontSize: 13,
    color: '#FFFFFF',
    minHeight: 70,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  goalNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.purple,
  },
  goalInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#FFFFFF',
  },
  finishBtn: {
    backgroundColor: Colors.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.lg,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
