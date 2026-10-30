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

const QUALITY_OPTIONS: ('Restful' | 'Good' | 'Disturbed')[] = ['Restful', 'Good', 'Disturbed'];

export const SleepLoggerModal: React.FC<Props> = ({ visible, onClose }) => {
  const sleepHours = useHealthStore((s) => s.sleepHours);
  const sleepQuality = useHealthStore((s) => s.sleepQuality);
  const lastNightBedtime = useHealthStore((s) => s.lastNightBedtime);
  const lastNightWakeTime = useHealthStore((s) => s.lastNightWakeTime);
  const sleepDebtHours = useHealthStore((s) => s.sleepDebtHours);
  const logSleep = useHealthStore((s) => s.logSleep);

  const [hoursInput, setHoursInput] = useState(String(sleepHours || 7.5));
  const [selectedQuality, setSelectedQuality] = useState<'Restful' | 'Good' | 'Disturbed'>(sleepQuality || 'Good');
  const [bedtimeInput, setBedtimeInput] = useState(lastNightBedtime || '');
  const [wakeTimeInput, setWakeTimeInput] = useState(lastNightWakeTime || '');

  const prevVisibleRef = React.useRef(false);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setHoursInput(sleepHours > 0 ? String(sleepHours) : '');
      setSelectedQuality(sleepQuality || 'Good');
      setBedtimeInput(lastNightBedtime || '');
      setWakeTimeInput(lastNightWakeTime || '');
    }
    prevVisibleRef.current = visible;
  }, [visible, sleepHours, sleepQuality, lastNightBedtime, lastNightWakeTime]);

  const handleSave = () => {
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    logSleep(hours, selectedQuality, bedtimeInput.trim() || '11:00 PM', wakeTimeInput.trim() || '07:00 AM');
    onClose();
  };

  if (!visible) return null;

  const currentEnteredHours = parseFloat(hoursInput) || 0;
  const currentDebt = Math.max(0, Number((8.0 - currentEnteredHours).toFixed(1)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="moon" size={20} color={Colors.purple} />
              </View>
              <View>
                <Text style={styles.title}>Sleep & Recovery Log</Text>
                <Text style={styles.subtitle}>Track circadian rest and sleep debt</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Stats banner */}
          <View style={styles.debtBanner}>
            <Ionicons
              name={currentDebt > 1 ? 'alert-circle' : 'checkmark-circle'}
              size={18}
              color={currentDebt > 1 ? Colors.gold : Colors.primary}
            />
            <Text style={styles.debtBannerText}>
              {currentDebt > 0
                ? `Sleep Debt: ${currentDebt}h below 8h target`
                : 'Optimal Sleep Goal Achieved (8h+ Rest)'}
            </Text>
          </View>

          {/* Duration Input */}
          <Text style={styles.inputLabel}>Total Sleep Hours:</Text>
          <TextInput
            style={styles.largeInput}
            keyboardType="decimal-pad"
            placeholder="e.g. 7.5"
            placeholderTextColor={Colors.textMuted}
            value={hoursInput}
            onChangeText={setHoursInput}
          />

          <View style={styles.presetHoursRow}>
            {[6.0, 7.0, 7.5, 8.0, 9.0].map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.presetBtn, parseFloat(hoursInput) === h && styles.presetBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setHoursInput(String(h));
                }}
              >
                <Text style={[styles.presetBtnText, parseFloat(hoursInput) === h && styles.presetBtnTextActive]}>
                  {h}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bedtime & Wake Time */}
          <View style={styles.timeInputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Bedtime:</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="11:30 PM"
                placeholderTextColor={Colors.textMuted}
                value={bedtimeInput}
                onChangeText={setBedtimeInput}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Wake Up Time:</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="07:00 AM"
                placeholderTextColor={Colors.textMuted}
                value={wakeTimeInput}
                onChangeText={setWakeTimeInput}
              />
            </View>
          </View>

          {/* Sleep Quality Selector */}
          <Text style={styles.inputLabel}>Sleep Quality:</Text>
          <View style={styles.qualityRow}>
            {QUALITY_OPTIONS.map((q) => {
              const isSelected = selectedQuality === q;
              return (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityBtn, isSelected && styles.qualityBtnActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedQuality(q);
                  }}
                >
                  <Ionicons
                    name={q === 'Restful' ? 'star' : q === 'Good' ? 'happy' : 'thunderstorm'}
                    size={16}
                    color={isSelected ? Colors.purple : Colors.textSecondary}
                  />
                  <Text style={[styles.qualityText, isSelected && styles.qualityTextActive]}>
                    {q}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSave}>
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Sleep Data</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  card: {
    width: '100%',
    maxWidth: 420,
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.purpleGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
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
  debtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  debtBannerText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  largeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  presetHoursRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleGlow,
  },
  presetBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: Colors.purple,
    fontWeight: '700',
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  timeInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  qualityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  qualityBtnActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleGlow,
  },
  qualityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  qualityTextActive: {
    color: Colors.purple,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.purple,
    paddingVertical: 13,
    borderRadius: Radii.lg,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
