import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useHabitStore } from '../state/habit-store';

const HABIT_ICONS = [
  'code-slash',
  'book',
  'flame',
  'walk',
  'water',
  'fitness',
  'barbell',
  'briefcase',
];

export const HabitsCard: React.FC = () => {
  const habits = useHabitStore((s) => s.habits);
  const toggleHabitToday = useHabitStore((s) => s.toggleHabitToday);
  const isHabitDoneToday = useHabitStore((s) => s.isHabitDoneToday);
  const addHabit = useHabitStore((s) => s.addHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flame');

  const handleToggle = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toggleHabitToday(id);
  };

  const handleSaveHabit = () => {
    if (!newTitle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addHabit(newTitle.trim(), selectedIcon);
    setNewTitle('');
    setAddModalVisible(false);
  };

  const completedTodayCount = habits.filter((h) => isHabitDoneToday(h)).length;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.iconCircle}>
            <Ionicons name="flame" size={20} color={Colors.gold} />
          </View>
          <View>
            <Text style={styles.title}>High-Performance Habits</Text>
            <Text style={styles.subtitle}>
              {completedTodayCount} of {habits.length} completed today
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setAddModalVisible(true);
          }}
        >
          <Ionicons name="add" size={16} color={Colors.primary} />
          <Text style={styles.addBtnText}>New Habit</Text>
        </TouchableOpacity>
      </View>

      {/* Habits List */}
      <View style={styles.habitsStack}>
        {habits.map((h) => {
          const isDone = isHabitDoneToday(h);
          return (
            <TouchableOpacity
              key={h.id}
              style={[styles.habitRow, isDone && styles.habitRowDone]}
              activeOpacity={0.8}
              onPress={() => handleToggle(h.id)}
            >
              <View style={styles.habitLeft}>
                <Ionicons
                  name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isDone ? Colors.primary : Colors.textMuted}
                />
                <View style={styles.habitIconMini}>
                  <Ionicons name={(h.icon as any) || 'flame'} size={14} color={Colors.gold} />
                </View>
                <Text style={[styles.habitTitle, isDone && styles.habitTitleDone]}>
                  {h.title}
                </Text>
              </View>

              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={13} color={Colors.gold} />
                <Text style={styles.streakText}>{h.currentStreak}d</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add Habit Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Habit</Text>

            <Text style={styles.inputLabel}>Habit Title:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Read 20 pages, Gym workout"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <Text style={styles.inputLabel}>Select Icon:</Text>
            <View style={styles.iconPickerRow}>
              {HABIT_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconChoice, selectedIcon === ic && styles.iconChoiceActive]}
                  onPress={() => setSelectedIcon(ic)}
                >
                  <Ionicons name={ic as any} size={18} color={selectedIcon === ic ? Colors.gold : Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveHabit}>
                <Text style={styles.saveBtnText}>Save Habit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryGlow,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  addBtnText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  habitsStack: {
    gap: 8,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  habitRowDone: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  habitIconMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  habitTitleDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.card,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  iconPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  iconChoice: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldGlow,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090B',
  },
});
