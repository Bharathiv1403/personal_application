import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useHealthStore, ScreenTimeReasonCategory } from '../state/health-store';

interface Props {
  visible: boolean;
  onClose?: () => void;
}

const PRESET_REASONS: { category: ScreenTimeReasonCategory; label: string; icon: string; desc: string }[] = [
  { category: 'emergency', label: 'Emergency 🚨', icon: 'warning', desc: 'Urgent call, family or medical need' },
  { category: 'time_pass', label: 'Time Pass ⏳', icon: 'hourglass', desc: 'Casual scrolling, unwinding' },
  { category: 'boring', label: 'Boring / Free 🥱', icon: 'cafe', desc: 'Feeling bored, nothing else to do' },
  { category: 'work', label: 'Work / Study 💼', icon: 'briefcase', desc: 'Office tasks, emails, studying' },
  { category: 'social', label: 'Social / Family 💬', icon: 'chatbubbles', desc: 'Reaching out to loved ones' },
  { category: 'other', label: 'Other Reason ✏️', icon: 'create-outline', desc: 'Type custom reason manually' },
];

const EXTENSION_OPTIONS = [
  { minutes: 15, label: '+15 Mins' },
  { minutes: 30, label: '+30 Mins' },
  { minutes: 60, label: '+1 Hour' },
];

