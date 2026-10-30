import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultTaskTitle?: string;
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

const MODE_CONFIGS: Record<PomodoroMode, { label: string; durationMinutes: number; color: string }> = {
  work: { label: 'Deep Work', durationMinutes: 25, color: Colors.primary },
  shortBreak: { label: 'Short Break', durationMinutes: 5, color: Colors.cyan },
  longBreak: { label: 'Long Break', durationMinutes: 15, color: Colors.purple },
};

export const PomodoroTimerModal: React.FC<Props> = ({ visible, onClose, defaultTaskTitle }) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [taskFocus, setTaskFocus] = useState(defaultTaskTitle || '');
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    if (defaultTaskTitle) {
      setTaskFocus(defaultTaskTitle);
    }
  }, [defaultTaskTitle]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (mode === 'work') {
        setCompletedSessions((c) => c + 1);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, mode]);

  const switchMode = (newMode: PomodoroMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMode(newMode);
    setIsRunning(false);
    setSecondsLeft(MODE_CONFIGS[newMode].durationMinutes * 60);
  };

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsRunning(false);
    setSecondsLeft(MODE_CONFIGS[mode].durationMinutes * 60);
  };

  if (!visible) return null;

  const currentConfig = MODE_CONFIGS[mode];
  const totalSeconds = currentConfig.durationMinutes * 60;
  const progressPercent = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  const displayMins = Math.floor(secondsLeft / 60);
  const displaySecs = secondsLeft % 60;
  const formattedTime = `${String(displayMins).padStart(2, '0')}:${String(displaySecs).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primaryGlow, borderColor: currentConfig.color }]}>
                <Ionicons name="timer-outline" size={20} color={currentConfig.color} />
              </View>
              <View>
                <Text style={styles.title}>Pomodoro Focus Timer</Text>
                <Text style={styles.subtitle}>{completedSessions} deep sessions finished today</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeRow}>
            {(['work', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => {
              const isSelected = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, isSelected && { backgroundColor: currentConfig.color }]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[styles.modeBtnText, isSelected && { color: '#09090B', fontWeight: '700' }]}>
                    {MODE_CONFIGS[m].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Task Focus Input */}
          <View style={styles.taskFocusBox}>
            <Ionicons name="flash-outline" size={16} color={currentConfig.color} />
            <TextInput
              style={styles.taskInput}
              value={taskFocus}
              onChangeText={setTaskFocus}
              placeholder="What are you focusing on?"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Big Timer Circle */}
          <View style={[styles.timerCircle, { borderColor: currentConfig.color }]}>
            <Text style={[styles.digitsText, { color: currentConfig.color }]}>{formattedTime}</Text>
            <Text style={styles.progressText}>{progressPercent}% Elapsed</Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
              <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: currentConfig.color }]}
              onPress={togglePlay}
            >
              <Ionicons name={isRunning ? 'pause' : 'play'} size={24} color="#09090B" />
              <Text style={styles.playBtnText}>{isRunning ? 'Pause' : 'Start Focus'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 3,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    alignItems: 'center',
  },
  modeBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  taskFocusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  taskInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xl,
  },
  digitsText: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  resetBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
  },
  playBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#09090B',
  },
});
