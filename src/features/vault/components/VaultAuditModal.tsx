import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { useVaultStore } from '../state/vault-store';
import { VaultCryptoService } from '../utils/vault-crypto';
import { VaultEntry } from '../types';

interface VaultAuditModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEntryForEdit: (entry: VaultEntry) => void;
}

export const VaultAuditModal: React.FC<VaultAuditModalProps> = ({
  visible,
  onClose,
  onSelectEntryForEdit,
}) => {
  const entries = useVaultStore((s) => s.entries);
  const report = VaultCryptoService.auditVault(entries);

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const scoreColor = getScoreColor(report.securityScore);

  const weakEntries = entries.filter((e) => report.weakIds.includes(e.id));
  const reusedEntries = entries.filter((e) => report.reusedIds.includes(e.id));
  const oldEntries = entries.filter((e) => report.oldIds.includes(e.id));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-half" size={20} color={scoreColor} />
              <View>
                <Text style={styles.title}>KeePassDX Security Audit</Text>
                <Text style={styles.subtitle}>Vulnerability & Hygiene Diagnostics</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Score Banner */}
            <GlassCard style={styles.scoreCard} variant="elevated">
              <View style={styles.scoreRow}>
                <View>
                  <Text style={styles.scoreLabel}>Vault Health Score</Text>
                  <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                    {report.securityScore}%
                  </Text>
                  <Text style={styles.scoreSub}>
                    {report.securityScore >= 85
                      ? 'Military-Grade Security 🛡️'
                      : report.securityScore >= 60
                      ? 'Moderate • Needs Review ⚠️'
                      : 'Critical Risks Detected 🚨'}
                  </Text>
                </View>

                <View style={styles.statsSummary}>
                  <Text style={styles.statLine}>
                    Total Records: <Text style={styles.statBold}>{report.totalEntries}</Text>
                  </Text>
                  <Text style={[styles.statLine, { color: '#EF4444' }]}>
                    Weak Keys: <Text style={styles.statBold}>{report.weakCount}</Text>
                  </Text>
                  <Text style={[styles.statLine, { color: '#F59E0B' }]}>
                    Reused Keys: <Text style={styles.statBold}>{report.reusedCount}</Text>
                  </Text>
                  <Text style={[styles.statLine, { color: '#60A5FA' }]}>
                    {'Old (>90d): '}<Text style={styles.statBold}>{report.oldPasswordCount}</Text>
                  </Text>
                </View>
              </View>
            </GlassCard>

            {/* Weak Passwords Section */}
            {weakEntries.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                    Weak Passwords ({weakEntries.length})
                  </Text>
                </View>
                <Text style={styles.sectionSub}>
                  These credentials have short or low-entropy passwords prone to brute-force:
                </Text>

                {weakEntries.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={styles.entryRowCard}
                    onPress={() => {
                      onClose();
                      onSelectEntryForEdit(e);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>{e.title}</Text>
                      <Text style={styles.entryUser}>{e.username || 'No Username'}</Text>
                    </View>
                    <Badge label="Fix Key ⚡" variant="danger" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Reused Passwords Section */}
            {reusedEntries.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="repeat" size={16} color="#F59E0B" />
                  <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                    Reused / Duplicate Passwords ({reusedEntries.length})
                  </Text>
                </View>
                <Text style={styles.sectionSub}>
                  Using the same password across services causes cascade breaches:
                </Text>

                {reusedEntries.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={styles.entryRowCard}
                    onPress={() => {
                      onClose();
                      onSelectEntryForEdit(e);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>{e.title}</Text>
                      <Text style={styles.entryUser}>{e.username}</Text>
                    </View>
                    <Badge label="Unique Key Needed" variant="gold" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Old / Expired Passwords Section */}
            {oldEntries.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time" size={16} color="#60A5FA" />
                  <Text style={[styles.sectionTitle, { color: '#60A5FA' }]}>
                    {`Old Passwords (>90 Days) (${oldEntries.length})`}
                  </Text>
                </View>
                <Text style={styles.sectionSub}>
                  Best practices recommend rotating critical cloud & banking passwords quarterly:
                </Text>

                {oldEntries.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={styles.entryRowCard}
                    onPress={() => {
                      onClose();
                      onSelectEntryForEdit(e);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>{e.title}</Text>
                      <Text style={styles.entryUser}>{e.username}</Text>
                    </View>
                    <Badge label="Rotate 🔄" variant="neutral" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {report.weakCount === 0 && report.reusedCount === 0 && (
              <View style={styles.perfectState}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.perfectTitle}>Zero Critical Vulnerabilities!</Text>
                <Text style={styles.perfectSub}>
                  All credentials follow KeePassDX military-grade entropy standards with unique passwords.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0E131F',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  body: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  scoreCard: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    marginBottom: Spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scoreNumber: {
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -1,
  },
  scoreSub: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsSummary: {
    gap: 4,
    alignItems: 'flex-end',
  },
  statLine: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionWrap: {
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  entryRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  entryUser: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  perfectState: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  perfectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  perfectSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
