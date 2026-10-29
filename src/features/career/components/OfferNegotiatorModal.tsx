import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { AIService } from '@/core/utils/ai-service';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { formatINR } from '@/core/utils/currency';
import { useJobStore } from '../state/job-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const OfferNegotiatorModal: React.FC<Props> = ({ visible, onClose }) => {
  const calculateInHandSalary = useJobStore((s) => s.calculateInHandSalary);
  const [activeTab, setActiveTab] = useState<'compare' | 'negotiate'>('compare');
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const isAiConfigured = useAiConfigStore((s) => s.isConfigured);
  const hasKey = isAiConfigured || AIService.hasConfiguredKey();

  // Offer A (e.g. Offer 1 / Current)
  const [companyA, setCompanyA] = useState('Current / Offer A');
  const [ctcA, setCtcA] = useState('20');
  const [bonusA, setBonusA] = useState('2');
  const [esopA, setEsopA] = useState('4');
  const [workModeA, setWorkModeA] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Remote');

  // Offer B (e.g. Offer 2 / New Offer)
  const [companyB, setCompanyB] = useState('Target Company');
  const [ctcB, setCtcB] = useState('28');
  const [bonusB, setBonusB] = useState('3');
  const [esopB, setEsopB] = useState('8');
  const [workModeB, setWorkModeB] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Hybrid');

  // Negotiation Generator State
  const [negCompany, setNegCompany] = useState('');
  const [negRole, setNegRole] = useState('Senior React Native Engineer');
  const [currentOfferedCTC, setCurrentOfferedCTC] = useState('24');
  const [desiredTargetCTC, setDesiredTargetCTC] = useState('28');
  const [leverageNotes, setLeverageNotes] = useState('2+ YOE leading mobile architecture with competing discussions');
  const [negotiationEmail, setNegotiationEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Computations
  const numCtcA = parseFloat(ctcA) || 0;
  const numCtcB = parseFloat(ctcB) || 0;

  const inHandA = useMemo(() => calculateInHandSalary(numCtcA), [numCtcA, calculateInHandSalary]);
  const inHandB = useMemo(() => calculateInHandSalary(numCtcB), [numCtcB, calculateInHandSalary]);

  // Adjust for remote savings (approx ₹15,000/mo saved on rent & travel if Remote vs Hybrid/Onsite)
  const perkSavingsA = workModeA === 'Remote' ? 15000 : 0;
  const perkSavingsB = workModeB === 'Remote' ? 15000 : 0;

  const realMonthlyNetA = inHandA.monthlyInHand + perkSavingsA;
  const realMonthlyNetB = inHandB.monthlyInHand + perkSavingsB;
  const monthlyDifference = realMonthlyNetB - realMonthlyNetA;

  const handleGenerateNegotiation = async () => {
    if (!negCompany.trim()) {
      Alert.alert('Required', 'Please enter the company name.');
      return;
    }
    if (!hasKey) {
      setApiKeyModalVisible(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsGenerating(true);
    try {
      const email = await AIService.generateCounterOfferLetter(
        negCompany.trim(),
        negRole.trim(),
        parseFloat(currentOfferedCTC) || 20,
        parseFloat(desiredTargetCTC) || 25,
        leverageNotes.trim()
      );
      setNegotiationEmail(email);
    } catch {
      Alert.alert('Error', 'Failed to generate negotiation email.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = async () => {
    if (!negotiationEmail) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await Share.share({ message: negotiationEmail });
    } catch {
      Alert.alert('Copied 📋', 'Negotiation draft copied to clipboard!');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="scale" size={18} color="#F59E0B" />
                <Text style={styles.headerTitle}>Offer Comparison & Negotiator</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Side-by-side net in-hand comparison & counter-offer emails
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

          {/* Tab Selector */}
          <View style={styles.navTabRow}>
            <TouchableOpacity
              style={[styles.navTabChip, activeTab === 'compare' && styles.navTabChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('compare');
              }}
            >
              <Ionicons
                name="git-compare-outline"
                size={14}
                color={activeTab === 'compare' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[
                  styles.navTabChipText,
                  activeTab === 'compare' && styles.navTabChipTextActive,
                ]}
              >
                Compare 2 Offers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navTabChip, activeTab === 'negotiate' && styles.navTabChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('negotiate');
              }}
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={14}
                color={activeTab === 'negotiate' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[
                  styles.navTabChipText,
                  activeTab === 'negotiate' && styles.navTabChipTextActive,
                ]}
              >
                Counter-Offer AI
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {activeTab === 'compare' ? (
              <View>
                {/* Winner Callout Card */}
                <GlassCard style={styles.winnerCard} variant="elevated">
                  <View style={styles.winnerTopRow}>
                    <Text style={styles.winnerLabel}>Estimated Real Net Gain</Text>
                    <Badge
                      label={monthlyDifference >= 0 ? `+${formatINR(monthlyDifference)}/mo` : `${formatINR(monthlyDifference)}/mo`}
                      variant={monthlyDifference >= 0 ? 'primary' : 'danger'}
                    />
                  </View>
                  <Text style={styles.winnerHeading}>
                    {monthlyDifference >= 0
                      ? `${companyB || 'Offer B'} yields ${formatINR(monthlyDifference * 12)} more annual take-home!`
                      : `${companyA || 'Offer A'} retains higher take-home post commute & tax!`}
                  </Text>
                </GlassCard>

                {/* Side-by-Side Comparison Grid */}
                <View style={styles.compareGrid}>
                  {/* Column A */}
                  <View style={styles.compareCol}>
                    <View style={styles.colHeader}>
                      <TextInput
                        style={styles.companyNameInput}
                        value={companyA}
                        onChangeText={setCompanyA}
                        placeholder="Offer A"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <Badge label="Option A" variant="neutral" />
                    </View>

                    <Text style={styles.inputFieldLabel}>Base CTC (LPA)</Text>
                    <TextInput
                      style={styles.miniInput}
                      keyboardType="numeric"
                      value={ctcA}
                      onChangeText={setCtcA}
                    />

                    <Text style={styles.inputFieldLabel}>Bonus (LPA)</Text>
                    <TextInput
                      style={styles.miniInput}
                      keyboardType="numeric"
                      value={bonusA}
                      onChangeText={setBonusA}
                    />

                    <Text style={styles.inputFieldLabel}>Work Mode</Text>
                    <View style={styles.workModeRow}>
                      {(['Remote', 'Hybrid', 'Onsite'] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.workModeBtn,
                            workModeA === m && styles.workModeBtnActive,
                          ]}
                          onPress={() => setWorkModeA(m)}
                        >
                          <Text
                            style={[
                              styles.workModeBtnText,
                              workModeA === m && styles.workModeBtnTextActive,
                            ]}
                          >
                            {m.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.colDivider} />

                    <Text style={styles.takeHomeLabel}>Net Monthly Take-Home</Text>
                    <Text style={styles.takeHomeVal}>{formatINR(inHandA.monthlyInHand)}</Text>
                    {perkSavingsA > 0 && (
                      <Text style={styles.perkText}>+₹15,000 Remote Living Perk</Text>
                    )}
                  </View>

                  {/* Column B */}
                  <View style={[styles.compareCol, styles.compareColHighlight]}>
                    <View style={styles.colHeader}>
                      <TextInput
                        style={styles.companyNameInput}
                        value={companyB}
                        onChangeText={setCompanyB}
                        placeholder="Offer B"
                        placeholderTextColor={Colors.textMuted}
                      />
                      <Badge label="Option B" variant="gold" />
                    </View>

                    <Text style={styles.inputFieldLabel}>Base CTC (LPA)</Text>
                    <TextInput
                      style={styles.miniInput}
                      keyboardType="numeric"
                      value={ctcB}
                      onChangeText={setCtcB}
                    />

                    <Text style={styles.inputFieldLabel}>Bonus (LPA)</Text>
                    <TextInput
                      style={styles.miniInput}
                      keyboardType="numeric"
                      value={bonusB}
                      onChangeText={setBonusB}
                    />

                    <Text style={styles.inputFieldLabel}>Work Mode</Text>
                    <View style={styles.workModeRow}>
                      {(['Remote', 'Hybrid', 'Onsite'] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.workModeBtn,
                            workModeB === m && styles.workModeBtnActive,
                          ]}
                          onPress={() => setWorkModeB(m)}
                        >
                          <Text
                            style={[
                              styles.workModeBtnText,
                              workModeB === m && styles.workModeBtnTextActive,
                            ]}
                          >
                            {m.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.colDivider} />

                    <Text style={styles.takeHomeLabel}>Net Monthly Take-Home</Text>
                    <Text style={[styles.takeHomeVal, { color: '#38BDF8' }]}>
                      {formatINR(inHandB.monthlyInHand)}
                    </Text>
                    {perkSavingsB > 0 && (
                      <Text style={styles.perkText}>+₹15,000 Remote Living Perk</Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View>
                {/* Negotiation Form */}
                <View style={styles.negForm}>
                  <Text style={styles.inputFieldLabel}>Target Company Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Razorpay, Zepto, Swiggy"
                    placeholderTextColor={Colors.textMuted}
                    value={negCompany}
                    onChangeText={setNegCompany}
                  />

                  <Text style={styles.inputFieldLabel}>Offered Role</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Senior Frontend Engineer"
                    placeholderTextColor={Colors.textMuted}
                    value={negRole}
                    onChangeText={setNegRole}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputFieldLabel}>Offered CTC (LPA)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={currentOfferedCTC}
                        onChangeText={setCurrentOfferedCTC}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputFieldLabel}>Desired Target (LPA)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={desiredTargetCTC}
                        onChangeText={setDesiredTargetCTC}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputFieldLabel}>Leverage / Unique Strengths</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Holding another offer at 26 LPA, sub-second Hermes experience"
                    placeholderTextColor={Colors.textMuted}
                    value={leverageNotes}
                    onChangeText={setLeverageNotes}
                  />

                  <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGenerateNegotiation}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                        <Text style={styles.generateBtnText}>Generate Counter-Offer Email</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Generated Email Result */}
                {negotiationEmail.length > 0 && (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultTitle}>Ready-to-Send Counter-Offer</Text>
                      <TouchableOpacity onPress={handleCopyEmail} style={styles.copyBtn}>
                        <Ionicons name="copy-outline" size={14} color="#38BDF8" />
                        <Text style={styles.copyBtnText}>Copy & Share</Text>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={styles.emailResultText}
                      multiline
                      value={negotiationEmail}
                      onChangeText={setNegotiationEmail}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        <ApiKeyModal
          visible={apiKeyModalVisible}
          onClose={() => setApiKeyModalVisible(false)}
          onSuccess={() => handleGenerateNegotiation()}
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
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
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
  navTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  navTabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navTabChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  navTabChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  navTabChipTextActive: {
    color: '#FFFFFF',
  },
  scrollBody: {
    paddingBottom: Spacing.xxl,
  },
  winnerCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  winnerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  winnerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  winnerHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
  },
  compareGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  compareCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compareColHighlight: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },
  colHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  companyNameInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    padding: 0,
  },
  inputFieldLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  miniInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workModeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  workModeBtn: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: Radii.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  workModeBtnActive: {
    backgroundColor: '#0284C7',
  },
  workModeBtnText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  workModeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  colDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: Spacing.sm,
  },
  takeHomeLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  takeHomeVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ADE80',
    marginTop: 2,
  },
  perkText: {
    fontSize: 9,
    color: '#38BDF8',
    marginTop: 2,
  },
  negForm: {
    gap: 4,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  generateBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.lg,
    gap: 6,
    marginTop: Spacing.md,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  resultCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  emailResultText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
    minHeight: 160,
  },
});
