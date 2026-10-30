import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
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

export const AdjustStepsModal: React.FC<Props> = ({ visible, onClose }) => {
  const todaySteps = useHealthStore((s) => s.todaySteps);
  const stepGoal = useHealthStore((s) => s.stepGoal);
  const manuallyAdjustSteps = useHealthStore((s) => s.manuallyAdjustSteps);
  const setStepGoal = useHealthStore((s) => s.setStepGoal);

  const [stepsInput, setStepsInput] = useState(String(todaySteps));
  const [goalInput, setGoalInput] = useState(String(stepGoal));
  const [tab, setTab] = useState<'steps' | 'goal' | 'fit'>('steps');

  const handleSyncFitPreset = (steps: number, label: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    manuallyAdjustSteps(steps);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      setStepsInput(String(todaySteps));
      setGoalInput(String(stepGoal));
    }
  }, [visible, todaySteps, stepGoal]);

  const handleSaveSteps = () => {
    const parsed = parseInt(stepsInput.replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      manuallyAdjustSteps(parsed);
      onClose();
    }
  };

  const handleSaveGoal = () => {
    const parsed = parseInt(goalInput.replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStepGoal(parsed);
      onClose();
    }
  };

  const handleQuickAdd = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const current = parseInt(stepsInput.replace(/,/g, ''), 10) || 0;
    setStepsInput(String(current + amount));
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Steps & Sensor Sync</Text>
              <Text style={styles.subtitle}>Adjust or sync today's movement data</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'steps' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTab('steps');
              }}
            >
              <Text style={[styles.tabText, tab === 'steps' && styles.tabTextActive]}>
                👟 Today's Steps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'goal' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTab('goal');
              }}
            >
              <Text style={[styles.tabText, tab === 'goal' && styles.tabTextActive]}>
                🎯 Target Goal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'fit' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTab('fit');
              }}
            >
              <Text style={[styles.tabText, tab === 'fit' && styles.tabTextActive]}>
                ⚡ Fit Sync
              </Text>
            </TouchableOpacity>
          </View>

          {tab === 'steps' ? (
            <View>
              <View style={styles.sensorInfoBox}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.cyan} />
                <Text style={styles.sensorInfoText}>
                  Android OS limits background sensor counting when the app is in your pocket or closed. Sync your steps directly from Google Fit or your phone's step counter below:
                </Text>
              </View>

              <Text style={styles.inputLabel}>Enter Actual Steps Count:</Text>
              <TextInput
                style={styles.bigInput}
                keyboardType="numeric"
                placeholder="e.g., 4500"
                placeholderTextColor={Colors.textMuted}
                value={stepsInput}
                onChangeText={setStepsInput}
                autoFocus
              />

              <Text style={styles.inputLabel}>Quick Boost:</Text>
              <View style={styles.quickAddRow}>
                {[500, 1000, 2500, 5000].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.quickAddBtn}
                    onPress={() => handleQuickAdd(num)}
                  >
                    <Text style={styles.quickAddText}>+{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveSteps}>
                <Ionicons name="checkmark-done" size={18} color="#09090B" />
                <Text style={styles.primaryBtnText}>Sync & Update Steps</Text>
              </TouchableOpacity>
            </View>
          ) : tab === 'goal' ? (
            <View>
              <Text style={styles.inputLabel}>Set Daily Step Target:</Text>
              <TextInput
                style={styles.bigInput}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor={Colors.textMuted}
                value={goalInput}
                onChangeText={setGoalInput}
                autoFocus
              />

              <View style={styles.quickAddRow}>
                {[6000, 8000, 10000, 12000].map((target) => (
                  <TouchableOpacity
                    key={target}
                    style={styles.quickAddBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setGoalInput(String(target));
                    }}
                  >
                    <Text style={styles.quickAddText}>{target / 1000}k</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveGoal}>
                <Ionicons name="trophy-outline" size={18} color="#09090B" />
                <Text style={styles.primaryBtnText}>Save Target Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={[styles.sensorInfoBox, { borderColor: 'rgba(6, 182, 212, 0.3)' }]}>
                <Ionicons name="cloud-download-outline" size={18} color={Colors.cyan} />
                <Text style={styles.sensorInfoText}>
                  Sync activity records directly from your Google Fit, Health Connect, or smart wearable band:
                </Text>
              </View>

              <View style={{ gap: 8, marginVertical: Spacing.sm }}>
                {[
                  { label: 'Morning Brisk Walk', steps: 3500, icon: 'walk-outline', color: Colors.cyan, desc: '3,500 Steps • ~150 kcal' },
                  { label: 'Daily Active Target', steps: 8000, icon: 'fitness-outline', color: Colors.primary, desc: '8,000 Steps • ~340 kcal' },
                  { label: '10k Power Goal', steps: 10000, icon: 'trophy-outline', color: Colors.gold, desc: '10,000 Steps • ~450 kcal' },
                  { label: 'High Activity Marathon', steps: 15000, icon: 'flame-outline', color: Colors.danger, desc: '15,000 Steps • ~650 kcal' },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: Radii.md,
                      padding: 12,
                    }}
                    onPress={() => handleSyncFitPreset(preset.steps, preset.label)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: `${preset.color}20`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={preset.icon as any} size={16} color={preset.color} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                          {preset.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                          {preset.desc}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle-outline" size={20} color={preset.color} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: 3,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.cardElevated,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sensorInfoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: Spacing.md,
  },
  sensorInfoText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  bigInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 9,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  quickAddText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radii.lg,
    gap: 8,
  },
  primaryBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '700',
  },
});
