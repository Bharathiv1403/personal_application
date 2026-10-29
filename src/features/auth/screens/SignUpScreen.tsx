import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useAuthStore } from '../state/auth-store';
import { GoogleAuthService, GoogleUserProfile } from '@/core/utils/google-auth';
import { SetGooglePinModal } from '../components/SetGooglePinModal';
import { TermsPrivacyModal } from '../components/TermsPrivacyModal';
import { RestoreBackupModal } from '@/features/wealth/components/RestoreBackupModal';

export const SignUpScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingGoogleUser, setPendingGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);

  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const isBiometricSupported = useAuthStore((s) => s.isBiometricSupported);

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const googleUser = await GoogleAuthService.promptGoogleSignIn();
    if (googleUser) {
      // Prompt user to set their custom 4-digit PIN for offline vault security
      setPendingGoogleUser(googleUser);
    }
  };

  const handleConfirmGooglePin = async (chosenPin: string) => {
    if (!pendingGoogleUser) return;
    const success = await signInWithGoogle(pendingGoogleUser, chosenPin);
    setPendingGoogleUser(null);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (pin.length < 4) {
      Alert.alert('Invalid PIN', 'Security PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Mismatch', 'PIN and Confirm PIN do not match.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsSubmitting(true);

    const success = await signUp(name, email, pin, enableBiometrics);
    setIsSubmitting(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Alert.alert('Error', 'Could not create vault credentials. Please try again.');
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appTitle}>AAYON</Text>
            <Text style={styles.appSubtitle}>
              Initialize your private, encrypted executive vault
            </Text>
          </View>

          {/* Form Card */}
          <GlassCard variant="highlight" style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Create Personal Account</Text>

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
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>4-Digit Security PIN</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={pin}
                  onChangeText={(val) => setPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry={!showPin}
                  maxLength={4}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm PIN */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Security PIN</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPin}
                  onChangeText={(val) => setConfirmPin(val.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry={!showConfirmPin}
                  maxLength={4}
                />
                <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirmPin ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Biometric Toggle */}
            {isBiometricSupported && (
              <View style={styles.toggleRow}>
                <View style={{ flex: 1, marginRight: Spacing.sm }}>
                  <Text style={styles.toggleTitle}>Fingerprint / Face Unlock</Text>
                  <Text style={styles.toggleSubtitle}>Quick biometric unlock on app launch</Text>
                </View>
                <Switch
                  value={enableBiometrics}
                  onValueChange={setEnableBiometrics}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor={Colors.textPrimary}
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.createBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              <Text style={styles.createBtnText}>
                {isSubmitting ? 'Creating Vault...' : 'Create Secure Vault 🛡️'}
              </Text>
            </TouchableOpacity>

            {/* Terms & Privacy Consent */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.termsText}>
                By creating a vault, you agree to AAYON's{' '}
                <Text style={styles.termsHighlight}>Privacy Policy & Terms</Text>
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Restore Backup Link */}
            <TouchableOpacity
              style={styles.restorePillBtn}
              onPress={() => setRestoreModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="folder-open-outline" size={15} color={Colors.cyan} />
              <Text style={styles.restorePillText}>Already have a backup? Restore Vault 📁</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Privacy Guarantee Footer */}
          <View style={styles.privacyGuarantee}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.privacyGuaranteeText}>
              100% On-Device Hardware Encryption. No Cloud Tracking.
            </Text>
          </View>
        </ScrollView>

        {/* Modals */}
        <SetGooglePinModal
          visible={Boolean(pendingGoogleUser)}
          googleUser={pendingGoogleUser}
          onCancel={() => setPendingGoogleUser(null)}
          onConfirmPin={handleConfirmGooglePin}
        />

        <TermsPrivacyModal
          visible={termsModalVisible}
          onClose={() => setTermsModalVisible(false)}
        />

        <RestoreBackupModal
          visible={restoreModalVisible}
          onClose={() => setRestoreModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingTop: 30,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
    borderRadius: Radii.md,
    gap: Spacing.sm,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  privacyGuarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  privacyGuaranteeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  eyeBtn: {
    padding: 6,
  },
  termsRow: {
    marginTop: Spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsHighlight: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  restorePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  restorePillText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
});
