import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { useCandidateProfileStore } from '@/features/career/state/candidate-profile-store';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { TermsPrivacyModal } from '@/features/auth/components/TermsPrivacyModal';
import { BackupService } from '@/core/utils/backup-service';
import { useVaultStore } from '@/features/vault/state/vault-store';
import { KeePassVaultModal } from '@/features/vault/components/KeePassVaultModal';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const isBiometricSupported = useAuthStore((s) => s.isBiometricSupported);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const signOut = useAuthStore((s) => s.signOut);
  const resetAccount = useAuthStore((s) => s.resetAccount);

  const profile = useCandidateProfileStore();
  const geminiKey = useAiConfigStore((s) => s.geminiKey);
  const groqKey = useAiConfigStore((s) => s.groqKey);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [vaultModalVisible, setVaultModalVisible] = useState(false);

  const vaultEntries = useVaultStore((s) => s.entries);
  const isVaultUnlocked = useVaultStore((s) => s.isUnlocked);

  // Change PIN Modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');

  // Edit Career Profile Modal
  const [editCareerVisible, setEditCareerVisible] = useState(false);
  const [editRole, setEditRole] = useState(profile.targetRole);
  const [editExp, setEditExp] = useState(profile.yearsOfExperience);
  const [editNotice, setEditNotice] = useState(profile.noticePeriod);
  const [editCtc, setEditCtc] = useState(profile.expectedCTC);

  // Restore Modal
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');

  const handleToggleBiometrics = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await AsyncStorage.setItem('@nova:biometric_enabled', val ? 'true' : 'false');
    useAuthStore.setState({ isBiometricEnabled: val });
  };

  const handleChangePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }

    try {
      const stored = await SecureStore.getItemAsync('nova_user_security_pin');
      if (stored && stored !== currentPin) {
        Alert.alert('Incorrect Current PIN', 'Please enter your current 4-digit PIN.');
        return;
      }
      await SecureStore.setItemAsync('nova_user_security_pin', newPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Success', 'Your security PIN has been updated.');
      setPinModalVisible(false);
      setCurrentPin('');
      setNewPin('');
    } catch {
      Alert.alert('Error', 'Failed to update PIN.');
    }
  };

  const handleSaveCareer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    profile.updateProfile({
      targetRole: editRole.trim(),
      yearsOfExperience: editExp.trim(),
      noticePeriod: editNotice.trim(),
      expectedCTC: editCtc.trim(),
    });
    setEditCareerVisible(false);
  };

  const handleExportBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const success = await BackupService.exportAndShare();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreJson.trim()) return;
    const success = await BackupService.restoreBackup(restoreJson);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Restored Successfully! 🎉', 'Your application state has been refreshed.', [
        { text: 'OK', onPress: () => setRestoreModalVisible(false) },
      ]);
    }
  };

  const handlePickResume = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const success = await profile.pickAndUploadResume();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Resume Updated 📄', 'New resume attached to your career profile.');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.screenTitle}>Settings & Vault</Text>
            <Text style={styles.screenSubtitle}>AAYON Executive Preferences & Data</Text>
          </View>
        </View>

        {/* 1. Profile Card */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <Badge
                  label={user?.authProvider === 'google' ? 'GOOGLE ACCOUNT' : 'LOCAL VAULT'}
                  variant={user?.authProvider === 'google' ? 'primary' : 'cyan'}
                />
              </View>
            </View>
          </View>
        </GlassCard>

        {/* 2. Productivity: To-Do Action Items */}
        <TouchableOpacity
          style={styles.todoShortcutCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            navigation.navigate('TodoList');
          }}
        >
          <View style={styles.todoIconWrap}>
            <Ionicons name="checkbox-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.todoTitle}>To-Do & Action Items</Text>
            <Text style={styles.todoSub}>Prioritized daily tasks across Work, Tech, & Goals</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* 3. Career & Resume Vault */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Career & Resume Vault</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Target Position</Text>
              <Text style={styles.settingValue}>{profile.targetRole}</Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtnSmall}
              onPress={() => {
                setEditRole(profile.targetRole);
                setEditExp(profile.yearsOfExperience);
                setEditNotice(profile.noticePeriod);
                setEditCtc(profile.expectedCTC);
                setEditCareerVisible(true);
              }}
            >
              <Text style={styles.actionBtnSmallText}>Edit Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Active Resume PDF</Text>
              <Text style={styles.settingValue} numberOfLines={1}>
                {profile.resumeFileName || 'No resume uploaded'}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtnSmallGold} onPress={handlePickResume}>
              <Ionicons name="cloud-upload-outline" size={13} color={Colors.gold} />
              <Text style={styles.actionBtnSmallGoldText}>Upload New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>• Experience: {profile.yearsOfExperience}</Text>
            <Text style={styles.metaText}>• Notice: {profile.noticePeriod}</Text>
            <Text style={styles.metaText}>• CTC: {profile.expectedCTC}</Text>
          </View>
        </GlassCard>

        {/* AI Intelligence & Free API Keys */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Intelligence & API Keys</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setApiKeyModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.settingLabel}>Google Gemini (100% Free)</Text>
                <Badge
                  label={geminiKey ? 'Active 🟢' : 'Missing ⚠️'}
                  variant={geminiKey ? 'primary' : 'gold'}
                />
              </View>
              <Text style={styles.settingSub}>
                {geminiKey ? 'Google AI Studio key active & ready' : 'Tap to add your free key (no credit card)'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setApiKeyModalVisible(true)}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.settingLabel}>Groq Cloud (Ultra-Fast)</Text>
                <Badge
                  label={groqKey ? 'Active 🟢' : 'Optional'}
                  variant={groqKey ? 'cyan' : 'neutral'}
                />
              </View>
              <Text style={styles.settingSub}>
                {groqKey ? 'Groq Llama-3.1 engine active' : 'Optional high-speed inference key'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtnSmall}
            onPress={() => setApiKeyModalVisible(true)}
          >
            <Ionicons name="key-outline" size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnSmallText}>Configure / Test Free API Keys 🔑</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 4. Hardware Security & Biometrics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security & Biometrics</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Biometric Unlock</Text>
              <Text style={styles.settingSub}>
                {isBiometricSupported ? 'Fingerprint & Face Unlock active' : 'Not supported on device'}
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleToggleBiometrics}
              disabled={!isBiometricSupported}
              trackColor={{ false: '#262626', true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setPinModalVisible(true)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Change 4-Digit Security PIN</Text>
              <Text style={styles.settingSub}>Protects local vault data from unauthorized access</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* 5. KeePassDX Password & 2FA Vault */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>KeePassDX Password & 2FA Vault</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setVaultModalVisible(true);
            }}
          >
            <View style={styles.iconCircleIndigo}>
              <Ionicons name="shield-checkmark" size={18} color="#818CF8" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.settingLabel}>Master Security Vault</Text>
                <Badge
                  label={isVaultUnlocked ? `${vaultEntries.length} Keys 🟢` : 'Locked 🔒'}
                  variant={isVaultUnlocked ? 'primary' : 'gold'}
                />
              </View>
              <Text style={styles.settingSub}>
                Zero-knowledge AES-256, KeePassDX generator, 30s auto-purge & RFC 6238 TOTP
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtnSmallIndigo}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setVaultModalVisible(true);
            }}
          >
            <Ionicons name="key" size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnSmallIndigoText}>Open KeePassDX Vault 🛡️</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 6. Cloud Backup & Restore */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Encrypted Backup & Portability</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleExportBackup}>
            <View style={styles.iconCircleCyan}>
              <Ionicons name="share-social-outline" size={18} color={Colors.cyan} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.settingLabel}>Export to WhatsApp / Google Drive</Text>
              <Text style={styles.settingSub}>Bundles all your career, finance, and health data into portable JSON</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={() => setRestoreModalVisible(true)}>
            <View style={styles.iconCircleGold}>
              <Ionicons name="download-outline" size={18} color={Colors.gold} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.settingLabel}>Restore from Encrypted Backup</Text>
              <Text style={styles.settingSub}>Paste backup JSON statement to restore state</Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* 6. App Info & Danger Zone */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App & System</Text>
        </View>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>AAYON v1.1.0 (Build 2)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Storage Model</Text>
            <Text style={styles.settingValue}>100% On-Device Encrypted Vault</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setTermsModalVisible(true)}
          >
            <Text style={styles.settingLabel}>Privacy Policy & Terms</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.dangerZoneRow}>
          <TouchableOpacity
            style={styles.lockBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              signOut();
            }}
          >
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textPrimary} />
            <Text style={styles.lockBtnText}>Lock Vault Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
              Alert.alert('Reset All Data & Account?', 'This will permanently wipe all local vault data, PIN, and saved records from this phone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Erase Everything', style: 'destructive', onPress: resetAccount },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={styles.resetBtnText}>Reset Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPinModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change 4-Digit Security PIN</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="Current 4-digit PIN"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={currentPin}
              onChangeText={setCurrentPin}
            />
            <TextInput
              style={styles.pinInput}
              placeholder="New 4-digit PIN"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPinModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePin}>
                <Text style={styles.modalSaveText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Career Details Modal */}
      <Modal
        visible={editCareerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditCareerVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Career Preferences</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="Target Role"
              placeholderTextColor={Colors.textMuted}
              value={editRole}
              onChangeText={setEditRole}
            />
            <TextInput
              style={styles.pinInput}
              placeholder="Experience (e.g. 2+ years)"
              placeholderTextColor={Colors.textMuted}
              value={editExp}
              onChangeText={setEditExp}
            />
            <TextInput
              style={styles.pinInput}
              placeholder="Notice Period (e.g. 30 Days)"
              placeholderTextColor={Colors.textMuted}
              value={editNotice}
              onChangeText={setEditNotice}
            />
            <TextInput
              style={styles.pinInput}
              placeholder="Expected CTC (e.g. 24 - 30 LPA)"
              placeholderTextColor={Colors.textMuted}
              value={editCtc}
              onChangeText={setEditCtc}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditCareerVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveCareer}>
                <Text style={styles.modalSaveText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Restore Modal */}
      <Modal
        visible={restoreModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRestoreModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
              <Text style={styles.modalTitle}>Paste Backup JSON Data</Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const text = await Clipboard.getStringAsync();
                    if (text) {
                      setRestoreJson(text);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    }
                  } catch {}
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}
              >
                <Ionicons name="clipboard-outline" size={16} color={Colors.primary} />
                <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '600' }}>Paste</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.pinInput, { minHeight: 120, textAlignVertical: 'top' }]}
              placeholder="Paste encrypted JSON content here..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={restoreJson}
              onChangeText={setRestoreJson}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRestoreModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleRestoreBackup}>
                <Text style={styles.modalSaveText}>Restore Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Free AI Key Setup Modal */}
      <ApiKeyModal
        visible={apiKeyModalVisible}
        onClose={() => setApiKeyModalVisible(false)}
      />

      {/* Privacy Policy & Terms Modal */}
      <TermsPrivacyModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />

      {/* KeePassDX Master Vault Modal */}
      <KeePassVaultModal
        visible={vaultModalVisible}
        onClose={() => setVaultModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    padding: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  todoShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161B',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: Spacing.sm,
  },
  todoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  todoSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionBtnSmall: {
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  actionBtnSmallText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  actionBtnSmallGold: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    gap: 4,
  },
  actionBtnSmallGoldText: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '600',
  },
  iconCircleCyan: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGold: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleIndigo: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSmallIndigo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    gap: 6,
  },
  actionBtnSmallIndigoText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dangerZoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    flexWrap: 'wrap',
  },
  lockBtn: {
    flex: 1,
    minWidth: 140,
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
  lockBtnText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resetBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#141418',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pinInput: {
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    padding: 12,
    marginBottom: Spacing.sm,
    fontSize: 13,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.cardSubtle,
    borderRadius: Radii.md,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
  },
  modalSaveText: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
