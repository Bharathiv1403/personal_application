import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { GoogleUserProfile } from '@/core/utils/google-auth';

interface Props {
  visible: boolean;
  errorMessage?: string;
  initialName?: string;
  initialEmail?: string;
  onClose: () => void;
  onRetryGoogle: () => void;
  onContinueWithAccount: (user: GoogleUserProfile) => void;
}

export const GoogleQuickConnectModal: React.FC<Props> = ({
  visible,
  errorMessage,
  initialName = '',
  initialEmail = '',
  onClose,
  onRetryGoogle,
  onContinueWithAccount,
}) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setEmail(initialEmail);
    }
  }, [visible, initialName, initialEmail]);

  const handleContinue = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert('Valid Gmail Required', 'Please enter your valid email address.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onContinueWithAccount({
      id: `local-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.iconBadge}>
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    Quick Vault Setup
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    Instant offline-first Gmail & PIN vault
                  </Text>
                </View>
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

            {/* Notice Banner */}
            <View style={styles.noticeBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.cyan} />
              <Text style={styles.noticeText}>
                {errorMessage
                  ? `Google browser login did not finish (${errorMessage}). You can continue directly by confirming your Name & Gmail below — your vault remains 100% encrypted on this device.`
                  : 'Google browser login was cancelled or unavailable. Enter your real Name & Gmail below to initialize your encrypted vault immediately.'}
              </Text>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gmail / Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="yourname@gmail.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Continue to 4-Digit PIN Setup →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryBtn} onPress={onRetryGoogle} activeOpacity={0.8}>
              <Ionicons name="refresh" size={16} color={Colors.textPrimary} />
              <Text style={styles.retryBtnText}>Retry Google Browser Sign-In</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.84)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'android' ? 32 : Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  noticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    marginLeft: 10,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  primaryBtnText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  retryBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});

