import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { AIResumeParserService, ParsedResumeResult } from '@/core/services/ai-resume-parser';
import { useCandidateProfileStore } from '../state/candidate-profile-store';
import { useJobStore } from '../state/job-store';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const AiResumeParserModal: React.FC<Props> = ({ visible, onClose, onApplied }) => {
  const applyParsedResumeData = useCandidateProfileStore((s) => s.applyParsedResumeData);
  const addResumeItem = useCandidateProfileStore((s) => s.addResumeItem);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);
  const [rawText, setRawText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('');
  const [parsedData, setParsedData] = useState<ParsedResumeResult | null>(null);

  const handlePickFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
        });
        setParsedData(null);
      }
    } catch (err) {
      console.warn('File picker error:', err);
    }
  };

  const handleScanFile = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    setScanningStatus('Reading document layout & text...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      setScanningStatus('Extracting text & decoding PDF layout...');
      const result = await AIResumeParserService.parseResumeFromUri(
        selectedFile.uri,
        selectedFile.name
      );

      if (result.success && result.data) {
        setParsedData(result.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Alert.alert(
          'Scan Incomplete',
          result.error ||
            'Could not extract text from this PDF file. Try pasting resume text or tap "1-Tap Load Master Profile".'
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to scan resume. Check network or try pasting text.');
    } finally {
      setIsScanning(false);
      setScanningStatus('');
    }
  };

  const handleScanText = async () => {
    if (!rawText.trim() || rawText.trim().length < 30) {
      Alert.alert('Insufficient Text', 'Please paste at least a paragraph of your resume or LinkedIn profile.');
      return;
    }
    setIsScanning(true);
    setScanningStatus('AI is analyzing resume text & tech stack...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const result = await AIResumeParserService.parseResumeFromText(rawText);
      if (result.success && result.data) {
        setParsedData(result.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Alert.alert('Scan Incomplete', result.error || 'Could not parse text accurately.');
      }
    } catch {
      Alert.alert('Error', 'Failed to analyze text.');
    } finally {
      setIsScanning(false);
      setScanningStatus('');
    }
  };

  const handleLoadMasterProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const master = AIResumeParserService.getMasterProfileData();
    setParsedData(master);
  };

  const handleApplyToProfile = () => {
    if (!parsedData) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // 1. Populate Candidate Profile Store
    applyParsedResumeData(parsedData);

    // 2. Also save as an uploaded resume entry if a file was selected or master profile
    if (selectedFile) {
      addResumeItem({
        name: selectedFile.name.replace(/\.[^/.]+$/, ''),
        targetRole: parsedData.targetRole || 'Frontend Developer',
        fileName: selectedFile.name,
        uri: selectedFile.uri,
        fileSize: selectedFile.size || null,
        uploadedAt: new Date().toISOString().split('T')[0],
        isDefault: true,
      });
    } else {
      addResumeItem({
        name: 'Master Profile (Bharathi V)',
        targetRole: parsedData.targetRole || 'Frontend Developer | Team Lead',
        fileName: 'cv.md',
        uri: '',
        fileSize: null,
        uploadedAt: new Date().toISOString().split('T')[0],
        isDefault: true,
      });
    }

    Alert.alert(
      'Profile Auto-Filled! 🎉',
      `Successfully imported:\n• ${parsedData.skills.length} Tech Skills\n• ${parsedData.experiences.length} Work Experiences\n• ${parsedData.educations.length} Education Records\n\nYour ATS Scanner and Job Preferences are now completely updated!`,
      [
        {
          text: 'Great!',
          onPress: () => {
            if (onApplied) onApplied();
            onClose();
          },
        },
      ]
    );
  };

  const handleReset = () => {
    setSelectedFile(null);
    setRawText('');
    setParsedData(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  AI Smart Resume Parser
                </Text>
                <Badge label="AUTONOMOUS" variant="purple" />
              </View>
              <Text style={styles.sheetSub} numberOfLines={1}>
                Upload PDF or paste text to auto-fill your master candidate profile & skills
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Mode Tabs */}
          {!parsedData && (
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab('upload');
                }}
              >
                <Ionicons
                  name="document-text"
                  size={14}
                  color={activeTab === 'upload' ? Colors.cyan : Colors.textMuted}
                />
                <Text style={[styles.tabBtnText, activeTab === 'upload' && styles.tabBtnTextActive]}>
                  Upload PDF File
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'paste' && styles.tabBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab('paste');
                }}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={14}
                  color={activeTab === 'paste' ? Colors.cyan : Colors.textMuted}
                />
                <Text style={[styles.tabBtnText, activeTab === 'paste' && styles.tabBtnTextActive]}>
                  Paste Resume Text
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* If scanning in progress */}
            {isScanning && (
              <View style={styles.scanningBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningTitle}>AI Scanning in Progress...</Text>
                <Text style={styles.scanningSubtitle}>{scanningStatus}</Text>
              </View>
            )}

            {/* 1-Tap Load Master Profile (From career-ops Source of Truth) */}
            {!isScanning && !parsedData && (
              <TouchableOpacity
                style={styles.masterProfileBanner}
                onPress={handleLoadMasterProfile}
                activeOpacity={0.85}
              >
                <View style={styles.masterProfileIcon}>
                  <Ionicons name="flash" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.masterProfileTitle}>1-Tap Load Master Profile</Text>
                    <Badge label="CAREER-OPS" variant="purple" />
                  </View>
                  <Text style={styles.masterProfileSub}>
                    Verified Facts: Bharathi V • Sagasoft Lead • MCA & B.Sc • 24+ Skills
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}

            {/* TAB 1: UPLOAD FILE */}
            {!isScanning && !parsedData && activeTab === 'upload' && (
              <View style={styles.uploadArea}>
                <TouchableOpacity
                  style={[styles.filePickerCard, selectedFile ? styles.filePickerCardSelected : null]}
                  onPress={handlePickFile}
                  activeOpacity={0.8}
                >
                  <View style={styles.fileIconCircle}>
                    <Ionicons
                      name={selectedFile ? 'document-attach' : 'cloud-upload-outline'}
                      size={28}
                      color={selectedFile ? Colors.primary : Colors.cyan}
                    />
                  </View>
                  {selectedFile ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.selectedFileSize}>
                        {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(0)} KB • ` : ''}
                        Ready for AI extraction
                      </Text>
                      <Text style={styles.tapToChangeText}>Tap to choose another file</Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.pickerTitle}>Select Resume (PDF / DOCX)</Text>
                      <Text style={styles.pickerSub}>
                        Tap here to browse from your device storage
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {selectedFile && (
                  <TouchableOpacity
                    style={styles.primaryScanBtn}
                    onPress={handleScanFile}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="sparkles" size={16} color={Colors.textInverse} />
                    <Text style={styles.primaryScanBtnText}>Scan & Auto-Extract Details with AI</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* TAB 2: PASTE TEXT */}
            {!isScanning && !parsedData && activeTab === 'paste' && (
              <View style={styles.pasteArea}>
                <Text style={styles.pasteLabel}>Paste Resume or LinkedIn Profile Content:</Text>
                <TextInput
                  style={styles.pasteInput}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  placeholder="Paste text here... (e.g. Bharathi Ragav, MCA Graduate, Skills: React Native, Node.js, TypeScript...)"
                  placeholderTextColor={Colors.textMuted}
                  value={rawText}
                  onChangeText={setRawText}
                />
                <TouchableOpacity
                  style={[styles.primaryScanBtn, { marginTop: 12 }]}
                  onPress={handleScanText}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={16} color={Colors.textInverse} />
                  <Text style={styles.primaryScanBtnText}>Parse Text & Extract Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* RESULTS PREVIEW */}
            {!isScanning && parsedData && (
              <View style={styles.resultsWrap}>
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.successBannerText}>AI Extraction Succeeded!</Text>
                </View>

                {/* Personal Snapshot */}
                <View style={styles.resultCard}>
                  <Text style={styles.resultCardHeader}>👤 Personal & Target Role</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{parsedData.name || 'Not specified'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Target Role:</Text>
                    <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: '700' }]}>
                      {parsedData.targetRole}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Experience:</Text>
                    <Text style={styles.infoValue}>{parsedData.yearsOfExperience}</Text>
                  </View>
                  {parsedData.email ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{parsedData.email}</Text>
                    </View>
                  ) : null}
                  {parsedData.phone ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone:</Text>
                      <Text style={styles.infoValue}>{parsedData.phone}</Text>
                    </View>
                  ) : null}
                  {parsedData.currentCity ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>City:</Text>
                      <Text style={styles.infoValue}>{parsedData.currentCity}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Extracted Skills */}
                <View style={styles.resultCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.resultCardHeader}>⚡ Extracted Tech Skills</Text>
                    <Badge label={`${parsedData.skills.length} Skills`} variant="primary" />
                  </View>
                  <View style={styles.skillsPillWrap}>
                    {parsedData.skills.map((skill, idx) => (
                      <View key={idx} style={styles.skillPill}>
                        <Text style={styles.skillPillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Experiences */}
                {parsedData.experiences.length > 0 && (
                  <View style={styles.resultCard}>
                    <Text style={styles.resultCardHeader}>💼 Work Experience ({parsedData.experiences.length})</Text>
                    {parsedData.experiences.map((exp, idx) => (
                      <View key={idx} style={styles.itemBox}>
                        <Text style={styles.itemTitle}>{exp.jobTitle} • {exp.companyName}</Text>
                        <Text style={styles.itemSubtitle}>{exp.startDate} - {exp.endDate} ({exp.workMode})</Text>
                        {exp.responsibilities ? (
                          <Text style={styles.itemDesc} numberOfLines={2}>{exp.responsibilities}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Educations */}
                {parsedData.educations.length > 0 && (
                  <View style={styles.resultCard}>
                    <Text style={styles.resultCardHeader}>🎓 Education ({parsedData.educations.length})</Text>
                    {parsedData.educations.map((edu, idx) => (
                      <View key={idx} style={styles.itemBox}>
                        <Text style={styles.itemTitle}>{edu.degree} ({edu.qualification})</Text>
                        <Text style={styles.itemSubtitle}>{edu.college} • {edu.graduationYear} {edu.grade ? `• ${edu.grade}` : ''}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions Row */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Text style={styles.resetBtnText}>Re-scan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.applyBtn} onPress={handleApplyToProfile}>
                    <Ionicons name="checkmark-done" size={16} color={Colors.textInverse} />
                    <Text style={styles.applyBtnText}>Apply All to Master Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    maxHeight: '92%',
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
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.sm,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  tabBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabBtnTextActive: {
    color: Colors.cyan,
    fontWeight: '700',
  },
  bodyScroll: {
    maxHeight: 520,
  },
  masterProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 12,
  },
  masterProfileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterProfileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  masterProfileSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  uploadArea: {
    paddingVertical: Spacing.sm,
  },
  filePickerCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderActive,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  filePickerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  fileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pickerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: 240,
  },
  selectedFileSize: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  tapToChangeText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  primaryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
  },
  primaryScanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  pasteArea: {
    paddingVertical: Spacing.sm,
  },
  pasteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  pasteInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 12,
    minHeight: 140,
  },
  scanningBox: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  scanningSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  resultsWrap: {
    paddingVertical: Spacing.xs,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  resultCardHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  skillsPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
  },
  skillPillText: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '600',
  },
  itemBox: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 6,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.md,
    marginBottom: Platform.OS === 'android' ? 32 : Spacing.lg,
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});

