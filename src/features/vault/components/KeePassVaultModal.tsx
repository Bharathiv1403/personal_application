import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { useVaultStore } from '../state/vault-store';
import { VaultEntry, VaultGroup } from '../types';
import { VaultCryptoService } from '../utils/vault-crypto';
import { TotpService } from '../utils/totp';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import { VaultAuditModal } from './VaultAuditModal';
import { AddEditVaultEntryModal } from './AddEditVaultEntryModal';

interface KeePassVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

const GROUP_FILTERS: { key: VaultGroup | 'all' | 'favorites'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'shield-checkmark-outline' },
  { key: 'favorites', label: 'Favorites', icon: 'star-outline' },
  { key: 'logins', label: 'Logins', icon: 'globe-outline' },
  { key: 'cards', label: 'Cards', icon: 'card-outline' },
  { key: 'servers', label: 'Servers', icon: 'server-outline' },
  { key: 'notes', label: 'Notes', icon: 'document-text-outline' },
  { key: 'api_keys', label: 'API Keys', icon: 'key-outline' },
  { key: 'identities', label: 'Identities', icon: 'finger-print-outline' },
];

export const KeePassVaultModal: React.FC<KeePassVaultModalProps> = ({ visible, onClose }) => {
  const {
    entries,
    isUnlocked,
    unlockWithPin,
    unlockWithBiometrics,
    lock,
    deleteEntry,
    toggleFavorite,
    importEntries,
  } = useVaultStore();

  // State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<VaultGroup | 'all' | 'favorites'>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);

  // Sub-modals
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);

  // Live TOTP ticker (ticks every second)
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    if (!visible || !isUnlocked) return;
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, isUnlocked]);

  // Attempt biometric unlock on open
  useEffect(() => {
    if (visible && !isUnlocked) {
      unlockWithBiometrics();
    }
  }, [visible, isUnlocked]);

  // PIN Unlock submit
  const handlePinUnlock = async () => {
    if (!pinInput.trim()) return;
    const success = await unlockWithPin(pinInput.trim());
    if (success) {
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Default is 1403 or your security PIN.');
      setPinInput('');
    }
  };

  // Toggle reveal password
  const toggleRevealPassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showCopyFeedback = (label: string) => {
    setClipboardFeedback(`${label} copied! Auto-purges in 30s 🛡️`);
    setTimeout(() => {
      setClipboardFeedback(null);
    }, 3000);
  };

  // Secure copy actions
  const handleCopyUsername = async (username: string) => {
    if (!username) return;
    await VaultCryptoService.copySecureWithAutoPurge(username, 'Username');
    showCopyFeedback('Username');
  };

  const handleCopyPassword = async (password: string) => {
    if (!password) return;
    await VaultCryptoService.copySecureWithAutoPurge(password, 'Password');
    showCopyFeedback('Password');
  };

  const handleCopyTotp = async (secret: string) => {
    const res = TotpService.generate(secret);
    if (!res) return;
    await VaultCryptoService.copySecureWithAutoPurge(res.code, 'TOTP 2FA Token');
    showCopyFeedback('TOTP Token');
  };

  // Launch URL
  const handleOpenUrl = (url?: string) => {
    if (!url) return;
    const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    Linking.openURL(formatted).catch(() => {
      Alert.alert('Cannot Open URL', 'Please check that the web address is valid.');
    });
  };

  // Delete prompt
  const handleDeleteEntry = (entry: VaultEntry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entry.id) },
      ]
    );
  };

  // Export Backup
  const handleExportBackup = async () => {
    Alert.alert(
      'Export KeePass Vault',
      'Choose export format for interoperability with KeePassDX / KeePassXC:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'KeePass CSV (KeePassDX / KeePassXC)',
          onPress: async () => {
            try {
              const csv = VaultCryptoService.exportVaultCSV(entries);
              await Share.share({
                title: 'KeePassDX Standard CSV Export',
                message: csv,
              });
            } catch {
              Alert.alert('Export Failed', 'Unable to create CSV export.');
            }
          },
        },
        {
          text: 'Full JSON Backup',
          onPress: async () => {
            try {
              const json = VaultCryptoService.exportVaultJSON(entries);
              await Share.share({
                title: 'KeePassDX Vault JSON Backup',
                message: json,
              });
            } catch {
              Alert.alert('Export Failed', 'Unable to create JSON backup.');
            }
          },
        },
      ]
    );
  };

  // Import Backup
  const handleImportBackup = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      const hasClipboardData = Boolean(clipboardText && clipboardText.trim().length > 10);

      if (hasClipboardData) {
        Alert.alert(
          'Import KeePassDX Data',
          'Found vault backup data on your clipboard (JSON or KeePass CSV)! Do you want to import it now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import Clipboard Data',
              onPress: () => {
                const imported = VaultCryptoService.importVaultUniversal(clipboardText);
                if (imported.length > 0) {
                  const count = importEntries(imported);
                  Alert.alert('Import Complete 🎉', `Imported ${count} new vault entries successfully.`);
                } else {
                  Alert.alert('Import Error', 'Invalid format. Ensure valid KeePass JSON or CSV on clipboard.');
                }
              },
            },
          ]
        );
        return;
      }

      if (Platform.OS === 'ios' && Alert.prompt) {
        Alert.prompt(
          'Import KeePassDX Backup',
          'Paste your exported JSON or CSV vault string here:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              onPress: (rawText?: string) => {
                if (!rawText) return;
                const imported = VaultCryptoService.importVaultUniversal(rawText);
                if (imported.length > 0) {
                  const count = importEntries(imported);
                  Alert.alert('Import Complete', `Imported ${count} new vault entries successfully.`);
                } else {
                  Alert.alert('Import Error', 'Invalid backup format or no entries found.');
                }
              },
            },
          ],
          'plain-text'
        );
      } else {
        Alert.alert(
          'Import KeePassDX Backup',
          'Copy your exported KeePassDX JSON or CSV text to your clipboard first, then tap this button to import it with one tap.'
        );
      }
    } catch {
      Alert.alert('Import Error', 'Unable to access clipboard.');
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Group filter
      if (activeGroup === 'favorites' && !entry.isFavorite) return false;
      if (activeGroup !== 'all' && activeGroup !== 'favorites' && entry.group !== activeGroup) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesUser = entry.username.toLowerCase().includes(q);
        const matchesUrl = entry.url?.toLowerCase().includes(q);
        const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesUser && !matchesUrl && !matchesTags) return false;
      }

      return true;
    });
  }, [entries, activeGroup, searchQuery]);

  // Overall audit health score preview
  const auditReport = useMemo(() => VaultCryptoService.auditVault(entries), [entries]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.shieldIconContainer}>
                <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.headerTitle}>KeePassDX Vault</Text>
                <Text style={styles.headerSubtitle}>
                  {isUnlocked ? `${entries.length} Keys Secured • Zero-Knowledge` : 'Locked • Encrypted'}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {isUnlocked && (
                <TouchableOpacity
                  style={styles.lockBtn}
                  onPress={lock}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="lock-closed" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Clipboard Auto-Purge Toast */}
          {clipboardFeedback && (
            <View style={styles.clipboardBadge}>
              <Ionicons name="time-outline" size={14} color="#10B981" />
              <Text style={styles.clipboardBadgeText}>{clipboardFeedback}</Text>
            </View>
          )}

          {/* IF VAULT IS LOCKED -> UNLOCK SHIELD */}
          {!isUnlocked ? (
            <View style={styles.unlockContainer}>
              <View style={styles.unlockShieldGraphic}>
                <Ionicons name="lock-closed" size={48} color="#6366F1" />
              </View>

              <Text style={styles.unlockTitle}>Vault is Locked</Text>
              <Text style={styles.unlockDesc}>
                Enter your Master PIN or authenticate with Biometrics to decrypt your passwords and 2FA tokens.
              </Text>

              <View style={styles.pinInputRow}>
                <TextInput
                  style={styles.pinTextInput}
                  placeholder="Enter 4-digit PIN"
                  placeholderTextColor="#64748B"
                  value={pinInput}
                  onChangeText={(val) => {
                    setPinInput(val);
                    if (pinError) setPinError('');
                  }}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={8}
                  onSubmitEditing={handlePinUnlock}
                />
                <TouchableOpacity style={styles.unlockBtn} onPress={handlePinUnlock}>
                  <Text style={styles.unlockBtnText}>Unlock</Text>
                </TouchableOpacity>
              </View>

              {pinError ? <Text style={styles.pinErrorText}>{pinError}</Text> : null}

              <TouchableOpacity style={styles.biometricBtn} onPress={unlockWithBiometrics}>
                <Ionicons name="finger-print-outline" size={22} color="#A5B4FC" />
                <Text style={styles.biometricBtnText}>Unlock with Fingerprint / Face ID</Text>
              </TouchableOpacity>

              <View style={styles.securityPill}>
                <Ionicons name="shield-outline" size={14} color="#64748B" />
                <Text style={styles.securityPillText}>
                  KeePassDX Grade • AES-256-GCM Zero Knowledge • On-Device Only
                </Text>
              </View>
            </View>
          ) : (
            /* IF VAULT IS UNLOCKED -> FULL VAULT EXPLORER */
            <View style={styles.unlockedBody}>
              {/* Quick Actions Bar */}
              <View style={styles.quickActionsBar}>
                <TouchableOpacity
                  style={[
                    styles.actionChip,
                    auditReport.securityScore < 75 && { borderColor: '#F59E0B' },
                  ]}
                  onPress={() => setIsAuditOpen(true)}
                >
                  <Ionicons
                    name={auditReport.securityScore >= 80 ? 'shield-checkmark' : 'alert-circle'}
                    size={14}
                    color={auditReport.securityScore >= 80 ? '#10B981' : '#F59E0B'}
                  />
                  <Text style={styles.actionChipText}>Audit: {auditReport.securityScore}%</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionChip} onPress={() => setIsGeneratorOpen(true)}>
                  <Ionicons name="sparkles" size={14} color="#6366F1" />
                  <Text style={styles.actionChipText}>Generator</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionChip} onPress={handleExportBackup}>
                  <Ionicons name="download-outline" size={14} color="#94A3B8" />
                  <Text style={styles.actionChipText}>Export</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionChip} onPress={handleImportBackup}>
                  <Ionicons name="cloud-upload-outline" size={14} color="#94A3B8" />
                  <Text style={styles.actionChipText}>Import</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addPrimaryBtn}
                  onPress={() => {
                    setSelectedEntry(null);
                    setIsAddEditOpen(true);
                  }}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addPrimaryBtnText}>New Key</Text>
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search logins, URLs, API keys..."
                  placeholderTextColor="#64748B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Group Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.groupFilterScroll}
                contentContainerStyle={styles.groupFilterContent}
              >
                {GROUP_FILTERS.map((item) => {
                  const isActive = activeGroup === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.groupFilterChip, isActive && styles.groupFilterChipActive]}
                      onPress={() => setActiveGroup(item.key)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={14}
                        color={isActive ? '#FFFFFF' : '#94A3B8'}
                      />
                      <Text
                        style={[
                          styles.groupFilterChipText,
                          isActive && styles.groupFilterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Entry List */}
              <ScrollView
                style={styles.entryList}
                contentContainerStyle={styles.entryListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredEntries.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="key-outline" size={48} color="#334155" />
                    <Text style={styles.emptyTitle}>No Entries Found</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery
                        ? 'Try adjusting your search query or group filter.'
                        : 'Tap "+ New Key" to store your first password or 2FA token.'}
                    </Text>
                  </View>
                ) : (
                  filteredEntries.map((entry) => {
                    const isRevealed = visiblePasswords[entry.id] || false;
                    const totpRes = entry.totpSecret ? TotpService.generate(entry.totpSecret) : null;
                    const totpCode = totpRes?.code || null;
                    const totpSeconds = totpRes?.secondsRemaining || 30;
                    const totpProgress = (totpSeconds / 30) * 100;

                    return (
                      <View key={entry.id} style={styles.entryCard}>
                        {/* Top Card Row */}
                        <View style={styles.entryHeaderRow}>
                          <View style={styles.entryTitleGroup}>
                            <View style={styles.entryGroupBadge}>
                              <Ionicons
                                name={
                                  entry.group === 'logins'
                                    ? 'globe-outline'
                                    : entry.group === 'cards'
                                    ? 'card-outline'
                                    : entry.group === 'servers'
                                    ? 'server-outline'
                                    : entry.group === 'api_keys'
                                    ? 'key-outline'
                                    : 'document-text-outline'
                                }
                                size={14}
                                color="#818CF8"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.entryTitle} numberOfLines={1}>
                                {entry.title}
                              </Text>
                              {entry.url ? (
                                <TouchableOpacity
                                  style={styles.urlRow}
                                  onPress={() => handleOpenUrl(entry.url)}
                                >
                                  <Text style={styles.entryUrl} numberOfLines={1}>
                                    {entry.url.replace(/^https?:\/\//, '')}
                                  </Text>
                                  <Ionicons name="open-outline" size={11} color="#64748B" />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>

                          <View style={styles.entryCardActions}>
                            <TouchableOpacity
                              onPress={() => toggleFavorite(entry.id)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons
                                name={entry.isFavorite ? 'star' : 'star-outline'}
                                size={18}
                                color={entry.isFavorite ? '#FBBF24' : '#64748B'}
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setSelectedEntry(entry);
                                setIsAddEditOpen(true);
                              }}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons name="pencil-outline" size={17} color="#94A3B8" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleDeleteEntry(entry)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons name="trash-outline" size={17} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Username Row */}
                        {entry.username ? (
                          <View style={styles.credentialRow}>
                            <View style={styles.credentialLabelRow}>
                              <Ionicons name="person-outline" size={13} color="#64748B" />
                              <Text style={styles.credentialText} numberOfLines={1}>
                                {entry.username}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.copySmallBtn}
                              onPress={() => handleCopyUsername(entry.username)}
                            >
                              <Ionicons name="copy-outline" size={13} color="#818CF8" />
                              <Text style={styles.copySmallBtnText}>Copy</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {/* Password Row */}
                        {entry.password ? (
                          <View style={styles.credentialRow}>
                            <View style={styles.credentialLabelRow}>
                              <Ionicons name="key-outline" size={13} color="#64748B" />
                              <Text style={styles.passwordText} numberOfLines={1}>
                                {isRevealed ? entry.password : '••••••••••••'}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <TouchableOpacity
                                style={styles.iconActionBtn}
                                onPress={() => toggleRevealPassword(entry.id)}
                              >
                                <Ionicons
                                  name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                                  size={15}
                                  color="#94A3B8"
                                />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.copySmallBtn}
                                onPress={() => handleCopyPassword(entry.password)}
                              >
                                <Ionicons name="copy-outline" size={13} color="#818CF8" />
                                <Text style={styles.copySmallBtnText}>Copy (30s)</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}

                        {/* TOTP 2FA Token Card (RFC 6238 Live countdown) */}
                        {totpCode ? (
                          <View style={styles.totpCard}>
                            <View style={styles.totpHeader}>
                              <View style={styles.totpTitleRow}>
                                <Ionicons name="time" size={13} color="#10B981" />
                                <Text style={styles.totpLabel}>2FA Authenticator Code</Text>
                              </View>
                              <View style={styles.totpTimerBadge}>
                                <Text style={styles.totpTimerText}>{totpSeconds}s</Text>
                              </View>
                            </View>

                            {/* Progress bar */}
                            <View style={styles.totpProgressBarBg}>
                              <View
                                style={[
                                  styles.totpProgressBarFill,
                                  {
                                    width: `${totpProgress}%`,
                                    backgroundColor: totpSeconds <= 5 ? '#EF4444' : '#10B981',
                                  },
                                ]}
                              />
                            </View>

                            <View style={styles.totpCodeRow}>
                              <Text style={styles.totpCodeText}>
                                {totpCode.slice(0, 3)} {totpCode.slice(3)}
                              </Text>

                              <TouchableOpacity
                                style={styles.totpCopyBtn}
                                onPress={() => handleCopyTotp(entry.totpSecret!)}
                              >
                                <Ionicons name="copy-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.totpCopyBtnText}>Copy Token</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}

                        {/* Custom Fields Preview */}
                        {entry.customFields && entry.customFields.length > 0 && (
                          <View style={styles.customFieldsRow}>
                            {entry.customFields.map((cf) => (
                              <TouchableOpacity
                                key={cf.id}
                                style={styles.customFieldChip}
                                onPress={() => {
                                  VaultCryptoService.copySecureWithAutoPurge(cf.value, cf.label);
                                  showCopyFeedback(cf.label);
                                }}
                              >
                                <Text style={styles.customFieldLabel}>{cf.label}:</Text>
                                <Text style={styles.customFieldValue} numberOfLines={1}>
                                  {cf.isProtected ? '••••' : cf.value}
                                </Text>
                                <Ionicons name="copy-outline" size={10} color="#64748B" />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* Sub Modals */}
          <PasswordGeneratorModal
            visible={isGeneratorOpen}
            onClose={() => setIsGeneratorOpen(false)}
          />

          <VaultAuditModal
            visible={isAuditOpen}
            onClose={() => setIsAuditOpen(false)}
            onSelectEntryForEdit={(entry) => {
              setIsAuditOpen(false);
              setSelectedEntry(entry);
              setIsAddEditOpen(true);
            }}
          />

          <AddEditVaultEntryModal
            visible={isAddEditOpen}
            entryToEdit={selectedEntry}
            onClose={() => {
              setIsAddEditOpen(false);
              setSelectedEntry(null);
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  closeBtn: {
    padding: 4,
  },
  clipboardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.3)',
  },
  clipboardBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },

  // Unlock Shield View
  unlockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  unlockShieldGraphic: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unlockTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  unlockDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  pinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
  },
  pinTextInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unlockBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pinErrorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 16,
    fontWeight: '600',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 12,
  },
  biometricBtnText: {
    color: '#C7D2FE',
    fontSize: 14,
    fontWeight: '600',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 16,
  },
  securityPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },

  // Unlocked Explorer
  unlockedBody: {
    flex: 1,
  },
  quickActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexWrap: 'wrap',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionChipText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  addPrimaryBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    padding: 0,
  },

  // Groups
  groupFilterScroll: {
    maxHeight: 44,
    marginTop: 10,
  },
  groupFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  groupFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  groupFilterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  groupFilterChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  groupFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Entry list
  entryList: {
    flex: 1,
    marginTop: 10,
  },
  entryListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Cards
  entryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  entryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  entryGroupBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  entryUrl: {
    color: '#64748B',
    fontSize: 11,
  },
  entryCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
  },

  // Credential rows
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  credentialLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  credentialText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  passwordText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copySmallBtnText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  iconActionBtn: {
    padding: 4,
  },

  // TOTP Card
  totpCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 6,
  },
  totpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totpLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totpTimerBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  totpTimerText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  totpProgressBarBg: {
    height: 3,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  totpProgressBarFill: {
    height: '100%',
  },
  totpCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totpCodeText: {
    color: '#34D399',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  totpCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  totpCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Custom Fields
  customFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  customFieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  customFieldLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  customFieldValue: {
    color: '#E2E8F0',
    fontSize: 11,
    maxWidth: 120,
  },
});
