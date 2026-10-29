import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { PasswordGenerator, PasswordGeneratorOptions, PasswordScore } from '../utils/password-generator';
import { VaultCryptoService } from '../utils/vault-crypto';

interface PasswordGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  visible,
  onClose,
  onSelectPassword,
}) => {
  const [mode, setMode] = useState<'random' | 'passphrase'>('random');
  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true);
  const [wordCount, setWordCount] = useState(4);

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [score, setScore] = useState<PasswordScore>(PasswordGenerator.evaluateStrength(''));

  const regenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const options: PasswordGeneratorOptions = {
      length,
      useUpper,
      useLower,
      useDigits,
      useSymbols,
      avoidAmbiguous,
      mode,
      wordCount,
      delimiter: '-',
    };
    const pw = PasswordGenerator.generate(options);
    setGeneratedPassword(pw);
    setScore(PasswordGenerator.evaluateStrength(pw));
  };

  useEffect(() => {
    if (visible) {
      regenerate();
    }
  }, [visible, mode, length, useUpper, useLower, useDigits, useSymbols, avoidAmbiguous, wordCount]);

  const handleCopy = async () => {
    await VaultCryptoService.copySecureWithAutoPurge(generatedPassword, 'Password');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onSelectPassword?.(generatedPassword);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="key" size={20} color="#10B981" />
              <View>
                <Text style={styles.title}>KeePassDX Password Generator</Text>
                <Text style={styles.subtitle}>Cryptographically Secure Entropy</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Password Preview Card */}
            <View style={styles.previewBox}>
              <Text style={styles.passwordText} selectable>
                {generatedPassword}
              </Text>
              <TouchableOpacity style={styles.regenerateBtn} onPress={regenerate}>
                <Ionicons name="refresh" size={18} color="#10B981" />
              </TouchableOpacity>
            </View>

            {/* Entropy & Strength Meter */}
            <View style={styles.entropyCard}>
              <View style={styles.entropyRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={16} color={score.color} />
                  <Text style={[styles.strengthLabel, { color: score.color }]}>
                    {score.label}
                  </Text>
                </View>
                <Text style={styles.entropyBitsText}>{score.entropyBits} bits entropy</Text>
              </View>
              <View style={styles.entropyTrack}>
                <View
                  style={[
                    styles.entropyFill,
                    { width: `${score.barPercent}%`, backgroundColor: score.color },
                  ]}
                />
              </View>
            </View>

            {/* Mode Selector */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeChip, mode === 'random' && styles.modeChipActive]}
                onPress={() => setMode('random')}
              >
                <Ionicons
                  name="shuffle"
                  size={14}
                  color={mode === 'random' ? '#FFFFFF' : Colors.textMuted}
                />
                <Text style={[styles.modeText, mode === 'random' && styles.modeTextActive]}>
                  Random Key
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeChip, mode === 'passphrase' && styles.modeChipActive]}
                onPress={() => setMode('passphrase')}
              >
                <Ionicons
                  name="book"
                  size={14}
                  color={mode === 'passphrase' ? '#FFFFFF' : Colors.textMuted}
                />
                <Text style={[styles.modeText, mode === 'passphrase' && styles.modeTextActive]}>
                  Diceware Passphrase
                </Text>
              </TouchableOpacity>
            </View>

            {/* Controls */}
            {mode === 'random' ? (
              <View style={styles.controlsWrap}>
                {/* Length */}
                <View style={styles.controlRow}>
                  <Text style={styles.controlLabel}>Length: {length} characters</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setLength((l) => Math.max(8, l - 2))}
                    >
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setLength((l) => Math.min(64, l + 2))}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Length Preset Chips */}
                <View style={styles.presetRow}>
                  {[12, 16, 20, 24, 32, 48].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.presetChip, length === preset && styles.presetChipActive]}
                      onPress={() => setLength(preset)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          length === preset && styles.presetChipTextActive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Character Toggles */}
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setUseUpper(!useUpper)}
                  >
                    <Ionicons
                      name={useUpper ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={useUpper ? '#10B981' : Colors.textMuted}
                    />
                    <Text style={styles.toggleLabel}>Uppercase Letters (A-Z)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setUseLower(!useLower)}
                  >
                    <Ionicons
                      name={useLower ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={useLower ? '#10B981' : Colors.textMuted}
                    />
                    <Text style={styles.toggleLabel}>Lowercase Letters (a-z)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setUseDigits(!useDigits)}
                  >
                    <Ionicons
                      name={useDigits ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={useDigits ? '#10B981' : Colors.textMuted}
                    />
                    <Text style={styles.toggleLabel}>Numbers (0-9)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setUseSymbols(!useSymbols)}
                  >
                    <Ionicons
                      name={useSymbols ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={useSymbols ? '#10B981' : Colors.textMuted}
                    />
                    <Text style={styles.toggleLabel}>Special Symbols (!@#$%^&*)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={() => setAvoidAmbiguous(!avoidAmbiguous)}
                  >
                    <Ionicons
                      name={avoidAmbiguous ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={avoidAmbiguous ? '#10B981' : Colors.textMuted}
                    />
                    <Text style={styles.toggleLabel}>Avoid Ambiguous (1, l, I, 0, O)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.controlsWrap}>
                <View style={styles.controlRow}>
                  <Text style={styles.controlLabel}>Words: {wordCount} words</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setWordCount((w) => Math.max(3, w - 1))}
                    >
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => setWordCount((w) => Math.min(8, w + 1))}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={16} color="#38BDF8" />
                <Text style={styles.copyBtnText}>Copy (Auto-Clears 30s)</Text>
              </TouchableOpacity>

              {onSelectPassword && (
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>Apply Password</Text>
                </TouchableOpacity>
              )}
            </View>
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
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  passwordText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
    marginRight: 12,
  },
  regenerateBtn: {
    padding: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  entropyCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: Spacing.lg,
  },
  entropyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  entropyBitsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  entropyTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  entropyFill: {
    height: '100%',
    borderRadius: 3,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  modeChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlsWrap: {
    marginBottom: Spacing.lg,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  presetChipTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  toggleGroup: {
    gap: 12,
    marginTop: Spacing.sm,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
