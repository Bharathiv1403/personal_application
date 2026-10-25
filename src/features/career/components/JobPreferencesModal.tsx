import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useCandidateProfileStore } from '../state/candidate-profile-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const JobPreferencesModal: React.FC<Props> = ({ visible, onClose }) => {
  const preferences = useCandidateProfileStore((s) => s.preferences);
  const updatePreferences = useCandidateProfileStore((s) => s.updatePreferences);

  const [minSalary, setMinSalary] = useState(String(preferences.minimumSalaryLPA || 18));
  const [maxSalary, setMaxSalary] = useState(String(preferences.maximumSalaryLPA || 32));
  const [threshold, setThreshold] = useState(preferences.skillsMatchThreshold || 75);
  const [autoApply, setAutoApply] = useState(preferences.autoApplyEnabled);
  const [dailyLimit, setDailyLimit] = useState(String(preferences.dailyApplicationLimit || 15));
  const [locations, setLocations] = useState(preferences.preferredLocations.join(', '));
  const [workModes, setWorkModes] = useState<string[]>(preferences.workModes);

  React.useEffect(() => {
    if (visible) {
      setMinSalary(String(preferences.minimumSalaryLPA || 18));
      setMaxSalary(String(preferences.maximumSalaryLPA || 32));
      setThreshold(preferences.skillsMatchThreshold || 75);
      setAutoApply(preferences.autoApplyEnabled);
      setDailyLimit(String(preferences.dailyApplicationLimit || 15));
      setLocations(preferences.preferredLocations.join(', '));
      setWorkModes(preferences.workModes);
    }
  }, [visible, preferences]);

  const toggleWorkMode = (mode: 'Remote' | 'Hybrid' | 'On-site') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (workModes.includes(mode)) {
      if (workModes.length > 1) {
        setWorkModes(workModes.filter((m) => m !== mode));
      }
    } else {
      setWorkModes([...workModes, mode]);
    }
  };

  const handleSave = () => {
    const numMin = parseFloat(minSalary) || 18;
    const numMax = parseFloat(maxSalary) || 32;
    const numLimit = parseInt(dailyLimit, 10) || 15;

    const locArray = locations
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    updatePreferences({
      minimumSalaryLPA: numMin,
      maximumSalaryLPA: numMax,
      skillsMatchThreshold: threshold,
      autoApplyEnabled: autoApply,
      dailyApplicationLimit: numLimit,
      preferredLocations: locArray.length > 0 ? locArray : ['Chennai', 'Remote'],
      workModes: workModes as any,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('Preferences Saved 🎯', 'Job matching and search rules have been updated.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Job Search & Auto-Apply Rules</Text>
              <Text style={styles.modalSubtitle}>Configure matching thresholds, locations & salary</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Preferred Locations */}
            <Text style={styles.fieldLabel}>Target Locations (Comma-separated)</Text>
            <TextInput
              style={styles.textInput}
              value={locations}
              onChangeText={setLocations}
              placeholder="e.g. Chennai, Bengaluru, Remote"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Work Modes */}
            <Text style={styles.fieldLabel}>Allowed Work Modes</Text>
            <View style={styles.chipRow}>
              {(['Remote', 'Hybrid', 'On-site'] as const).map((m) => {
                const isSelected = workModes.includes(m);
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeChip, isSelected && styles.modeChipActive]}
                    onPress={() => toggleWorkMode(m)}
                  >
                    <Ionicons
                      name={m === 'Remote' ? 'globe' : m === 'Hybrid' ? 'business' : 'location'}
                      size={14}
                      color={isSelected ? '#FFFFFF' : Colors.textMuted}
                    />
                    <Text style={[styles.modeChipText, isSelected && styles.modeChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Salary Range */}
            <Text style={styles.fieldLabel}>Expected Annual Salary Range (LPA)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={minSalary}
                  onChangeText={setMinSalary}
                  keyboardType="numeric"
                  placeholder="Min (e.g. 18)"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textInput}
                  value={maxSalary}
                  onChangeText={setMaxSalary}
                  keyboardType="numeric"
                  placeholder="Max (e.g. 32)"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Match Threshold */}
            <Text style={styles.fieldLabel}>Minimum ATS Match Score ({threshold}%)</Text>
            <View style={styles.thresholdRow}>
              {[65, 70, 75, 80, 85].map((val) => {
                const isSelected = threshold === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.thresholdChip, isSelected && styles.thresholdChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setThreshold(val);
                    }}
                  >
                    <Text style={[styles.thresholdText, isSelected && styles.thresholdTextActive]}>
                      {val}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Auto-Apply Toggle */}
            <View style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Auto-Fill & Assisted Apply</Text>
                <Text style={styles.toggleDesc}>
                  Pre-fills stored profile, matching resume & generates AI cover letter before opening application.
                </Text>
              </View>
              <Switch
                value={autoApply}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setAutoApply(val);
                }}
                trackColor={{ false: '#374151', true: Colors.primary }}
              />
            </View>

            {/* Daily Application Limit */}
            <Text style={styles.fieldLabel}>Daily Max Applications Limit</Text>
            <TextInput
              style={styles.textInput}
              value={dailyLimit}
              onChangeText={setDailyLimit}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={Colors.textMuted}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  modeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  thresholdChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#10B981',
  },
  thresholdText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  thresholdTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginTop: 14,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.sm,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
