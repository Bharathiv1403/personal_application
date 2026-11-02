import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { useMessageWriterStore } from '../state/message-writer-store';
import {
  WORKPLACE_MESSAGE_TEMPLATES,
  MessageTemplateItem,
} from '../data/workplace-message-templates';
import { AIService } from '@/core/utils/ai-service';

export const SmartMessageWriterModal: React.FC = () => {
  const isOpen = useMessageWriterStore((s) => s.isOpen);
  const closeModal = useMessageWriterStore((s) => s.closeModal);

  const [activeTab, setActiveTab] = useState<'templates' | 'ai_generator'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateItem>(
    WORKPLACE_MESSAGE_TEMPLATES[0]
  );

  // Field customization state for template
  const [managerName, setManagerName] = useState('Rahul');
  const [yourName, setYourName] = useState('Bharathi');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'Formal' | 'Friendly' | 'Direct' | 'Urgent'>('Formal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [generatedTamilSummary, setGeneratedTamilSummary] = useState('');

  if (!isOpen) return null;

  const filteredTemplates = WORKPLACE_MESSAGE_TEMPLATES.filter((t) =>
    selectedCategory === 'all' ? true : t.category === selectedCategory
  );

  // Replace placeholders in template
  const getCustomizedBody = (template: MessageTemplateItem) => {
    return template.body
      .replace(/\[Manager Name\]/g, managerName || '[Manager Name]')
      .replace(/\[Your Name\]/g, yourName || '[Your Name]')
      .replace(/\[Date\]/g, new Date().toLocaleDateString())
      .replace(/\[Today Date\]/g, new Date().toLocaleDateString());
  };

  const getCustomizedSubject = (template: MessageTemplateItem) => {
    return template.subject
      .replace(/\[Your Name\]/g, yourName || '[Your Name]')
      .replace(/\[Today Date\]/g, new Date().toLocaleDateString());
  };

  const speakText = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.88,
      });
    } catch {}
  };

  const copyToClipboard = async (text: string, key: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = async (subject: string, body: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await Share.share({
        title: subject,
        message: `${subject}\n\n${body}`,
      });
    } catch {}
  };

  const handleGenerateAiEmail = async () => {
    if (!aiPrompt.trim() || isGenerating) {
      Alert.alert('Empty Request', 'தயவுசெய்து தமிழில் அல்லது ஆங்கிலத்தில் உங்கள் தேவையை உள்ளிடவும்.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsGenerating(true);

    try {
      const prompt = `You are an expert executive business communication specialist.
Generate a high-impact corporate email or workplace message based on the user's request.
User request (can be Tamil/Tanglish/English): "${aiPrompt}"
Tone: ${aiTone}

Format your output EXACTLY as follows with no extra introduction:
SUBJECT: <single clear subject line>
BODY: <clean professional email body with proper greeting and signoff>
TAMIL_SUMMARY: <2-sentence explanation in Tamil of what this email conveys>`;

      const res = await AIService.translateText(prompt, 'en-to-ta');

      if (res && res.includes('SUBJECT:')) {
        const subjectPart = res.split('BODY:')[0].replace('SUBJECT:', '').trim();
        const bodyWithSummary = res.split('BODY:')[1] || '';
        const bodyPart = bodyWithSummary.split('TAMIL_SUMMARY:')[0].trim();
        const summaryPart = bodyWithSummary.split('TAMIL_SUMMARY:')[1]?.trim() || '';

        setGeneratedSubject(subjectPart);
        setGeneratedBody(bodyPart);
        setGeneratedTamilSummary(summaryPart);
      } else {
        setGeneratedSubject('Leave Application: ' + yourName);
        setGeneratedBody(res || 'Dear Team,\n\nI am writing to notify you regarding my upcoming absence.\n\nRegards,\n' + yourName);
        setGeneratedTamilSummary('உங்கள் விடுப்புக்கான தொழில்முறை மெயில்.');
      }
    } catch {
      Alert.alert('Error', 'மின்னஞ்சலை உருவாக்குவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Top Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>Workplace Email & Message Writer ✉️</Text>
                <Badge label="Smart AI" variant="cyan" />
              </View>
              <Text style={styles.headerSubtitle}>
                விடுப்பு, சம்பள உயர்வு & அலுவலக மெயில்கள் • தமிழ் விளக்கம் & 1-Tap Copy
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'templates' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('templates');
              }}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={activeTab === 'templates' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'templates' && styles.tabBtnTextActive]}
              >
                Smart Templates 📑
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ai_generator' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('ai_generator');
              }}
            >
              <Ionicons
                name="sparkles"
                size={14}
                color={activeTab === 'ai_generator' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'ai_generator' && styles.tabBtnTextActive]}
              >
                AI Tamil ➔ English Writer 🤖
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================================================================= */}
          {/* TAB 1: SMART TEMPLATES */}
          {/* ================================================================= */}
          {activeTab === 'templates' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={{ gap: 6 }}
              >
                {[
                  { id: 'all', label: 'All (8)' },
                  { id: 'leave', label: 'Leave 🤒' },
                  { id: 'wfh', label: 'WFH 🏠' },
                  { id: 'salary', label: 'Salary 💰' },
                  { id: 'referral', label: 'Referral 🤝' },
                  { id: 'standup', label: 'Standup 💻' },
                  { id: 'apology', label: 'Incident 🚨' },
                ].map((cat) => {
                  const isCatSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, isCatSelected && styles.catChipActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text
                        style={[styles.catChipText, isCatSelected && styles.catChipTextActive]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Template Picker Horizontal Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: Spacing.sm }}
                contentContainerStyle={{ gap: 8 }}
              >
                {filteredTemplates.map((t) => {
                  const isChosen = selectedTemplate.id === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.templatePill, isChosen && styles.templatePillActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedTemplate(t);
                      }}
                    >
                      <Text
                        style={[
                          styles.templatePillText,
                          isChosen && styles.templatePillTextActive,
                        ]}
                      >
                        {t.titleEn}
                      </Text>
                      <Text style={styles.templatePillTa}>{t.titleTa}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Personalization Inputs */}
              <View style={styles.personalizeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputMiniLabel}>Manager Name:</Text>
                  <TextInput
                    style={styles.inputMini}
                    value={managerName}
                    onChangeText={setManagerName}
                    placeholder="e.g. Rahul"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputMiniLabel}>Your Name:</Text>
                  <TextInput
                    style={styles.inputMini}
                    value={yourName}
                    onChangeText={setYourName}
                    placeholder="e.g. Bharathi"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              {/* Email Preview Card */}
              <GlassCard style={styles.emailCard} variant="elevated">
                {/* Subject Header */}
                <View style={styles.subjectRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectLabel}>Subject Line:</Text>
                    <Text style={styles.subjectText}>
                      {getCustomizedSubject(selectedTemplate)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.iconMiniBtn}
                    onPress={() =>
                      copyToClipboard(getCustomizedSubject(selectedTemplate), 'subj')
                    }
                  >
                    <Ionicons
                      name={copiedKey === 'subj' ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color={copiedKey === 'subj' ? '#10B981' : '#38BDF8'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Body Content */}
                <View style={styles.bodyBox}>
                  <Text style={styles.bodyText}>
                    {getCustomizedBody(selectedTemplate)}
                  </Text>
                </View>

                {/* Tamil Meaning Guide */}
                <View style={styles.tamilMeaningBox}>
                  <Ionicons name="information-circle" size={16} color="#38BDF8" style={{ marginTop: 2 }} />
                  <Text style={styles.tamilMeaningText}>{selectedTemplate.tamilMeaning}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.emailActionRow}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() =>
                      copyToClipboard(
                        `${getCustomizedSubject(selectedTemplate)}\n\n${getCustomizedBody(
                          selectedTemplate
                        )}`,
                        'full-email'
                      )
                    }
                  >
                    <Ionicons
                      name={copiedKey === 'full-email' ? 'checkmark-circle' : 'copy-outline'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionBtnPrimaryText}>
                      {copiedKey === 'full-email' ? 'Copied Full Email! ✓' : 'Copy Full Email'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() =>
                      handleShare(
                        getCustomizedSubject(selectedTemplate),
                        getCustomizedBody(selectedTemplate)
                      )
                    }
                  >
                    <Ionicons name="share-outline" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => speakText(getCustomizedBody(selectedTemplate))}
                  >
                    <Ionicons name="volume-high" size={16} color="#38BDF8" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </ScrollView>
          )}

          {/* ================================================================= */}
          {/* TAB 2: AI TAMIL ➔ ENGLISH WRITER */}
          {/* ================================================================= */}
          {activeTab === 'ai_generator' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              <GlassCard style={styles.aiInputCard}>
                <Text style={styles.aiInputLabel}>
                  Describe your email in Tamil or English (உங்கள் தேவையை தமிழில் எழுதுங்கள்):
                </Text>
                <TextInput
                  style={styles.aiTextInput}
                  multiline
                  numberOfLines={4}
                  placeholder="எ.கா: எனக்கு நாளைக்கு உடம்பு சரியில்லை, ஹாஸ்பிட்டல் போகணும். அதனால் ஒரு நாள் லீவு வேணும், அவசரமெனில் போனில் பேசலாம்..."
                  placeholderTextColor={Colors.textMuted}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                />

                {/* Tone Selector */}
                <Text style={[styles.aiInputLabel, { marginTop: 10 }]}>Tone (தொனி):</Text>
                <View style={styles.toneRow}>
                  {(['Formal', 'Friendly', 'Direct', 'Urgent'] as const).map((tone) => (
                    <TouchableOpacity
                      key={tone}
                      style={[styles.toneChip, aiTone === tone && styles.toneChipActive]}
                      onPress={() => setAiTone(tone)}
                    >
                      <Text
                        style={[styles.toneChipText, aiTone === tone && styles.toneChipTextActive]}
                      >
                        {tone}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Generate Button */}
                <TouchableOpacity
                  style={[
                    styles.generateBtn,
                    (!aiPrompt.trim() || isGenerating) && styles.generateBtnDisabled,
                  ]}
                  disabled={!aiPrompt.trim() || isGenerating}
                  onPress={handleGenerateAiEmail}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      <Text style={styles.generateBtnText}>Generate Executive Email ⚡</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </GlassCard>

              {/* Generated Result Output */}
              {generatedBody ? (
                <GlassCard style={styles.emailCard} variant="elevated">
                  <View style={styles.subjectRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectLabel}>Generated Subject:</Text>
                      <Text style={styles.subjectText}>{generatedSubject}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.iconMiniBtn}
                      onPress={() => copyToClipboard(generatedSubject, 'ai-subj')}
                    >
                      <Ionicons
                        name={copiedKey === 'ai-subj' ? 'checkmark' : 'copy-outline'}
                        size={14}
                        color={copiedKey === 'ai-subj' ? '#10B981' : '#38BDF8'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bodyBox}>
                    <Text style={styles.bodyText}>{generatedBody}</Text>
                  </View>

                  {generatedTamilSummary ? (
                    <View style={styles.tamilMeaningBox}>
                      <Ionicons name="information-circle" size={16} color="#38BDF8" style={{ marginTop: 2 }} />
                      <Text style={styles.tamilMeaningText}>{generatedTamilSummary}</Text>
                    </View>
                  ) : null}

                  <View style={styles.emailActionRow}>
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() =>
                        copyToClipboard(`${generatedSubject}\n\n${generatedBody}`, 'ai-full')
                      }
                    >
                      <Ionicons
                        name={copiedKey === 'ai-full' ? 'checkmark-circle' : 'copy-outline'}
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.actionBtnPrimaryText}>
                        {copiedKey === 'ai-full' ? 'Copied Full Email! ✓' : 'Copy Full Email'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleShare(generatedSubject, generatedBody)}
                    >
                      <Ionicons name="share-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => speakText(generatedBody)}
                    >
                      <Ionicons name="volume-high" size={16} color="#38BDF8" />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ) : null}
            </ScrollView>
          )}
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    maxHeight: '92%',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.full,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollBody: {
    paddingBottom: Spacing.xl,
  },
  catScroll: {
    marginBottom: Spacing.sm,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  catChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  templatePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 130,
  },
  templatePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  templatePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  templatePillTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  templatePillTa: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  personalizeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  inputMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputMini: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 12,
  },
  emailCard: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: Spacing.md,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  subjectLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  iconMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  tamilMeaningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  tamilMeaningText: {
    flex: 1,
    fontSize: 11,
    color: '#BAE6FD',
    lineHeight: 16,
  },
  emailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 12,
    gap: 6,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // AI Generator Styles
  aiInputCard: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: Spacing.md,
  },
  aiInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  aiTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toneRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  toneChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  toneChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  toneChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toneChipTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
