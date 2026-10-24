import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useAuthStore } from '../state/auth-store';
import { GoogleAuthService } from '@/core/utils/google-auth';

export const SignInScreen: React.FC = () => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isBiometricSupported = useAuthStore((s) => s.isBiometricSupported);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const signInWithPin = useAuthStore((s) => s.signInWithPin);
  const signInWithBiometrics = useAuthStore((s) => s.signInWithBiometrics);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const resetAccount = useAuthStore((s) => s.resetAccount);

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const googleUser = await GoogleAuthService.promptGoogleSignIn();
    if (googleUser) {
      const success = await signInWithGoogle(googleUser);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }
  };

  // Auto-prompt biometrics if supported and enabled
  useEffect(() => {
    if (isBiometricSupported && isBiometricEnabled) {
      signInWithBiometrics();
    }
  }, [isBiometricSupported, isBiometricEnabled]);

  const handleKeyPress = async (val: string) => {
    if (enteredPin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const newPin = enteredPin + val;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      const isValid = await signInWithPin(newPin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setErrorShake(true);
        setTimeout(() => {
          setEnteredPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Vault Credentials?',
      'If you have forgotten your PIN, resetting will erase the security lock and allow you to re-register. Your local data will be reset.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Re-register',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            resetAccount();
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Vault Master'} 👋</Text>
          <Text style={styles.subtext}>Enter your 4-digit PIN to access your OS</Text>
        </View>

        {/* PIN Indicators */}
        <View style={[styles.pinDotsRow, errorShake && styles.pinDotsError]}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = enteredPin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  isFilled ? styles.pinDotFilled : null,
                  errorShake ? styles.pinDotError : null,
                ]}
              />
            );
          })}
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={styles.keyButton}
                  onPress={() => handleKeyPress(digit)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keyText}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom row: Biometric / 0 / Backspace */}
          <View style={styles.keypadRow}>
            {isBiometricSupported ? (
              <TouchableOpacity
                style={styles.keyButtonSpecial}
                onPress={signInWithBiometrics}
                activeOpacity={0.6}
              >
                <Ionicons name="finger-print-outline" size={28} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.keyButtonSpecial} />
            )}

            <TouchableOpacity
              style={styles.keyButton}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.6}
            >
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyButtonSpecial}
              onPress={handleDelete}
              activeOpacity={0.6}
            >
              <Ionicons name="backspace-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Google Sign In & Reset Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity
            style={styles.googlePillBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={15} color="#EA4335" />
            <Text style={styles.googlePillText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} onPress={handleReset}>
            <Text style={styles.forgotText}>Forgot PIN? Reset credentials</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.screenPadding,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  subtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: Spacing.lg,
  },
  pinDotsError: {
    transform: [{ translateX: -4 }],
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinDotError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger,
  },
  keypad: {
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  keyButton: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  keyButtonSpecial: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  googlePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    gap: Spacing.xs,
  },
  googlePillText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  forgotBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