export const ScreenTimeLimitModal: React.FC<Props> = ({ visible, onClose }) => {
  const [step, setStep] = useState<'decision' | 'reason' | 'stopped_feedback'>('decision');
  const [selectedCategory, setSelectedCategory] = useState<ScreenTimeReasonCategory>('time_pass');
  const [customReason, setCustomReason] = useState('');
  const [selectedExtension, setSelectedExtension] = useState<number>(30);

  const dailyLimitMinutes = useHealthStore((s) => s.dailyScreenLimitMinutes);
  const todayScreenTimeSeconds = useHealthStore((s) => s.todayScreenTimeSeconds);
  const handleScreenTimeStop = useHealthStore((s) => s.handleScreenTimeStop);
  const handleScreenTimeContinue = useHealthStore((s) => s.handleScreenTimeContinue);
  const closeScreenLimitModal = useHealthStore((s) => s.closeScreenLimitModal);

  const usedMinutes = Math.round(todayScreenTimeSeconds / 60);
  const usedHours = Math.floor(usedMinutes / 60);
  const remainingMins = usedMinutes % 60;

  const limitHours = Math.floor(dailyLimitMinutes / 60);
  const limitRemainingMins = dailyLimitMinutes % 60;

  const resetFormAndClose = () => {
    setStep('decision');
    setCustomReason('');
    setSelectedCategory('time_pass');
    setSelectedExtension(30);
    closeScreenLimitModal();
    if (onClose) onClose();
  };

  const onStopPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    handleScreenTimeStop();
    setStep('stopped_feedback');
  };

  const onContinuePromptPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setStep('reason');
  };

  const onConfirmContinue = () => {
    if (selectedCategory === 'other' && !customReason.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    handleScreenTimeContinue(selectedCategory, customReason.trim(), selectedExtension);
    resetFormAndClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetFormAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {step === 'decision' && (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircleWarning}>
                <Ionicons name="timer" size={38} color={Colors.gold} />
              </View>

              <Text style={styles.title}>Daily Screen Limit Reached!</Text>
              <Text style={styles.subtitle}>
                You have used your phone for{' '}
                <Text style={styles.highlightText}>
                  {usedHours > 0 ? `${usedHours}h ` : ''}{remainingMins}m
                </Text>
                , reaching your daily goal of{' '}
                <Text style={styles.highlightText}>
                  {limitHours > 0 ? `${limitHours}h ` : ''}{limitRemainingMins}m
                </Text>
                .
              </Text>

              <View style={styles.infoBox}>
                <Ionicons name="help-circle-outline" size={20} color={Colors.cyan} />
                <Text style={styles.infoBoxText}>
                  What would you like to do right now?
                </Text>
              </View>

              <View style={styles.buttonStack}>
                <TouchableOpacity
                  style={styles.stopButton}
                  activeOpacity={0.8}
                  onPress={onStopPress}
                >
                  <Ionicons name="hand-left" size={20} color="#FFFFFF" />
                  <Text style={styles.stopButtonText}>Stop Using Phone</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueButton}
                  activeOpacity={0.8}
                  onPress={onContinuePromptPress}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.continueButtonText}>Continue Using...</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'reason' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.stepContainer}
            >
              <View style={styles.iconCircleCyan}>
                <Ionicons name="help-buoy" size={32} color={Colors.cyan} />
              </View>

              <Text style={styles.title}>Why are you continuing?</Text>
              <Text style={styles.subtitle}>
                Please state the reason. We track this in your Health Wellbeing Dashboard to help you stay mindful.
              </Text>

              <View style={styles.categoryGrid}>
                {PRESET_REASONS.map((item) => {
                  const isSelected = selectedCategory === item.category;
                  return (
                    <TouchableOpacity
                      key={item.category}
                      style={[styles.reasonChip, isSelected && styles.reasonChipActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedCategory(item.category);
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                      <Text style={[styles.reasonChipText, isSelected && styles.reasonChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Manual input if 'Other' is selected */}
              {selectedCategory === 'other' && (
                <View style={styles.manualInputWrapper}>
                  <Text style={styles.inputLabel}>Type your custom reason:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Calling bank, watching tutorial, etc."
                    placeholderTextColor={Colors.textMuted}
                    value={customReason}
                    onChangeText={setCustomReason}
                    maxLength={100}
                    autoFocus
                  />
                </View>
              )}

              {/* Extension Duration Picker */}
              <View style={styles.extensionWrapper}>
                <Text style={styles.inputLabel}>Extend screen time by:</Text>
                <View style={styles.extensionRow}>
                  {EXTENSION_OPTIONS.map((opt) => {
                    const isSelected = selectedExtension === opt.minutes;
                    return (
                      <TouchableOpacity
                        key={opt.minutes}
                        style={[styles.extOptionBtn, isSelected && styles.extOptionBtnActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedExtension(opt.minutes);
                        }}
                      >
                        <Text style={[styles.extOptionText, isSelected && styles.extOptionTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep('decision')}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmContinueButton,
                    selectedCategory === 'other' && !customReason.trim() && styles.disabledButton,
                  ]}
                  onPress={onConfirmContinue}
                  disabled={selectedCategory === 'other' && !customReason.trim()}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmContinueText}>Save & Continue</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {step === 'stopped_feedback' && (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircleSuccess}>
                <Ionicons name="shield-checkmark" size={38} color={Colors.primary} />
              </View>

              <Text style={styles.title}>Great Discipline! 🌿</Text>
              <Text style={styles.subtitle}>
                You stopped phone usage on time. Your digital wellbeing report has been recorded.
              </Text>

              <View style={styles.disciplineTipCard}>
                <Ionicons name="bulb-outline" size={20} color={Colors.gold} />
                <Text style={styles.disciplineTipText}>
                  Rest your eyes (20-20-20 rule), take a short walk, or drink a glass of water to refresh your mind!
                </Text>
              </View>

              <TouchableOpacity
                style={styles.doneButton}
                activeOpacity={0.8}
                onPress={resetFormAndClose}
              >
                <Text style={styles.doneButtonText}>Got It, Take a Break</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircleWarning: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.goldGlow,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircleCyan: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.cyanGlow,
    borderWidth: 1.5,
    borderColor: Colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircleSuccess: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  highlightText: {
    color: Colors.gold,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  infoBoxText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  buttonStack: {
    width: '100%',
    gap: 12,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radii.lg,
    gap: 8,
  },
  continueButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: Spacing.md,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
    flexGrow: 1,
  },
  reasonChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  reasonChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  reasonChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  manualInputWrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
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
    fontSize: 13,
  },
  extensionWrapper: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  extensionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  extOptionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  extOptionBtnActive: {
    borderColor: Colors.cyan,
    backgroundColor: Colors.cyanGlow,
  },
  extOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  extOptionTextActive: {
    color: Colors.cyan,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmContinueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    gap: 6,
  },
  confirmContinueText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disciplineTipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  disciplineTipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  doneButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radii.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '700',
  },
});
