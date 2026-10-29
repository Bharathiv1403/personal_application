import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { AIService } from '@/core/utils/ai-service';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { JobApplicationItem } from '../state/job-store';

interface AiCoverLetterModalProps {
  visible: boolean;
  job: JobApplicationItem | null;
  onClose: () => void;
  onApply: (job: JobApplicationItem) => void;
}

export const AiCoverLetterModal: React.FC<AiCoverLetterModalProps> = ({
  visible,
  job,
  onClose,
  onApply,
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const isAiConfigured = useAiConfigStore((s) => s.isConfigured);
  const hasKey = isAiConfigured || AIService.hasConfiguredKey();

  useEffect(() => {
    if (visible && job) {
      loadCoverLetter();
    }
  }, [visible, job]);

  const loadCoverLetter = async () => {
    if (!job) return;
    setLoading(true);
    setCoverLetter('');
    try {
      const generated = await AIService.generateCoverLetter(
        job.companyName,
        job.role,
        job.tags || []
      );
      setCoverLetter(generated);
    } catch {
      setCoverLetter('Error generating cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('Copied to Clipboard 📋', 'Cover letter text is ready to paste into your application!');
  };

  if (!job) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={16} color={Colors.gold} />
                <Text style={styles.headerTitle}>AI Tailored Cover Letter</Text>
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {job.role} • {job.companyName}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setApiKeyModalVisible(true)}
                style={styles.keyBtn}
              >
                <Ionicons name="key" size={15} color={hasKey ? '#10B981' : '#F59E0B'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {!hasKey && (
            <TouchableOpacity
              style={styles.keyBanner}
              onPress={() => setApiKeyModalVisible(true)}
            >
              <Ionicons name="key-outline" size={14} color="#F59E0B" />
              <Text style={styles.keyBannerText}>
                Add free Gemini / Groq key to unlock customized AI letters.
              </Text>
            </TouchableOpacity>
          )}

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Generating executive cover letter with Gemini AI...</Text>
              </View>
            ) : (
              <TextInput
                style={styles.letterInput}
                multiline
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder="Cover letter will appear here..."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
              disabled={loading || !coverLetter}
            >
              <Ionicons name="copy-outline" size={16} color={Colors.textPrimary} />
              <Text style={styles.copyButtonText}>Copy Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onApply(job);
                onClose();
              }}
            >
              <Ionicons name="rocket-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.applyButtonText}>1-Click Apply Now 🚀</Text>
            </TouchableOpacity>
          </View>

          <ApiKeyModal
            visible={apiKeyModalVisible}
            onClose={() => setApiKeyModalVisible(false)}
            onSuccess={() => loadCoverLetter()}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#121215',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '85%',
    minHeight: '60%',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginVertical: Spacing.md,
    maxHeight: 380,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  letterInput: {
    backgroundColor: '#18181C',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    padding: Spacing.md,
    minHeight: 260,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  copyButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  applyButtonText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  keyBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: '#1E1E24',
  },
  keyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#272010',
    borderWidth: 1,
    borderColor: '#784E0E',
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  keyBannerText: {
    fontSize: 11,
    color: '#FCD34D',
    flex: 1,
    fontWeight: '500',
  },
});
