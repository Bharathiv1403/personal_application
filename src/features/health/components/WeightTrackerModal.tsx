import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useHealthStore } from '../state/health-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const WeightTrackerModal: React.FC<Props> = ({ visible, onClose }) => {
  const weightLogs = useHealthStore((s) => s.weightLogs);
  const goalWeightKg = useHealthStore((s) => s.goalWeightKg);
  const heightCm = useHealthStore((s) => s.heightCm);
  const logWeight = useHealthStore((s) => s.logWeight);
  const setGoalWeight = useHealthStore((s) => s.setGoalWeight);
  const setHeight = useHealthStore((s) => s.setHeight);

  const latestLog = weightLogs[0];
  const currentWeight = latestLog ? latestLog.weightKg : 70;
  const currentBmi = latestLog ? latestLog.bmi : 22.0;

  const [weightInput, setWeightInput] = useState(String(currentWeight));
  const [goalInput, setGoalInput] = useState(String(goalWeightKg));
  const [heightInput, setHeightInput] = useState(String(heightCm));
  const [noteInput, setNoteInput] = useState('');
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: Colors.cyan };
    if (bmi < 24.9) return { label: 'Normal / Healthy', color: Colors.primary };
    if (bmi < 29.9) return { label: 'Overweight', color: Colors.gold };
    return { label: 'Obese', color: Colors.danger };
  };

  const handleSaveWeight = () => {
    const parsedWeight = parseFloat(weightInput);
    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    logWeight(parsedWeight, noteInput.trim() || undefined);
    setNoteInput('');
  };

  const handleSaveSettings = () => {
    const parsedGoal = parseFloat(goalInput);
    const parsedHeight = parseFloat(heightInput);

    if (!isNaN(parsedGoal) && parsedGoal > 0) setGoalWeight(parsedGoal);
    if (!isNaN(parsedHeight) && parsedHeight > 50) setHeight(parsedHeight);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsEditingSettings(false);
  };

  if (!visible) return null;

  const bmiCat = getBmiCategory(currentBmi);
  const diffToGoal = Number((currentWeight - goalWeightKg).toFixed(1));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="scale-outline" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Body Weight & BMI</Text>
                <Text style={styles.subtitle}>Fitness Metrics & Target Curve</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Current Status Highlights */}
            <View style={styles.statusRow}>
              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Current Weight</Text>
                <Text style={styles.statusBigVal}>{currentWeight} kg</Text>
                <Text style={styles.statusSub}>
                  {diffToGoal > 0 ? `${diffToGoal} kg to goal` : 'Goal Reached! 🏆'}
                </Text>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>BMI Score</Text>
                <Text style={[styles.statusBigVal, { color: bmiCat.color }]}>{currentBmi}</Text>
                <Text style={[styles.statusSub, { color: bmiCat.color, fontWeight: '700' }]}>
                  {bmiCat.label}
                </Text>
              </View>
            </View>

            {/* Quick Log Input */}
            <View style={styles.logSection}>
              <Text style={styles.sectionTitle}>Log Today's Weight</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 70.2"
                  placeholderTextColor={Colors.textMuted}
                  value={weightInput}
                  onChangeText={setWeightInput}
                />
                <TouchableOpacity style={styles.saveLogBtn} onPress={handleSaveWeight}>
                  <Ionicons name="add" size={18} color="#09090B" />
                  <Text style={styles.saveLogBtnText}>Log Entry</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Optional note (e.g. Morning fasted, post-workout)"
                placeholderTextColor={Colors.textMuted}
                value={noteInput}
                onChangeText={setNoteInput}
              />
            </View>

            {/* Height & Goal Settings */}
            <View style={styles.settingsSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>Profile & Goals</Text>
                <TouchableOpacity onPress={() => setIsEditingSettings(!isEditingSettings)}>
                  <Text style={styles.editLinkText}>{isEditingSettings ? 'Cancel' : 'Edit'}</Text>
                </TouchableOpacity>
              </View>

              {isEditingSettings ? (
                <View style={styles.editSettingsForm}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Height (cm):</Text>
                      <TextInput
                        style={styles.fieldInput}
                        keyboardType="numeric"
                        value={heightInput}
                        onChangeText={setHeightInput}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Goal Weight (kg):</Text>
                      <TextInput
                        style={styles.fieldInput}
                        keyboardType="decimal-pad"
                        value={goalInput}
                        onChangeText={setGoalInput}
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
                    <Text style={styles.saveSettingsText}>Save Goals</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.profileSummaryRow}>
                  <Text style={styles.profileSummaryText}>
                    Height: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{heightCm} cm</Text>
                  </Text>
                  <Text style={styles.profileSummaryText}>
                    Goal: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{goalWeightKg} kg</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Past Weight History */}
            <Text style={styles.sectionTitle}>Recent Logs ({weightLogs.length})</Text>
            <View style={styles.logsStack}>
              {weightLogs.slice(0, 10).map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View>
                    <Text style={styles.logWeightText}>{log.weightKg} kg</Text>
                    <Text style={styles.logDateText}>{log.date} {log.note ? `• ${log.note}` : ''}</Text>
                  </View>
                  <Text style={[styles.logBmiText, { color: getBmiCategory(log.bmi).color }]}>
                    BMI {log.bmi}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statusBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statusBigVal: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  statusSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  weightInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    justifyContent: 'center',
  },
  saveLogBtnText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  settingsSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  editLinkText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  profileSummaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editSettingsForm: {
    gap: 8,
    marginTop: 6,
  },
  fieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  saveSettingsBtn: {
    backgroundColor: Colors.cyan,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  saveSettingsText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: '700',
  },
  logsStack: {
    gap: 8,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logWeightText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logDateText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logBmiText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
