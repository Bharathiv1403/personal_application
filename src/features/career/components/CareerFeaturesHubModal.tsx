import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { useEnglishLearningStore } from '@/features/learning/state/english-learning-store';
import { useMessageWriterStore } from '../state/message-writer-store';
import { useVaultStore } from '@/features/vault/state/vault-store';

export interface CareerFeaturesHubModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenAddJob: () => void;
  onOpenFlashcards: () => void;
  onOpenInterviewRetro: () => void;
  onOpenAiKey: () => void;
  onOpenReferralOutreach: () => void;
  onOpenOfferNegotiator: () => void;
  onOpenAtsScanner: () => void;
  onOpenInHandCtc: () => void;
  onOpenAiCoach: () => void;
  onOpenProfile: () => void;
  onOpenPreferences: () => void;
  onOpenAnswerBank: () => void;
  onExportCsv: () => void;
  hasAiKey: boolean;
  totalJobsCount: number;
}

type CategoryType = 'all' | 'ai' | 'outreach' | 'calculators' | 'profile';

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryType;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  badge?: string;
  badgeVariant?: 'primary' | 'purple' | 'gold' | 'cyan' | 'neutral';
  action: () => void;
}

export const CareerFeaturesHubModal: React.FC<CareerFeaturesHubModalProps> = ({
  visible,
  onClose,
  onOpenAddJob,
  onOpenFlashcards,
  onOpenInterviewRetro,
  onOpenAiKey,
  onOpenReferralOutreach,
  onOpenOfferNegotiator,
  onOpenAtsScanner,
  onOpenInHandCtc,
  onOpenAiCoach,
  onOpenProfile,
  onOpenPreferences,
  onOpenAnswerBank,
  onExportCsv,
  hasAiKey,
  totalJobsCount,
}) => {
  const navigation = useNavigation<any>();
  const signOut = useAuthStore((s) => s.signOut);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');

  const triggerAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
    setTimeout(() => {
      action();
    }, 250);
  };

  const allFeatures: FeatureItem[] = useMemo(
    () => [
      // AI & Interview Suite
      {
        id: 'english-practice',
        title: 'English Daily Practice & Image Learner 🇬🇧',
        subtitle: 'Day 1 active lessons, Tamil mother-tongue translation & camera object scanner',
        category: 'ai',
        icon: 'book',
        color: '#38BDF8',
        badge: 'Day 1 ⚡',
        badgeVariant: 'cyan',
        action: () => triggerAction(() => useEnglishLearningStore.getState().openModal()),
      },
      {
        id: 'smart-email-writer',
        title: 'Smart Workplace Email & Message Writer ✉️',
        subtitle: 'Leave, appraisal, referral, WFH & incident emails with Tamil explanation',
        category: 'outreach',
        icon: 'mail',
        color: '#10B981',
        badge: 'Workplace ⚡',
        badgeVariant: 'cyan',
        action: () => triggerAction(() => useMessageWriterStore.getState().openModal()),
      },
      {
        id: 'vault-passwords',
        title: 'KeePass Password Vault 🔐',
        subtitle: 'Zero-knowledge encrypted passwords, 2FA TOTP & credentials',
        category: 'profile',
        icon: 'shield-checkmark',
        color: '#6366F1',
        badge: 'Vault 🛡️',
        badgeVariant: 'purple',
        action: () => triggerAction(() => useVaultStore.getState().openModal()),
      },
      {
        id: 'ai-coach',
        title: 'AI Interview Coach',
        subtitle: 'Live technical & behavioral mock interview with real-time feedback',
        category: 'ai',
        icon: 'chatbubble-ellipses',
        color: '#C084FC',
        badge: 'Interactive',
        badgeVariant: 'purple',
        action: () => triggerAction(onOpenAiCoach),
      },
      {
        id: 'flashcards',
        title: '⚡ 10m Pre-Interview Flashcards',
        subtitle: 'High-yield technical questions & quick concepts before your call',
        category: 'ai',
        icon: 'flash',
        color: '#F59E0B',
        badge: 'High Yield',
        badgeVariant: 'gold',
        action: () => triggerAction(onOpenFlashcards),
      },
      {
        id: 'interview-retro',
        title: 'Interview Retrospective',
        subtitle: 'Log questions asked, note what went well and topics to revise',
        category: 'ai',
        icon: 'sparkles',
        color: '#06B6D4',
        badge: 'Debrief',
        badgeVariant: 'cyan',
        action: () => triggerAction(onOpenInterviewRetro),
      },
      {
        id: 'ai-key',
        title: 'AI API Key Setup',
        subtitle: 'Configure your Gemini / DeepSeek / OpenAI key for unlimited coaching',
        category: 'ai',
        icon: 'key',
        color: hasAiKey ? '#10B981' : '#F59E0B',
        badge: hasAiKey ? 'Active 🟢' : 'Setup 🔑',
        badgeVariant: hasAiKey ? 'primary' : 'gold',
        action: () => triggerAction(onOpenAiKey),
      },

      // Applications & Outreach
      {
        id: 'outreach',
        title: 'Referral & Outreach Generator',
        subtitle: 'Generate cold LinkedIn & email DMs for recruiters and engineers',
        category: 'outreach',
        icon: 'people',
        color: '#38BDF8',
        badge: 'High Response',
        badgeVariant: 'cyan',
        action: () => triggerAction(onOpenReferralOutreach),
      },
      {
        id: 'add-job',
        title: 'Add Job Application',
        subtitle: 'Track a custom role, salary bounds, recruiter contacts & status',
        category: 'outreach',
        icon: 'add-circle',
        color: '#10B981',
        badge: 'Pipeline',
        badgeVariant: 'primary',
        action: () => triggerAction(onOpenAddJob),
      },
      {
        id: 'answer-bank',
        title: 'Interview Answer Bank',
        subtitle: 'Ready-made answers for strengths, weaknesses, and career gaps',
        category: 'outreach',
        icon: 'bookmark',
        color: '#2DD4BF',
        badge: 'Cheat Sheet',
        badgeVariant: 'cyan',
        action: () => triggerAction(onOpenAnswerBank),
      },
      {
        id: 'export-csv',
        title: 'Export Pipeline CSV',
        subtitle: `Share or download spreadsheet of your ${totalJobsCount} job applications`,
        category: 'outreach',
        icon: 'download-outline',
        color: '#60A5FA',
        action: () => triggerAction(onExportCsv),
      },

      // Calculators & Diagnostic Tools
      {
        id: 'ats-scanner',
        title: 'ATS Resume Scanner',
        subtitle: 'Match resume against job descriptions & generate missing skill bullets',
        category: 'calculators',
        icon: 'scan-outline',
        color: '#06B6D4',
        badge: 'ATS Score',
        badgeVariant: 'cyan',
        action: () => triggerAction(onOpenAtsScanner),
      },
      {
        id: 'inhand-ctc',
        title: 'In-Hand CTC Calculator',
        subtitle: 'Calculate monthly take-home salary, EPF, and New Tax Regime deductions',
        category: 'calculators',
        icon: 'calculator-outline',
        color: '#F59E0B',
        badge: 'India Tax FY25',
        badgeVariant: 'gold',
        action: () => triggerAction(onOpenInHandCtc),
      },
      {
        id: 'offer-negotiator',
        title: 'Offer Negotiator & Levers',
        subtitle: 'Evaluate CTC offers, calculate counter-proposals and negotiate equity',
        category: 'calculators',
        icon: 'scale',
        color: '#F97316',
        badge: 'Strategy',
        badgeVariant: 'gold',
        action: () => triggerAction(onOpenOfferNegotiator),
      },

      // Profile & Targeting
      {
        id: 'profile',
        title: 'Profile & PDF Resumes',
        subtitle: 'Manage work experience, tech stack skills, and upload resumes',
        category: 'profile',
        icon: 'person',
        color: '#818CF8',
        action: () => triggerAction(onOpenProfile),
      },
      {
        id: 'preferences',
        title: 'Job Search Preferences',
        subtitle: 'Set target CTC, minimum ATS match threshold, and remote filters',
        category: 'profile',
        icon: 'options',
        color: '#38BDF8',
        action: () => triggerAction(onOpenPreferences),
      },
    ],
    [hasAiKey, totalJobsCount]
  );

  const filteredFeatures = useMemo(() => {
    return allFeatures.filter((f) => {
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        f.title.toLowerCase().includes(q) ||
        f.subtitle.toLowerCase().includes(q)
      );
    });
  }, [allFeatures, selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', label: `All (${allFeatures.length})` },
    { id: 'ai', label: 'AI & Coaching 🤖' },
    { id: 'outreach', label: 'Outreach & Jobs 💼' },
    { id: 'calculators', label: 'Calculators 📊' },
    { id: 'profile', label: 'Profile ⚙️' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Top Handle Indicator */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sheetTitle}>Career Feature Hub</Text>
                <Badge label={`${allFeatures.length} Tools`} variant="primary" />
              </View>
              <Text style={styles.sheetSub}>
                All career coaching, diagnostic, and outreach tools in one place
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search features (e.g. ATS, CTC, Flashcards, Outreach)..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {categories.map((c) => {
              const active = selectedCategory === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedCategory(c.id as CategoryType);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Feature List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.featuresList}
            contentContainerStyle={styles.featuresListContent}
          >
            {filteredFeatures.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No features found</Text>
                <Text style={styles.emptySub}>
                  Try a different search term or check all categories.
                </Text>
              </View>
            ) : (
              filteredFeatures.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.featureCard}
                  activeOpacity={0.75}
                  onPress={item.action}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: item.color + '20', borderColor: item.color + '40' },
                    ]}
                  >
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>

                  <View style={styles.featureInfo}>
                    <View style={styles.featureTitleRow}>
                      <Text style={styles.featureTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.badge && (
                        <Badge
                          label={item.badge}
                          variant={item.badgeVariant || 'neutral'}
                        />
                      )}
                    </View>
                    <Text style={styles.featureSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.textMuted}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Bottom Bar: Settings & Logout */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.footerBtn}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
                setTimeout(() => {
                  navigation.navigate('Settings');
                }, 200);
              }}
            >
              <Ionicons name="settings-outline" size={17} color="#94A3B8" />
              <Text style={styles.footerBtnText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.footerDivider} />

            <TouchableOpacity
              style={[styles.footerBtn, styles.logoutBtn]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                Alert.alert(
                  'Lock Vault / Logout',
                  'Are you sure you want to log out and lock your personal vault?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Logout 🔒',
                      style: 'destructive',
                      onPress: () => {
                        onClose();
                        signOut();
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={17} color="#F87171" />
              <Text style={[styles.footerBtnText, styles.logoutBtnText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F1117',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
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
    color: '#FFFFFF',
  },
  sheetSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryContent: {
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  categoryChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#38BDF8',
  },
  featuresList: {
    maxHeight: 460,
  },
  featuresListContent: {
    gap: 8,
    paddingBottom: Spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: 12,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  featureSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  footerDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnText: {
    color: '#F87171',
  },
});
