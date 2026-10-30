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

const PRESET_LIMITS = [
  { minutes: 30, label: '30 Mins' },
  { minutes: 60, label: '1 Hour' },
  { minutes: 90, label: '1.5 Hours' },
  { minutes: 120, label: '2 Hours' },
  { minutes: 180, label: '3 Hours' },
  { minutes: 240, label: '4 Hours' },
];

export const SetScreenLimitModal: React.FC<Props> = ({ visible, onClose }) => {
  const dailyLimitMinutes = useHealthStore((s) => s.dailyScreenLimitMinutes);
  const setDailyScreenLimitMinutes = useHealthStore((s) => s.setDailyScreenLimitMinutes);
  const todayScreenTimeSeconds = useHealthStore((s) => s.todayScreenTimeSeconds);
  const setTodayScreenTimeMinutes = useHealthStore((s) => s.setTodayScreenTimeMinutes);

  const [selectedMinutes, setSelectedMinutes] = useState(dailyLimitMinutes);
  const [customInput, setCustomInput] = useState('');
  const [activeTab, setActiveTab] = useState<'limit' | 'logUsage'>('limit');
  const [usageInput, setUsageInput] = useState('');

  const prevVisibleRef = React.useRef(false);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setSelectedMinutes(dailyLimitMinutes);
      setCustomInput('');
      setUsageInput(String(Math.round(todayScreenTimeSeconds / 60)));
    }
    prevVisibleRef.current = visible;
  }, [visible, dailyLimitMinutes, todayScreenTimeSeconds]);

  const handleSaveLimit = () => {
    let finalMinutes = selectedMinutes;
    if (customInput.trim()) {
      const parsed = parseInt(customInput, 10);
      if (!isNaN(parsed) && parsed > 0) {
        finalMinutes = parsed;
      }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDailyScreenLimitMinutes(finalMinutes);
    onClose();
  };

  const handleSaveUsage = () => {
    const parsed = parseInt(usageInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTodayScreenTimeMinutes(parsed);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Digital Wellbeing Config</Text>
              <Text style={styles.subtitle}>Set daily budget or sync phone time</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'limit' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('limit');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'limit' && styles.tabTextActive]}>
                🎯 Daily Limit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'logUsage' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('logUsage');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'logUsage' && styles.tabTextActive]}>
                📱 Log / Simulate Time
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'limit' ? (
            <View>
              <Text style={styles.sectionLabel}>Select Daily Screen Limit:</Text>

              <View style={styles.grid}>
                {PRESET_LIMITS.map((p) => {
                  const isSelected = selectedMinutes === p.minutes && !customInput;
                  return (
                    <TouchableOpacity
                      key={p.minutes}
                      style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedMinutes(p.minutes);
                        setCustomInput('');
                      }}
                    >
                      <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>
                Or Enter Custom Minutes:
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g., 75 (for 1 hour 15 min)"
                placeholderTextColor={Colors.textMuted}
                value={customInput}
                onChangeText={(text) => {
                  setCustomInput(text);
                  const num = parseInt(text, 10);
                  if (!isNaN(num)) setSelectedMinutes(num);
                }}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveLimit}>
                <Ionicons name="checkmark" size={18} color="#09090B" />
                <Text style={styles.primaryBtnText}>Save Screen Limit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionLabel}>
                Set Today's Total Phone Usage (Minutes):
              </Text>
              <Text style={styles.helpText}>
                Useful to mirror your Android Digital Wellbeing / iOS Screen Time from system settings or test the limit prompt immediately.
              </Text>

              <TextInput
                style={[styles.input, { fontSize: 20, textAlign: 'center', marginVertical: Spacing.md }]}
                keyboardType="numeric"
                placeholder="Minutes used today"
                placeholderTextColor={Colors.textMuted}
                value={usageInput}
                onChangeText={setUsageInput}
                autoFocus
              />

              <View style={styles.quickAddRow}>
                {[15, 30, 60, 120].map((addMins) => (
                  <TouchableOpacity
                    key={addMins}
                    style={styles.quickAddBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      const curr = parseInt(usageInput, 10) || 0;
                      setUsageInput(String(curr + addMins));
                    }}
                  >
                    <Text style={styles.quickAddText}>+{addMins}m</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveUsage}>
                <Ionicons name="cloud-upload-outline" size={18} color="#09090B" />
                <Text style={styles.primaryBtnText}>Update Today's Usage</Text>
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    width: '31%',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  presetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  quickAddBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 8,
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
