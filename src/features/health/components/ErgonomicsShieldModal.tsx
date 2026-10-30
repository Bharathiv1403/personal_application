import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useHealthStore } from '../state/health-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STRETCHES = [
  { id: '1', title: '20-20-20 Eye Rest', desc: 'Look at an object 20 feet away for 20 seconds to relax ciliary eye muscles.', icon: 'eye-outline' },
  { id: '2', title: 'Neck Tilt & Roll', desc: 'Gently tilt ear towards shoulder, hold 10 seconds each side to ease neck tension.', icon: 'body-outline' },
  { id: '3', title: 'Shoulder Blade Retraction', desc: 'Pull shoulder blades backward & down. Hold for 5 seconds x 3 reps.', icon: 'fitness-outline' },
  { id: '4', title: 'Desk Spinal Twist', desc: 'Sit upright, place left hand on right knee, twist gently to right. Repeat opposite.', icon: 'refresh-outline' },
  { id: '5', title: 'Stand & Hydrate', desc: 'Stand up, walk 20 steps, and drink a glass of fresh water.', icon: 'water-outline' },
];

export const ErgonomicsShieldModal: React.FC<Props> = ({ visible, onClose }) => {
  const ergonomicsShieldActive = useHealthStore((s) => s.ergonomicsShieldActive);
  const toggleErgonomicsShield = useHealthStore((s) => s.toggleErgonomicsShield);

  const [activeStep, setActiveStep] = useState<'info' | 'timer'>('info');
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedStretches, setCompletedStretches] = useState<string[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const start20SecTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimerSeconds(20);
    setIsTimerRunning(true);
    setActiveStep('timer');
  };

  const toggleStretch = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCompletedStretches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="eye" size={20} color={Colors.gold} />
              </View>
              <View>
                <Text style={styles.title}>20-20-20 Eye & Posture Shield</Text>
                <Text style={styles.subtitle}>Developer Ergonomics & Strain Relief</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* 45m recurring toggle */}
            <View style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>45-Minute Posture Nudges</Text>
                <Text style={styles.toggleDesc}>
                  Vibrate phone every 45m of active screen time to check eye focus and back posture.
                </Text>
              </View>
              <Switch
                value={ergonomicsShieldActive}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  toggleErgonomicsShield(val);
                }}
                trackColor={{ false: Colors.cardElevated, true: Colors.gold }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Live 20-Second Eye Relaxation Timer */}
            <View style={styles.timerCard}>
              <View style={styles.timerContent}>
                <Text style={styles.timerTitle}>20-Second Eye Break</Text>
                <Text style={styles.timerSub}>Look 20 feet (6 meters) away into distance.</Text>
                <Text style={styles.timerDigits}>{timerSeconds}s</Text>

                <TouchableOpacity
                  style={[styles.timerActionBtn, isTimerRunning && styles.timerActionBtnActive]}
                  onPress={isTimerRunning ? () => setIsTimerRunning(false) : start20SecTimer}
                >
                  <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={16} color="#09090B" />
                  <Text style={styles.timerActionText}>
                    {isTimerRunning ? 'Pause Eye Timer' : timerSeconds === 0 ? 'Restart 20s' : 'Start 20s Eye Break'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick 1-Minute Desk Stretch Checklist */}
            <Text style={styles.sectionHeader}>Quick 1-Minute Desk Stretches</Text>

            <View style={styles.stretchesStack}>
              {STRETCHES.map((s) => {
                const isDone = completedStretches.includes(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.stretchItem, isDone && styles.stretchItemDone]}
                    activeOpacity={0.7}
                    onPress={() => toggleStretch(s.id)}
                  >
                    <Ionicons
                      name={isDone ? 'checkmark-circle' : (s.icon as any)}
                      size={20}
                      color={isDone ? Colors.primary : Colors.gold}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stretchTitle, isDone && styles.stretchTitleDone]}>
                        {s.title}
                      </Text>
                      <Text style={styles.stretchDesc}>{s.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toggleDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: 8,
  },
  timerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  timerContent: {
    alignItems: 'center',
    width: '100%',
  },
  timerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  timerDigits: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.gold,
    marginVertical: 4,
  },
  timerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radii.full,
    marginTop: 8,
  },
  timerActionBtnActive: {
    backgroundColor: Colors.danger,
  },
  timerActionText: {
    color: '#09090B',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stretchesStack: {
    gap: 8,
  },
  stretchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stretchItemDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  stretchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stretchTitleDone: {
    color: Colors.primary,
    textDecorationLine: 'line-through',
  },
  stretchDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
