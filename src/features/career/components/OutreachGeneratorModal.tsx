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
  Share,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { AIService } from '@/core/utils/ai-service';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { JobApplicationItem } from '../state/job-store';

export type OutreachType = 'linkedin_connect' | 'referral_request' | 'recruiter_inmail' | 'follow_up_checkin';

interface Props {
  visible: boolean;
  job: JobApplicationItem | null;
  defaultType?: OutreachType;
  onClose: () => void;
}

const OUTREACH_TABS: { type: OutreachType; label: string; icon: any; maxChars?: number }[] = [
  { type: 'linkedin_connect', label: 'LinkedIn Note', icon: 'logo-linkedin', maxChars: 300 },
  { type: 'referral_request', label: '1-on-1 Referral', icon: 'people-outline' },
  { type: 'recruiter_inmail', label: 'Recruiter Pitch', icon: 'briefcase-outline' },
  { type: 'follow_up_checkin', label: 'Follow-Up ⏳', icon: 'time-outline' },
];

export const OutreachGeneratorModal: React.FC<Props> = ({
  visible,
  job,
  defaultType = 'linkedin_connect',
  onClose,
}) => {
  const [activeType, setActiveType] = useState<OutreachType>(defaultType);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const isAiConfigured = useAiConfigStore((s) => s.isConfigured);
  const hasKey = isAiConfigured || AIService.hasConfiguredKey();

  useEffect(() => {
    if (visible && defaultType) {
      setActiveType(defaultType);
    }
  }, [visible, defaultType]);

  useEffect(() => {
    if (visible && job) {
      generateContent(activeType);
    }
  }, [visible, job, activeType]);

  const generateContent = async (type: OutreachType) => {
    if (!job) return;
    setLoading(true);
    try {
      const generated = await AIService.generateOutreachPitch(
        type,
        job.companyName,
        job.role,
        job.recruiterName,
        job.tags || []
      );
      setMessage(generated);
    } catch {
      setMessage('Failed to generate pitch. Please tap regenerate.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await Share.share({ message });
    } catch {
      Alert.alert('Copied 📋', 'Outreach message is ready to paste into LinkedIn or Email!');
    }
  };

  const handleSendWhatsApp = () => {
    if (!job?.recruiterPhone) {
      Alert.alert('Phone not found', 'No recruiter phone is saved for this job.');
      return;
    }
    const cleanPhone = job.recruiterPhone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  const handleSendEmail = () => {
    const to = job?.recruiterEmail || '';
    const subject = encodeURIComponent(`Regarding ${job?.role || 'Opportunity'} at ${job?.companyName || ''}`);
    const body = encodeURIComponent(message);
    Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Email Error', 'Could not open mail app.');
    });
  };

  if (!job) return null;

  const currentTabInfo = OUTREACH_TABS.find((t) => t.type === activeType);
  const charCount = message.length;
  const isOverLimit = currentTabInfo?.maxChars ? charCount > currentTabInfo.maxChars : false;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="paper-plane" size={16} color="#38BDF8" />
                <Text style={styles.headerTitle}>Outreach & Referral Engine</Text>
              </View>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {job.role} • {job.companyName}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setApiKeyModalVisible(true)}
                style={{ padding: 6, borderRadius: Radii.sm, backgroundColor: '#1E1E24' }}
              >
                <Ionicons name="key" size={15} color={hasKey ? '#10B981' : '#F59E0B'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Segmented Channel Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {OUTREACH_TABS.map((tab) => {
              const isActive = activeType === tab.type;
              return (
                <TouchableOpacity
                  key={tab.type}
                  style={[styles.channelTab, isActive && styles.channelTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setActiveType(tab.type);
                  }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : Colors.textMuted}
                  />
                  <Text style={[styles.channelTabText, isActive && styles.channelTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Character Counter & Badges */}
          <View style={styles.metaRow}>
            {currentTabInfo?.maxChars ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={[
                    styles.counterText,
                    isOverLimit ? { color: '#EF4444' } : { color: '#38BDF8' },
                  ]}
                >
                  {charCount} / {currentTabInfo.maxChars} chars
                </Text>
                {isOverLimit && <Badge label="Exceeds LinkedIn Limit" variant="danger" />}
              </View>
            ) : (
              <Text style={styles.counterText}>{charCount} characters</Text>
            )}

            <TouchableOpacity
              style={styles.regenBtn}
              onPress={() => generateContent(activeType)}
              disabled={loading}
            >
              <Ionicons name="refresh" size={13} color="#F59E0B" />
              <Text style={styles.regenBtnText}>Regenerate AI</Text>
            </TouchableOpacity>
          </View>

          {/* Text Area */}
          <View style={styles.inputCard}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#38BDF8" />
                <Text style={styles.loadingText}>Crafting high-conversion pitch...</Text>
              </View>
            ) : (
              <TextInput
                style={styles.messageInput}
                multiline
                value={message}
                onChangeText={setMessage}
                placeholder="Message will appear here..."
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
            )}
          </View>

          {/* Direct HR quick-send buttons if available */}
          {(job.recruiterPhone || job.recruiterEmail) && (
            <View style={styles.directSendRow}>
              {job.recruiterPhone && (
                <TouchableOpacity style={styles.quickSendBtn} onPress={handleSendWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={14} color="#22C55E" />
                  <Text style={[styles.quickSendText, { color: '#22C55E' }]}>WhatsApp HR</Text>
                </TouchableOpacity>
              )}
              {job.recruiterEmail && (
                <TouchableOpacity style={styles.quickSendBtn} onPress={handleSendEmail}>
                  <Ionicons name="mail" size={14} color="#38BDF8" />
                  <Text style={[styles.quickSendText, { color: '#38BDF8' }]}>Email HR</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.copyShareBtn} onPress={handleCopy}>
              <Ionicons name="share-outline" size={16} color="#FFFFFF" />
              <Text style={styles.copyShareBtnText}>Copy & Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ApiKeyModal
          visible={apiKeyModalVisible}
          onClose={() => setApiKeyModalVisible(false)}
          onSuccess={() => generateContent(activeType)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
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
  tabScroll: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  channelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  channelTabActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  channelTabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  channelTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  regenBtnText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 180,
    maxHeight: 280,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  messageInput: {
    fontSize: 14,
    color: '#F1F5F9',
    lineHeight: 22,
    height: '100%',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  directSendRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  quickSendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickSendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: Spacing.xs,
  },
  copyShareBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
  },
  copyShareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
