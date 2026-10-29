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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
              <Text style={styles.title}>Privacy Policy & Terms</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Highlights Card */}
            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>🛡️ 100% On-Device Zero-Knowledge Privacy</Text>
              <Text style={styles.highlightText}>
                AAYON stores all your personal data, bank accounts, expenses, career notes, and resume details locally on your device with hardware-backed encryption.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Data Ownership & Storage</Text>
              <Text style={styles.sectionText}>
                • All credentials, 4-digit PINs, and personal records never leave your device.
                {"\n"}• We have NO central user database, NO trackers, and NO analytics SDKs.
                {"\n"}• You own 100% of your data and can export an encrypted JSON backup anytime.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. AI & Third-Party API Keys (BYOK)</Text>
              <Text style={styles.sectionText}>
                • AAYON follows a strict Bring-Your-Own-Key (BYOK) model.
                {"\n"}• AI queries (career feedback, cover letters, resume optimization) are dispatched directly from your device to Google AI Studio or Groq Cloud using your personal key.
                {"\n"}• Your API key is stored in hardware keystore (`expo-secure-store`) and is never routed through any intermediary proxy.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Security & Biometrics</Text>
              <Text style={styles.sectionText}>
                • Unlock authentication is verified using your phone's native Face ID, Touch ID, or 4-digit PIN.
                {"\n"}• Auto-lock protects your vault whenever the application is backgrounded.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Terms of Use</Text>
              <Text style={styles.sectionText}>
                • AAYON is provided as a personal productivity and financial management tool. Financial summaries and tax estimates are informational calculations and should not be construed as registered financial advisory.
              </Text>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer Action */}
          <TouchableOpacity style={styles.acceptBtn} onPress={onClose}>
            <Text style={styles.acceptBtnText}>I Understand & Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginVertical: Spacing.md,
  },
  highlightBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#818CF8',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
});
