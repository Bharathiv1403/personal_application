import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useHealthStore } from '../state/health-store';
import { PedometerService } from '@/core/native-bridges/pedometer-adapter';

export const HealthScreen: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [sensorLive, setSensorLive] = useState(false);

  // Store bindings
  const todaySteps = useHealthStore((s) => s.todaySteps);
  const stepGoal = useHealthStore((s) => s.stepGoal);
  const caloriesBurned = useHealthStore((s) => s.caloriesBurnedKcal);
  const distanceKm = useHealthStore((s) => s.distanceKm);
  const moveMinutes = useHealthStore((s) => s.activeMoveMinutes);
  const waterMl = useHealthStore((s) => s.waterIntakeMl);
  const waterGoal = useHealthStore((s) => s.waterGoalMl);
  const sleepHours = useHealthStore((s) => s.sleepHours);
  const sleepQuality = useHealthStore((s) => s.sleepQuality);
  const weeklyHistory = useHealthStore((s) => s.weeklyStepsHistory);

  const addLiveSteps = useHealthStore((s) => s.addLiveSteps);
  const setTodaySteps = useHealthStore((s) => s.setTodaySteps);
  const addWater = useHealthStore((s) => s.addWater);

  // Subscribe to hardware pedometer on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    PedometerService.checkAvailability().then(({ isAvailable, permissionGranted }) => {
      if (isAvailable && permissionGranted) {
        setSensorLive(true);
        PedometerService.getTodaySteps().then((realSteps) => {
          if (realSteps > 0) {
            setTodaySteps(realSteps);
          }
        });
        unsubscribe = PedometerService.subscribeLiveSteps((liveSteps) => {
          addLiveSteps(liveSteps);
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [addLiveSteps, setTodaySteps]);

  const handleManualWalkSimulate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addLiveSteps(250);
  };

  const handleWaterTap = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addWater(amount);
  };

  const percentGoal = Math.min(100, Math.round((todaySteps / stepGoal) * 100));

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Health & Vitality</Text>
            <Text style={styles.screenSubtitle}>Google Fit Sensor Engine</Text>
          </View>
          <Badge
            label={sensorLive ? 'Sensor: Hardware Live' : 'Pedometer Ready'}
            variant={sensorLive ? 'primary' : 'cyan'}
          />
        </View>

        {/* Time Horizon Filter */}
        <View style={styles.filterRow}>
          {(['Day', 'Week', 'Month'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTimeFilter(filter);
              }}
              style={[styles.filterBtn, timeFilter === filter && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                {filter === 'Day' ? '📅 Today' : filter === 'Week' ? '📊 7 Days' : '📈 30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Google Fit Circular Steps Card */}
        <GlassCard variant="highlight" style={styles.stepRingCard}>
          <TouchableOpacity activeOpacity={0.9} onPress={handleManualWalkSimulate} style={styles.ringVisualContainer}>
            <View style={[styles.ringOuterCircle, percentGoal >= 100 && styles.ringGoalReached]}>
              <View style={styles.ringInnerCircle}>
                <Ionicons name="footsteps" size={26} color={percentGoal >= 100 ? Colors.gold : Colors.primary} />
                <Text style={styles.stepsBigCount}>{todaySteps.toLocaleString('en-IN')}</Text>
                <Text style={styles.stepsGoalText}>of {stepGoal.toLocaleString('en-IN')} steps</Text>
                <Text style={styles.stepsPercentText}>{percentGoal}% of daily target</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.tapTipText}>💡 Tap ring to simulate walking +250 steps</Text>

          {/* Vitals Breakdown Row */}
          <View style={styles.vitalsRow}>
            <View style={styles.vitalItem}>
              <Text style={styles.vitalVal}>{caloriesBurned}</Text>
              <Text style={styles.vitalLbl}>Kcal Burned</Text>
            </View>
            <View style={styles.vitalDivider} />
            <View style={styles.vitalItem}>
              <Text style={styles.vitalVal}>{distanceKm} km</Text>
              <Text style={styles.vitalLbl}>Distance</Text>
            </View>
            <View style={styles.vitalDivider} />
            <View style={styles.vitalItem}>
              <Text style={styles.vitalVal}>{moveMinutes} min</Text>
              <Text style={styles.vitalLbl}>Active Move</Text>
            </View>
          </View>
        </GlassCard>

        {/* Interactive 7-Day Chart */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>7-Day Movement Consistency</Text>
            <Text style={styles.chartAvgText}>
              Avg: {Math.round(weeklyHistory.reduce((a, b) => a + b.steps, 0) / weeklyHistory.length).toLocaleString('en-IN')} steps
            </Text>
          </View>

          <View style={styles.barsRow}>
            {weeklyHistory.map((item, i) => {
              const barHeightPercent = Math.min(100, Math.round((item.steps / 11000) * 100));
              const isToday = i === weeklyHistory.length - 1;

              return (
                <View key={item.dayLabel} style={styles.barColumn}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${barHeightPercent}%` },
                      isToday ? { backgroundColor: Colors.primary } : null,
                    ]}
                  />
                  <Text style={[styles.barLabel, isToday && { color: Colors.primary, fontWeight: '700' }]}>
                    {item.dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Hydration Water Intake */}
        <GlassCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.waterTitle}>Hydration Tracker 💧</Text>
              <Text style={styles.waterSubtitle}>
                {waterMl} ml / {waterGoal} ml ({Math.round((waterMl / waterGoal) * 100)}%)
              </Text>
            </View>
            <Badge
              label={waterMl >= waterGoal ? 'Goal Met!' : 'In Progress'}
              variant={waterMl >= waterGoal ? 'primary' : 'cyan'}
            />
          </View>

          {/* Water Progress Bar */}
          <View style={styles.waterBarBg}>
            <View
              style={[
                styles.waterBarFill,
                { width: `${Math.min(100, (waterMl / waterGoal) * 100)}%` },
              ]}
            />
          </View>

          {/* Quick Add Buttons */}
          <View style={styles.waterActionsRow}>
            <TouchableOpacity style={styles.waterBtn} onPress={() => handleWaterTap(250)}>
              <Ionicons name="add" size={14} color={Colors.cyan} />
              <Text style={styles.waterBtnText}>+250 ml Glass</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.waterBtn} onPress={() => handleWaterTap(500)}>
              <Ionicons name="add" size={14} color={Colors.cyan} />
              <Text style={styles.waterBtnText}>+500 ml Bottle</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Sleep & Ergonomics Row */}
        <View style={styles.miniCardsRow}>
          <GlassCard style={styles.miniCard}>
            <Ionicons name="moon-outline" size={20} color={Colors.purple} />
            <Text style={styles.miniCardTitle}>Sleep Recovery</Text>
            <Text style={styles.miniCardVal}>{sleepHours} Hours</Text>
            <Text style={styles.miniCardSub}>{sleepQuality} Quality</Text>
          </GlassCard>

          <GlassCard style={styles.miniCard}>
            <Ionicons name="eye-outline" size={20} color={Colors.gold} />
            <Text style={styles.miniCardTitle}>20-20-20 Shield</Text>
            <Text style={styles.miniCardVal}>Every 45m</Text>
            <Text style={styles.miniCardSub}>Eye & Posture Check</Text>
          </GlassCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: Spacing.lg,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  filterBtnActive: {
    backgroundColor: Colors.cardElevated,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stepRingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  ringVisualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  ringOuterCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 8,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  ringGoalReached: {
    borderColor: Colors.gold,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  ringInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsBigCount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  stepsGoalText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stepsPercentText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  tapTipText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalVal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  vitalLbl: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  vitalDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chartAvgText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    width: 28,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
    borderRadius: 4,
    backgroundColor: Colors.cardSubtle,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  waterCard: {
    marginBottom: Spacing.lg,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  waterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  waterSubtitle: {
    fontSize: 12,
    color: Colors.cyan,
    marginTop: 2,
  },
  waterBarBg: {
    height: 10,
    backgroundColor: Colors.cardSubtle,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginVertical: Spacing.sm,
  },
  waterBarFill: {
    height: '100%',
    backgroundColor: Colors.cyan,
    borderRadius: Radii.full,
  },
  waterActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  waterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cyanGlow,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingVertical: 7,
    borderRadius: Radii.md,
    gap: 6,
  },
  waterBtnText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  miniCard: {
    flex: 1,
    padding: Spacing.md,
  },
  miniCardTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  miniCardVal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  miniCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
