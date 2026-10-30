import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useHealthStore } from '../state/health-store';
import { useTodoStore } from '@/features/todo/state/todo-store';
import { PedometerService } from '@/core/native-bridges/pedometer-adapter';
import { ScreenTimeLimitModal } from '../components/ScreenTimeLimitModal';
import { ScreenTimeDashboardModal } from '../components/ScreenTimeDashboardModal';
import { SetScreenLimitModal } from '../components/SetScreenLimitModal';
import { AdjustStepsModal } from '../components/AdjustStepsModal';
import { SleepLoggerModal } from '../components/SleepLoggerModal';
import { ErgonomicsShieldModal } from '../components/ErgonomicsShieldModal';
import { WeightTrackerModal } from '../components/WeightTrackerModal';

export const HealthScreen: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [sensorLive, setSensorLive] = useState(false);
  const [sensorNote, setSensorNote] = useState('');

  // Modals state
  const [dashboardModalVisible, setDashboardModalVisible] = useState(false);
  const [setLimitModalVisible, setSetLimitModalVisible] = useState(false);
  const [adjustStepsModalVisible, setAdjustStepsModalVisible] = useState(false);
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [ergonomicsModalVisible, setErgonomicsModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);

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
  const sleepDebtHours = useHealthStore((s) => s.sleepDebtHours);
  const weeklyHistory = useHealthStore((s) => s.weeklyStepsHistory);
  const monthHistory = useHealthStore((s) => s.monthStepsHistory);
  const ergonomicsShieldActive = useHealthStore((s) => s.ergonomicsShieldActive);
  const weightLogs = useHealthStore((s) => s.weightLogs);
  const latestWeight = weightLogs[0]?.weightKg || 70;
  const latestBmi = weightLogs[0]?.bmi || 22.0;

  // Todos for mind-body correlation
  const todos = useTodoStore((s) => s.todos);
  const completedTodosCount = todos.filter((t) => t.completed).length;
  const totalTodosCount = todos.length;

  // Screen time bindings
  const dailyScreenLimitMinutes = useHealthStore((s) => s.dailyScreenLimitMinutes);
  const todayScreenTimeSeconds = useHealthStore((s) => s.todayScreenTimeSeconds);
  const isScreenLimitModalVisible = useHealthStore((s) => s.isScreenLimitModalVisible);
  const openScreenLimitModal = useHealthStore((s) => s.openScreenLimitModal);
  const screenTimeLogs = useHealthStore((s) => s.screenTimeLogs);

  const addLiveSteps = useHealthStore((s) => s.addLiveSteps);
  const setTodaySteps = useHealthStore((s) => s.setTodaySteps);
  const addWater = useHealthStore((s) => s.addWater);
  const checkAndResetDay = useHealthStore((s) => s.checkAndResetDay);

  // Subscribe to hardware pedometer on mount
  useEffect(() => {
    checkAndResetDay();
    let unsubscribe: (() => void) | null = null;

    PedometerService.checkAvailability().then(({ isAvailable, permissionGranted, hasHistoricalSupport }) => {
      if (isAvailable && permissionGranted) {
        setSensorLive(true);
        if (hasHistoricalSupport) {
          PedometerService.getTodaySteps().then((realSteps) => {
            if (realSteps > 0) {
              setTodaySteps(realSteps);
            }
          });
        } else {
          setSensorNote('Live sensor active while app is open');
        }

        unsubscribe = PedometerService.subscribeLiveSteps((deltaSteps) => {
          if (deltaSteps > 0) {
            addLiveSteps(deltaSteps);
          }
        });
      } else {
        setSensorNote('Sensor offline / permission pending');
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [addLiveSteps, setTodaySteps, checkAndResetDay]);

  const handleManualWalkSimulate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addLiveSteps(250);
  };

  const handleWaterTap = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addWater(amount);
  };

  const safeStepGoal = stepGoal > 0 ? stepGoal : 10000;
  const percentGoal = Math.min(100, Math.round((todaySteps / safeStepGoal) * 100)) || 0;

  // Screen time calculations
  const usedMinutes = Math.round(todayScreenTimeSeconds / 60);
  const usedHours = Math.floor(usedMinutes / 60);
  const usedRemMins = usedMinutes % 60;

  const limitHours = Math.floor(dailyScreenLimitMinutes / 60);
  const limitRemMins = dailyScreenLimitMinutes % 60;

  const percentScreenTime = Math.min(
    100,
    dailyScreenLimitMinutes > 0 ? Math.round((usedMinutes / dailyScreenLimitMinutes) * 100) : 0
  );
  const isScreenLimitExceeded = usedMinutes >= dailyScreenLimitMinutes;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, minWidth: 160 }}>
            <Text style={styles.screenTitle}>Health & Vitality</Text>
            <Text style={styles.screenSubtitle}>Movement & Digital Wellbeing</Text>
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleManualWalkSimulate}
            style={styles.ringVisualContainer}
          >
            <View style={[styles.ringOuterCircle, percentGoal >= 100 && styles.ringGoalReached]}>
              <View style={styles.ringInnerCircle}>
                <Ionicons
                  name="footsteps"
                  size={26}
                  color={percentGoal >= 100 ? Colors.gold : Colors.primary}
                />
                <Text style={styles.stepsBigCount}>{todaySteps.toLocaleString('en-IN')}</Text>
                <Text style={styles.stepsGoalText}>of {stepGoal.toLocaleString('en-IN')} steps</Text>
                <Text style={styles.stepsPercentText}>{percentGoal}% of daily target</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick sync & simulate buttons */}
          <View style={styles.stepActionsRow}>
            <TouchableOpacity
              style={styles.stepActionBtn}
              onPress={handleManualWalkSimulate}
            >
              <Ionicons name="walk" size={14} color={Colors.primary} />
              <Text style={styles.stepActionBtnText}>+250 Steps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stepActionBtn, styles.stepActionBtnPrimary]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAdjustStepsModalVisible(true);
              }}
            >
              <Ionicons name="sync" size={14} color={Colors.cyan} />
              <Text style={[styles.stepActionBtnText, { color: Colors.cyan }]}>
                Sync / Adjust Steps
              </Text>
            </TouchableOpacity>
          </View>

          {sensorNote ? <Text style={styles.sensorNoteText}>{sensorNote}</Text> : null}

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

        {/* Digital Wellbeing & Screen Time Card */}
        <GlassCard style={styles.screenTimeCard}>
          <View style={styles.screenTimeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.screenTimeIconWrap}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.cyan} />
              </View>
              <View>
                <Text style={styles.screenTimeTitle}>Screen Time & Limits</Text>
                <Text style={styles.screenTimeSubtitle}>
                  Usage Limiter & Intent Audit
                </Text>
              </View>
            </View>

            <Badge
              label={isScreenLimitExceeded ? 'Limit Reached ⚠️' : 'Within Limit 🌿'}
              variant={isScreenLimitExceeded ? 'danger' : 'primary'}
            />
          </View>

          {/* Time Display */}
          <View style={styles.screenTimeNumbersRow}>
            <View>
              <Text style={styles.screenTimeLargeVal}>
                {usedHours > 0 ? `${usedHours}h ` : ''}
                {usedRemMins}m
              </Text>
              <Text style={styles.screenTimeGoalSub}>
                Limit: {limitHours > 0 ? `${limitHours}h ` : ''}
                {limitRemMins}m ({percentScreenTime}%)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.changeLimitQuickBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSetLimitModalVisible(true);
              }}
            >
              <Ionicons name="settings-outline" size={13} color={Colors.cyan} />
              <Text style={styles.changeLimitQuickText}>Set Limit</Text>
            </TouchableOpacity>
          </View>

          {/* Screen Time Progress Bar */}
          <View style={styles.screenTimeBarBg}>
            <View
              style={[
                styles.screenTimeBarFill,
                { width: `${percentScreenTime}%` },
                isScreenLimitExceeded ? { backgroundColor: Colors.danger } : null,
              ]}
            />
          </View>

          {/* Action Row */}
          <View style={styles.screenTimeActionsRow}>
            <TouchableOpacity
              style={styles.dashboardBtn}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setDashboardModalVisible(true);
              }}
            >
              <Ionicons name="pie-chart-outline" size={15} color={Colors.primary} />
              <Text style={styles.dashboardBtnText}>
                Reports & Dashboard ({screenTimeLogs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testAlertBtn}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                openScreenLimitModal();
              }}
            >
              <Ionicons name="alert-circle-outline" size={15} color={Colors.gold} />
              <Text style={styles.testAlertBtnText}>Test Prompt</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Dynamic Movement Chart (Week Bars or 30-Day Heatmap) */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>
                {timeFilter === 'Month' ? '30-Day Activity Heatmap' : '7-Day Movement Consistency'}
              </Text>
              <Text style={styles.chartAvgText}>
                {timeFilter === 'Month'
                  ? `Goal: ${stepGoal.toLocaleString('en-IN')} steps/day`
                  : `Avg: ${Math.round(
                      weeklyHistory.reduce((a, b) => a + b.steps, 0) / (weeklyHistory.length || 1)
                    ).toLocaleString('en-IN')} steps`}
              </Text>
            </View>
            <Badge
              label={timeFilter === 'Month' ? '30 Days' : 'Past Week'}
              variant={timeFilter === 'Month' ? 'purple' : 'primary'}
            />
          </View>

          {timeFilter === 'Month' ? (
            <View style={styles.monthHeatmapContainer}>
              <View style={styles.heatmapGrid}>
                {monthHistory.map((item, idx) => {
                  const pct = Math.min(100, Math.round((item.steps / (stepGoal || 10000)) * 100));
                  const isMet = pct >= 100;
                  const isModerate = pct >= 50;
                  const hasSteps = item.steps > 0;
                  const isToday = idx === monthHistory.length - 1;

                  const bg = isMet
                    ? Colors.primary
                    : isModerate
                    ? 'rgba(16, 185, 129, 0.45)'
                    : hasSteps
                    ? 'rgba(16, 185, 129, 0.2)'
                    : Colors.cardSubtle;

                  return (
                    <View
                      key={item.date || idx}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: bg },
                        isToday && styles.heatmapCellToday,
                      ]}
                    >
                      <Text style={[styles.heatmapDayText, isMet && { color: '#09090B', fontWeight: '800' }]}>
                        {item.dayLabel}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.heatmapLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: Colors.cardSubtle }]} />
                  <Text style={styles.legendText}>0%</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]} />
                  <Text style={styles.legendText}>&lt;50%</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: 'rgba(16, 185, 129, 0.5)' }]} />
                  <Text style={styles.legendText}>50%+</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.legendText}>100% 🎯</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.barsRow}>
              {weeklyHistory.map((item, i) => {
                const barHeightPercent = Math.min(100, Math.round((item.steps / 11000) * 100));
                const isToday = i === weeklyHistory.length - 1;

                return (
                  <View key={item.date || item.dayLabel} style={styles.barColumn}>
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
          )}
        </GlassCard>

        {/* Hydration Water Intake */}
        <GlassCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.waterTitle}>Hydration Tracker 💧</Text>
              <Text style={styles.waterSubtitle}>
                {waterMl} ml / {waterGoal || 3000} ml (
                {waterGoal > 0 ? Math.min(100, Math.round((waterMl / waterGoal) * 100)) : 0}%)
              </Text>
            </View>
            <Badge
              label={waterMl >= (waterGoal || 3000) ? 'Goal Met!' : 'In Progress'}
              variant={waterMl >= (waterGoal || 3000) ? 'primary' : 'cyan'}
            />
          </View>

          {/* Water Progress Bar */}
          <View style={styles.waterBarBg}>
            <View
              style={[
                styles.waterBarFill,
                { width: `${waterGoal > 0 ? Math.min(100, (waterMl / waterGoal) * 100) : 0}%` },
              ]}
            />
          </View>

          {/* Quick Add Buttons */}
          <View style={styles.waterActionsRow}>
            <TouchableOpacity
              style={styles.waterBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={() => handleWaterTap(250)}
            >
              <Ionicons name="add" size={15} color={Colors.cyan} />
              <Text style={styles.waterBtnText}>+250 ml Glass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waterBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={() => handleWaterTap(500)}
            >
              <Ionicons name="add" size={15} color={Colors.cyan} />
              <Text style={styles.waterBtnText}>+500 ml Bottle</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Sleep, Ergonomics & Body Comp Row */}
        <View style={styles.miniCardsRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setSleepModalVisible(true);
            }}
          >
            <GlassCard style={styles.miniCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Ionicons name="moon-outline" size={20} color={Colors.purple} />
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
              <Text style={styles.miniCardTitle}>Sleep Recovery</Text>
              <Text style={styles.miniCardVal}>{sleepHours} Hours</Text>
              <Text style={styles.miniCardSub}>
                {sleepQuality} • {sleepDebtHours > 0 ? `${sleepDebtHours}h debt` : 'Optimum'}
              </Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setErgonomicsModalVisible(true);
            }}
          >
            <GlassCard style={styles.miniCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Ionicons name="eye-outline" size={20} color={Colors.gold} />
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
              <Text style={styles.miniCardTitle}>20-20-20 Shield</Text>
              <Text style={styles.miniCardVal}>{ergonomicsShieldActive ? 'Active 45m' : 'Paused'}</Text>
              <Text style={styles.miniCardSub}>Eye & Posture Check</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Weight & Fitness Composition Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setWeightModalVisible(true);
          }}
          style={{ marginTop: Spacing.sm }}
        >
          <GlassCard style={styles.weightCard}>
            <View style={styles.weightCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.weightIconWrap}>
                  <Ionicons name="scale-outline" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.weightCardTitle}>Body Weight & Fitness</Text>
                  <Text style={styles.weightCardSub}>BMI Score & Target Trend</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.weightValueText}>{latestWeight} kg</Text>
                <Text style={styles.weightBmiSub}>BMI {latestBmi}</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* AI Mind-Body Productivity Correlation Card */}
        <GlassCard variant="highlight" style={styles.correlationCard}>
          <View style={styles.correlationHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.correlationIconWrap}>
                <Ionicons name="bulb-outline" size={18} color={Colors.purple} />
              </View>
              <View>
                <Text style={styles.correlationTitle}>AI Mind-Body Correlation</Text>
                <Text style={styles.correlationSub}>Movement & Focus Velocity</Text>
              </View>
            </View>
            <Badge label="Neural Sync" variant="purple" />
          </View>

          {/* Quick Metrics Comparison */}
          <View style={styles.correlationMetricsRow}>
            <View style={styles.correlationMetricBox}>
              <Text style={styles.correlationMetricVal}>{todaySteps.toLocaleString('en-IN')}</Text>
              <Text style={styles.correlationMetricLbl}>Steps Walked</Text>
            </View>
            <View style={styles.correlationDivider} />
            <View style={styles.correlationMetricBox}>
              <Text style={styles.correlationMetricVal}>
                {completedTodosCount}/{totalTodosCount || 0}
              </Text>
              <Text style={styles.correlationMetricLbl}>Tasks Crushed</Text>
            </View>
            <View style={styles.correlationDivider} />
            <View style={styles.correlationMetricBox}>
              <Text style={styles.correlationMetricVal}>{(waterMl / 1000).toFixed(1)}L</Text>
              <Text style={styles.correlationMetricLbl}>Hydration</Text>
            </View>
          </View>

          {/* Dynamic Insight Text */}
          <View style={styles.correlationInsightBox}>
            <Ionicons name="sparkles" size={16} color={Colors.gold} style={{ marginTop: 2 }} />
            <Text style={styles.correlationInsightText}>
              {todaySteps >= 7500
                ? `🔥 Peak Cognitive Flow: Walking ${todaySteps.toLocaleString()} steps today elevates neural oxygenation. Your task completion velocity is ~38% higher than sedentary days.`
                : todaySteps < 3500
                ? `💡 Sedentary Alert: Cognitive focus drops after prolonged sitting. A brisk 15-minute walk (+1,500 steps) can sharpen executive decision-making and clear mental fatigue.`
                : `⚡ Balanced Momentum: ${todaySteps.toLocaleString()} steps logged. Completing 8,000 steps historically correlates with 40% faster problem solving and deep focus.`}
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Modals */}
      <ScreenTimeLimitModal visible={isScreenLimitModalVisible} />

      <ScreenTimeDashboardModal
        visible={dashboardModalVisible}
        onClose={() => setDashboardModalVisible(false)}
        onOpenSimulateModal={() => {
          setDashboardModalVisible(false);
          setSetLimitModalVisible(true);
        }}
      />

      <SetScreenLimitModal
        visible={setLimitModalVisible}
        onClose={() => setSetLimitModalVisible(false)}
      />

      <AdjustStepsModal
        visible={adjustStepsModalVisible}
        onClose={() => setAdjustStepsModalVisible(false)}
      />

      <SleepLoggerModal
        visible={sleepModalVisible}
        onClose={() => setSleepModalVisible(false)}
      />

      <ErgonomicsShieldModal
        visible={ergonomicsModalVisible}
        onClose={() => setErgonomicsModalVisible(false)}
      />

      <WeightTrackerModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  screenTitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
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
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringGoalReached: {
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  ringInnerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsBigCount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  stepsGoalText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  stepsPercentText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  stepActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: Spacing.sm,
  },
  stepActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepActionBtnPrimary: {
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: Colors.cyanGlow,
  },
  stepActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  sensorNoteText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.md,
  },
  vitalItem: {
    alignItems: 'center',
    flex: 1,
  },
  vitalVal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  vitalLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vitalDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  screenTimeCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  screenTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  screenTimeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  screenTimeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenTimeSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  screenTimeNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 6,
  },
  screenTimeLargeVal: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  screenTimeGoalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  changeLimitQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changeLimitQuickText: {
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '600',
  },
  screenTimeBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  screenTimeBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  screenTimeActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xs,
  },
  dashboardBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6,
  },
  dashboardBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  testAlertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6,
  },
  testAlertBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
  },
  chartCard: {
    padding: Spacing.lg,
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
    color: Colors.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: Spacing.sm,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
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
    flexWrap: 'wrap',
  },
  waterBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cyanGlow,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingVertical: 11,
    borderRadius: Radii.lg,
    gap: 6,
  },
  waterBtnText: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '700',
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
  monthHeatmapContainer: {
    paddingTop: Spacing.sm,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  heatmapCell: {
    width: '14.5%',
    aspectRatio: 1,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heatmapCellToday: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heatmapDayText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  heatmapLegendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  weightCard: {
    padding: Spacing.md,
  },
  weightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  weightCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weightCardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  weightValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  weightBmiSub: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  correlationCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  correlationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  correlationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  correlationSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  correlationMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  correlationMetricBox: {
    flex: 1,
    alignItems: 'center',
  },
  correlationMetricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  correlationMetricLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  correlationDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  correlationInsightBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  correlationInsightText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});
