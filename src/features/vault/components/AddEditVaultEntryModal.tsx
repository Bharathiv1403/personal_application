import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { VaultEntry, VaultGroup, VaultField } from '../types';
import { useVaultStore } from '../state/vault-store';
import { PasswordGenerator } from '../utils/password-generator';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import { TotpService } from '../utils/totp';

interface AddEditVaultEntryModalProps {
  visible: boolean;
  entryToEdit?: VaultEntry | null;
  defaultGroup?: VaultGroup;
  onClose: () => void;
}

const GROUPS: { id: VaultGroup; label: string; icon: any; color: string }[] = [
  { id: 'logins', label: 'Logins', icon: 'globe-outline', color: '#38BDF8' },
  { id: 'cards', label: 'Cards & Bank', icon: 'card-outline', color: '#10B981' },
  { id: 'servers', label: 'Servers & SSH', icon: 'server-outline', color: '#A855F7' },
  { id: 'notes', label: 'Secure Notes', icon: 'document-text-outline', color: '#F59E0B' },
  { id: 'api_keys', label: 'API Keys', icon: 'key-outline', color: '#EC4899' },
  { id: 'identities', label: 'Identity/ID', icon: 'person-outline', color: '#6366F1' },
];

export const AddEditVaultEntryModal: React.FC<AddEditVaultEntryModalProps> = ({
  visible,
  entryToEdit,
  defaultGroup = 'logins',
  onClose,
}) => {
  const addEntry = useVaultStore((s) => s.addEntry);
  const updateEntry = useVaultStore((s) => s.updateEntry);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [group, setGroup] = useState<VaultGroup>(defaultGroup);
  const [notes, setNotes] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [customFields, setCustomFields] = useState<VaultField[]>([]);

  // Password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [generatorVisible, setGeneratorVisible] = useState(false);

  // Field adding
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);

  useEffect(() => {
    if (entryToEdit) {
      setTitle(entryToEdit.title);
      setUsername(entryToEdit.username || '');
      setPassword(entryToEdit.password || '');
      setUrl(entryToEdit.url || '');
      setTotpSecret(entryToEdit.totpSecret || '');
      setGroup(entryToEdit.group || 'logins');
      setNotes(entryToEdit.notes || '');
      setTagsText((entryToEdit.tags || []).join(', '));
      setIsFavorite(!!entryToEdit.isFavorite);
      setCustomFields(entryToEdit.customFields || []);
    } else {
      setTitle('');
      setUsername('');
      setPassword('');
      setUrl('');
      setTotpSecret('');
      setGroup(defaultGroup);
      setNotes('');
      setTagsText('');
      setIsFavorite(false);
      setCustomFields([]);
    }
  }, [entryToEdit, defaultGroup, visible]);

  const passwordScore = PasswordGenerator.evaluateStrength(password);
  const totpPreview = totpSecret.trim() ? TotpService.generate(totpSecret.trim()) : null;

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for this vault record.');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (entryToEdit) {
      updateEntry(entryToEdit.id, {
        title: title.trim(),
        username: username.trim(),
        password: password.trim(),
        url: url.trim() || undefined,
        totpSecret: totpSecret.trim() || undefined,
        group,
        notes: notes.trim() || undefined,
        tags,
        isFavorite,
        customFields,
      });
    } else {
      addEntry({
        title: title.trim(),
        username: username.trim(),
        password: password.trim(),
        url: url.trim() || undefined,
        totpSecret: totpSecret.trim() || undefined,
        group,
        notes: notes.trim() || undefined,
        tags,
        isFavorite,
        customFields,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onClose();
  };

  const handleDelete = () => {
    if (!entryToEdit) return;
    Alert.alert(
      'Delete Vault Record',
      `Are you sure you want to delete "${entryToEdit.title}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            deleteEntry(entryToEdit.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onClose();
          },
        },
      ]
    );
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    setCustomFields([
      ...customFields,
      {
        id: `field_${Date.now()}`,
        label: newFieldLabel.trim(),
        value: newFieldValue.trim(),
      },
    ]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddFieldForm(false);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {entryToEdit ? 'Edit Vault Credential' : 'New KeePassDX Entry'}
              </Text>
              <Text style={styles.subtitle}>Zero-Knowledge Encrypted Item</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Category / Group Chips */}
            <View style={styles.groupScrollWrap}>
              <Text style={styles.inputLabel}>Vault Group / Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
                {GROUPS.map((g) => {
                  const isSel = group === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.groupChip,
                        isSel && { borderColor: g.color, backgroundColor: g.color + '22' },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setGroup(g.id);
                      }}
                    >
                      <Ionicons
                        name={g.icon}
                        size={13}
                        color={isSel ? g.color : Colors.textMuted}
                      />
                      <Text style={[styles.groupText, isSel && { color: g.color, fontWeight: '700' }]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Title & Favorite */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  onPress={() => setIsFavorite(!isFavorite)}
                >
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={16}
                    color={isFavorite ? '#F59E0B' : Colors.textMuted}
                  />
                  <Text style={{ fontSize: 11, color: isFavorite ? '#F59E0B' : Colors.textMuted }}>
                    {isFavorite ? 'Favorite ⭐' : 'Add to Favorites'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. GitHub Production / AWS Console"
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Username / Email */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Username / Email / Account ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. admin@sagasoft.com"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {/* Password with Strength Meter & Generator Button */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Password / Key</Text>
                <TouchableOpacity
                  style={styles.generatorTrigger}
                  onPress={() => setGeneratorVisible(true)}
                >
                  <Ionicons name="sparkles" size={12} color="#10B981" />
                  <Text style={styles.generatorTriggerText}>Generate Key 🎲</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter or generate strong password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.pwIconBtn}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${passwordScore.barPercent}%`,
                          backgroundColor: passwordScore.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordScore.color }]}>
                    {passwordScore.label} ({passwordScore.entropyBits} bits)
                  </Text>
                </View>
              )}
            </View>

            {/* URL / Website */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Website URL (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://service.com/login"
                placeholderTextColor={Colors.textMuted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* 2FA / TOTP Authenticator Key */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>TOTP / 2FA Secret Key (Optional)</Text>
                {totpPreview && (
                  <Badge label={`Live 2FA: ${totpPreview.code} (${totpPreview.secondsRemaining}s)`} variant="cyan" />
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="e.g. JBSWY3DPEHPK3PXP (or otpauth:// URI)"
                placeholderTextColor={Colors.textMuted}
                value={totpSecret}
                onChangeText={setTotpSecret}
                autoCapitalize="characters"
              />
            </View>

            {/* Custom Extra Fields */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Custom Fields</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                  onPress={() => setShowAddFieldForm(true)}
                >
                  <Ionicons name="add-circle" size={14} color="#38BDF8" />
                  <Text style={{ fontSize: 11, color: '#38BDF8', fontWeight: '700' }}>+ Add Field</Text>
                </TouchableOpacity>
              </View>

              {customFields.map((f) => (
                <View key={f.id} style={styles.customFieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customFieldLabel}>{f.label}</Text>
                    <Text style={styles.customFieldValue}>{f.value}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveCustomField(f.id)}>
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {showAddFieldForm && (
                <View style={styles.addFieldBox}>
                  <TextInput
                    style={[styles.input, { marginBottom: 8 }]}
                    placeholder="Field Name (e.g. PIN, Server Port, Seed)"
                    placeholderTextColor={Colors.textMuted}
                    value={newFieldLabel}
                    onChangeText={setNewFieldLabel}
                  />
                  <TextInput
                    style={[styles.input, { marginBottom: 8 }]}
                    placeholder="Field Value"
                    placeholderTextColor={Colors.textMuted}
                    value={newFieldValue}
                    onChangeText={setNewFieldValue}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      style={styles.cancelFieldBtn}
                      onPress={() => setShowAddFieldForm(false)}
                    >
                      <Text style={styles.cancelFieldText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveFieldBtn}
                      onPress={handleAddCustomField}
                    >
                      <Text style={styles.saveFieldText}>Save Field</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Secure Notes</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Confidential remarks, recovery hints, backup codes..."
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Tags */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Tags (Comma Separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Work, Banking, Production"
                placeholderTextColor={Colors.textMuted}
                value={tagsText}
                onChangeText={setTagsText}
              />
            </View>

            {/* Password History (If available) */}
            {entryToEdit && entryToEdit.history && entryToEdit.history.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>
                  Password History ({entryToEdit.history.length} past keys)
                </Text>
                {entryToEdit.history.map((h, idx) => (
                  <View key={idx} style={styles.historyRow}>
                    <Text style={styles.historyPw} numberOfLines={1}>
                      ••••••••••••
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(h.changedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {entryToEdit ? 'Save Changes' : 'Save to Encrypted Vault'}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            {entryToEdit && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete This Credential</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Embedded Password Generator */}
        <PasswordGeneratorModal
          visible={generatorVisible}
          onClose={() => setGeneratorVisible(false)}
          onSelectPassword={(newPass) => {
            setPassword(newPass);
            setIsPasswordVisible(true);
          }}
        />
      </KeyboardAvoidingView>
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
  groupScrollWrap: {
    marginBottom: Spacing.md,
  },
  groupScroll: {
    marginTop: 4,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    marginRight: 8,
    gap: 5,
  },
  groupText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pwIconBtn: {
    padding: 10,
  },
  generatorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  generatorTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 13,
    color: '#FFFFFF',
    minHeight: 65,
    textAlignVertical: 'top',
  },
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 6,
  },
  customFieldLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  customFieldValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addFieldBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginTop: 4,
  },
  cancelFieldBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelFieldText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  saveFieldBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
  },
  saveFieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 8,
    borderRadius: Radii.xs,
    marginBottom: 4,
  },
  historyPw: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  historyDate: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: Radii.md,
    gap: 8,
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});
