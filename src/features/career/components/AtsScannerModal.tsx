import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { AIService } from '@/core/utils/ai-service';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { useJobStore } from '../state/job-store';

interface AtsScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AtsScannerModal: React.FC<AtsScannerModalProps> = ({ visible, onClose }) => {
  const calculateJdMatch = useJobStore((s) => s.calculateJdMatch);
  const resumeSkills = useJobStore((s) => s.myResumeSkills);

  const [jdText, setJdText] = useState('');
  const [isGeneratingBullets, setIsGeneratingBullets] = useState(false);
  const [tailoredBullets, setTailoredBullets] = useState<string[]>([]);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const [scanResult, setScanResult] = useState<{
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  } | null>(null);

  const handleScan = () => {
    if (!jdText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const result = calculateJdMatch(jdText);
    setScanResult(result);
  };

  const handleGenerateAiBullets = async () => {
    if (!jdText.trim()) return;
    if (!AIService.hasConfiguredKey() && !useAiConfigStore.getState().isConfigured) {
      setApiKeyModalVisible(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsGeneratingBullets(true);
    try {
      const bullets = await AIService.generateResumeOptimizationBullets(jdText, resumeSkills);
      setTailoredBullets(bullets);
    } catch {
      Alert.alert('AI Key Required', 'Could not generate bullets. Please configure your free Gemini or Groq API key.');
    } finally {
      setIsGeneratingBullets(false);
    }
  };

  const handleCopyBullet = async (bullet: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await Share.share({ message: bullet });
    } catch {
      Alert.alert('Copied 📋', 'Bullet point ready to paste into your resume experience section!');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>ATS Resume Match Scanner</Text>
                <Text style={styles.sheetSub}>Compare any Job Description against your profile</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Resume Skills Summary */}
            <View style={styles.skillsBox}>
              <Text style={styles.skillsBoxTitle}>Your Master Skills Inventory ({resumeSkills.length} Skills):</Text>
              <View style={styles.skillsWrap}>
                {resumeSkills.slice(0, 8).map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Input Box */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Paste Job Description (JD) text:</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={5}
                placeholder="Paste requirements, tech stack, and responsibilities here..."
                placeholderTextColor={Colors.textMuted}
                value={jdText}
                onChangeText={setJdText}
              />
            </View>

            <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
              <Ionicons name="scan" size={18} color={Colors.textInverse} />
              <Text style={styles.scanBtnText}>Analyze JD & Compute ATS Match Score</Text>
            </TouchableOpacity>

            {/* Results Display */}
            {scanResult && (
              <View style={styles.resultContainer}>
                <View style={styles.resultHeader}>
                  <View>
                    <Text style={styles.scoreBig}>{scanResult.matchScore}%</Text>
                    <Text style={styles.scoreSub}>ATS Compatibility Match</Text>
                  </View>
                  <Badge
                    label={scanResult.matchScore >= 80 ? 'High Fit' : 'Moderate Fit'}
                    variant={scanResult.matchScore >= 80 ? 'primary' : 'gold'}
                  />
                </View>

                {/* Matched Keywords */}
                <View style={styles.sectionWrap}>
                  <Text style={styles.matchSecTitle}>✅ Matched Core Keywords ({scanResult.matchedSkills.length}):</Text>
                  <View style={styles.skillsWrap}>
                    {scanResult.matchedSkills.map((m) => (
                      <View key={m} style={styles.matchedChip}>
                        <Text style={styles.matchedChipText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Missing Keywords Recommendation */}
                {scanResult.missingSkills.length > 0 && (
                  <View style={styles.sectionWrap}>
                    <Text style={styles.missingSecTitle}>
                      ⚠️ High-Yield Missing Skills (Add to Resume before applying):
                    </Text>
                    <View style={styles.skillsWrap}>
                      {scanResult.missingSkills.map((m) => (
                        <View key={m} style={styles.missingChip}>
                          <Text style={styles.missingChipText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* AI Deep Resume Tailor Section */}
                <View style={styles.aiBulletsCard}>
                  <View style={styles.aiBulletsTop}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="sparkles" size={15} color="#A855F7" />
                        <Text style={styles.aiBulletsTitle}>AI Deep Resume Tailoring</Text>
                      </View>
                      <Text style={styles.aiBulletsSub}>
                        Generate 3 quantifiable bullet points targeted for this exact JD
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.aiBulletsBtn}
                      onPress={handleGenerateAiBullets}
                      disabled={isGeneratingBullets}
                    >
                      {isGeneratingBullets ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="flash" size={12} color="#FFFFFF" />
                          <Text style={styles.aiBulletsBtnText}>Generate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {tailoredBullets.length > 0 && (
                    <View style={styles.bulletsList}>
                      {tailoredBullets.map((bullet, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.bulletItem}
                          activeOpacity={0.8}
                          onPress={() => handleCopyBullet(bullet)}
                        >
                          <View style={styles.bulletIconCol}>
                            <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.bulletText}>{bullet}</Text>
                            <Text style={styles.bulletCopyHint}>Tap to copy & paste into Experience</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>

        <ApiKeyModal
          visible={apiKeyModalVisible}
          onClose={() => setApiKeyModalVisible(false)}
          onSuccess={() => handleGenerateAiBullets()}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillsBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillsBoxTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: Colors.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  skillChipText: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cyan,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  resultContainer: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreBig: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  scoreSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sectionWrap: {
    marginTop: Spacing.md,
  },
  matchSecTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 6,
  },
  matchedChip: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  matchedChipText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  missingSecTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 6,
  },
  missingChip: {
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  missingChipText: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '600',
  },
  aiBulletsCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  aiBulletsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aiBulletsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C084FC',
  },
  aiBulletsSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aiBulletsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9333EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  aiBulletsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bulletsList: {
    marginTop: Spacing.md,
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bulletIconCol: {
    marginTop: 2,
  },
  bulletText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  bulletCopyHint: {
    fontSize: 9,
    color: '#34D399',
    marginTop: 4,
    fontWeight: '600',
  },
});
