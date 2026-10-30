import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { useHealthStore, ScreenTimeReasonCategory } from '../state/health-store';
import { SetScreenLimitModal } from './SetScreenLimitModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenSimulateModal?: () => void;
}

const CATEGORY_META: Record<
  ScreenTimeReasonCategory,
  { label: string; icon: string; color: string }
> = {
  emergency: { label: 'Emergency', icon: 'warning', color: Colors.danger },
  time_pass: { label: 'Time Pass', icon: 'hourglass', color: Colors.gold },
  boring: { label: 'Boring / Free', icon: 'cafe', color: Colors.purple },
  work: { label: 'Work / Study', icon: 'briefcase', color: Colors.cyan },
  social: { label: 'Social / Family', icon: 'chatbubbles', color: Colors.primary },
  other: { label: 'Custom Note', icon: 'create-outline', color: Colors.textSecondary },
};

export const ScreenTimeDashboardModal: React.FC<Props> = ({
  visible,
  onClose,
  onOpenSimulateModal,
}) => {
  const [filter, setFilter] = useState<'All' | 'Today' | 'Continued' | 'Stopped'>('All');
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const todayScreenTimeSeconds = useHealthStore((s) => s.todayScreenTimeSeconds);
  const dailyLimitMinutes = useHealthStore((s) => s.dailyScreenLimitMinutes);
  const screenTimeLogs = useHealthStore((s) => s.screenTimeLogs);
  const clearScreenTimeLogs = useHealthStore((s) => s.clearScreenTimeLogs);
  const openScreenLimitModal = useHealthStore((s) => s.openScreenLimitModal);

  const usedMinutes = Math.round(todayScreenTimeSeconds / 60);
  const usedHours = Math.floor(usedMinutes / 60);
  const usedRemMins = usedMinutes % 60;

  const limitHours = Math.floor(dailyLimitMinutes / 60);
  const limitRemMins = dailyLimitMinutes % 60;

  const percentUsed = Math.min(
    100,
    dailyLimitMinutes > 0 ? Math.round((usedMinutes / dailyLimitMinutes) * 100) : 0
  );
  const isOverLimit = usedMinutes >= dailyLimitMinutes;

  // Compute Reason Statistics
  const continuedLogs = screenTimeLogs.filter((l) => l.actionTaken === 'continued');
  const stoppedLogs = screenTimeLogs.filter((l) => l.actionTaken === 'stopped');

  const categoryCounts: Record<ScreenTimeReasonCategory, number> = {
    emergency: 0,
    time_pass: 0,
    boring: 0,
    work: 0,
    social: 0,
    other: 0,
  };

  continuedLogs.forEach((log) => {
    if (categoryCounts[log.category] !== undefined) {
      categoryCounts[log.category] += 1;
    } else {
      categoryCounts.other += 1;
    }
  });

  const totalContinued = continuedLogs.length;

  // Filter logs
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredLogs = screenTimeLogs.filter((log) => {
    if (filter === 'Today') return log.date === todayStr;
    if (filter === 'Continued') return log.actionTaken === 'continued';
    if (filter === 'Stopped') return log.actionTaken === 'stopped';
    return true;
  });

  const handleClearLogs = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all saved screen time reason reports?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            clearScreenTimeLogs();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Screen Time & Wellbeing</Text>
            <Text style={styles.headerSubtitle}>Usage Limiter & Intent Audit</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onClose();
            }}
          >
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Ring / Status Card */}
          <GlassCard variant="highlight" style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <View>
                <Text style={styles.overviewLabel}>TODAY'S USAGE</Text>
                <Text style={styles.overviewBigText}>
                  {usedHours > 0 ? `${usedHours}h ` : ''}
                  {usedRemMins}m
                </Text>
              </View>
              <Badge
                label={isOverLimit ? 'Limit Exceeded ⚠️' : 'Within Limit 🌿'}
                variant={isOverLimit ? 'danger' : 'primary'}
              />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${percentUsed}%` },
                  isOverLimit ? { backgroundColor: Colors.danger } : null,
                ]}
              />
            </View>

            <View style={styles.overviewFooterRow}>
              <Text style={styles.overviewSub}>
                Goal: {limitHours > 0 ? `${limitHours}h ` : ''}
                {limitRemMins}m ({percentUsed}% used)
              </Text>
              <TouchableOpacity
                style={styles.changeLimitBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLimitModalVisible(true);
                }}
              >
                <Ionicons name="settings-outline" size={14} color={Colors.cyan} />
                <Text style={styles.changeLimitBtnText}>Change Limit</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="hand-left" size={18} color={Colors.primary} />
              <Text style={styles.statVal}>{stoppedLogs.length}</Text>
              <Text style={styles.statLbl}>Stopped On Limit</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="arrow-redo" size={18} color={Colors.gold} />
              <Text style={styles.statVal}>{continuedLogs.length}</Text>
              <Text style={styles.statLbl}>Extended Times</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="time" size={18} color={Colors.cyan} />
              <Text style={styles.statVal}>
                {Math.max(0, dailyLimitMinutes - usedMinutes)}m
              </Text>
              <Text style={styles.statLbl}>Remaining</Text>
            </View>
          </View>

          {/* Reason Breakdown / Analytics */}
          <GlassCard style={styles.reasonsCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Why Do You Extend? (Reasons)</Text>
              <Text style={styles.cardSectionSub}>
                {totalContinued} total extensions
              </Text>
            </View>

            {totalContinued === 0 ? (
              <View style={styles.emptyReasonsBox}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color={Colors.primary} />
                <Text style={styles.emptyReasonsText}>
                  No overtime extensions logged yet! You've stayed within limits.
                </Text>
              </View>
            ) : (
              <View style={styles.reasonsList}>
                {(Object.keys(CATEGORY_META) as ScreenTimeReasonCategory[]).map((cat) => {
                  const count = categoryCounts[cat];
                  if (count === 0) return null;
                  const pct = Math.round((count / totalContinued) * 100);
                  const meta = CATEGORY_META[cat];

                  return (
                    <View key={cat} style={styles.reasonMetricRow}>
                      <View style={styles.reasonIconLabel}>
                        <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                        <Text style={styles.reasonLabelText}>{meta.label}</Text>
                      </View>

                      <View style={styles.reasonBarContainer}>
                        <View style={[styles.reasonMiniBar, { width: `${pct}%`, backgroundColor: meta.color }]} />
                      </View>

                      <View style={styles.reasonCountWrap}>
                        <Text style={styles.reasonCountText}>
                          {count} ({pct}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>

          {/* Quick Simulation & Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                openScreenLimitModal();
              }}
            >
              <Ionicons name="play-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.actionBtnOutlineText}>Test Limit Warning</Text>
            </TouchableOpacity>

            {onOpenSimulateModal && (
              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onOpenSimulateModal();
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.cyan} />
                <Text style={styles.actionBtnOutlineText}>Log / Simulate Time</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Audit Log / History Section */}
          <View style={styles.historySectionHeader}>
            <View>
              <Text style={styles.cardSectionTitle}>Recent Limit Audits & Reports</Text>
              <Text style={styles.cardSectionSub}>
                {screenTimeLogs.length} total saved events
              </Text>
            </View>

            {screenTimeLogs.length > 0 && (
              <TouchableOpacity onPress={handleClearLogs}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            {(['All', 'Today', 'Continued', 'Stopped'] as const).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.filterChip, filter === item && styles.filterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setFilter(item);
                }}
              >
                <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredLogs.length === 0 ? (
            <View style={styles.emptyListBox}>
              <Ionicons name="folder-open-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyListText}>No logs match this filter.</Text>
            </View>
          ) : (
            <View style={styles.logsStack}>
              {filteredLogs.map((log) => {
                const isContinued = log.actionTaken === 'continued';
                const meta = CATEGORY_META[log.category] || CATEGORY_META.other;

                return (
                  <GlassCard key={log.id} style={styles.logCard}>
                    <View style={styles.logTopRow}>
                      <View style={styles.logBadgeRow}>
                        <Badge
                          label={isContinued ? 'Continued ⏱️' : 'Stopped 🛑'}
                          variant={isContinued ? 'gold' : 'primary'}
                        />
                        <Text style={styles.logTimeText}>
                          {log.date} • {log.timestamp}
                        </Text>
                      </View>

                      {isContinued && log.extendedMinutes > 0 && (
                        <Text style={styles.extendedTag}>
                          +{log.extendedMinutes}m extended
                        </Text>
                      )}
                    </View>

                    <View style={styles.logReasonRow}>
                      <Ionicons
                        name={isContinued ? (meta.icon as any) : 'shield-checkmark'}
                        size={18}
                        color={isContinued ? meta.color : Colors.primary}
                      />
                      <Text style={styles.logReasonText}>{log.reason}</Text>
                    </View>

                    {log.customNote ? (
                      <View style={styles.customNoteBox}>
                        <Text style={styles.customNoteText}>
                          "{log.customNote}"
                        </Text>
                      </View>
                    ) : null}
                  </GlassCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      <SetScreenLimitModal
        visible={limitModalVisible}
        onClose={() => setLimitModalVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 60,
  },
  overviewCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  overviewBigText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  overviewFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  changeLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.cyanGlow,
  },
  changeLimitBtnText: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  reasonsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emptyReasonsBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 8,
  },
  emptyReasonsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  reasonsList: {
    gap: 12,
  },
  reasonMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reasonIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 120,
  },
  reasonLabelText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  reasonBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  reasonMiniBar: {
    height: '100%',
    borderRadius: Radii.full,
  },
  reasonCountWrap: {
    width: 60,
    alignItems: 'flex-end',
  },
  reasonCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 11,
    borderRadius: Radii.lg,
    gap: 6,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clearText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyListBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: 8,
  },
  emptyListText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  logsStack: {
    gap: 10,
  },
  logCard: {
    padding: Spacing.md,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logTimeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  extendedTag: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '600',
  },
  logReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logReasonText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  customNoteBox: {
    marginTop: 6,
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: Radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.cyan,
  },
  customNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
