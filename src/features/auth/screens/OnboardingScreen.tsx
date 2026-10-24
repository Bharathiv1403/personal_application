import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useAuthStore } from '../state/auth-store';
import { useCandidateProfileStore } from '@/features/career/state/candidate-profile-store';
import { useHealthStore } from '@/features/health/state/health-store';
import { useWealthStore } from '@/features/wealth/state/wealth-store';

const POPULAR_SKILLS = [
  'React.js',
  'Next.js',
  'TypeScript',
  'React Native',
  'Expo',
  'Vue.js',
  'Tailwind CSS',
  'Zustand',
  'REST APIs',
  'Hermes',
  'OIDC / Auth',
  'Python',
  'Node.js',
  'System Design',
];

export const OnboardingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Stores
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const user = useAuthStore((s) => s.user);

  const profile = useCandidateProfileStore();
  const setStepGoal = useHealthStore((s) => s.setStepGoal);
  const setMonthlySalary = useWealthStore((s) => s.setMonthlySalary);

  // Form State
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Frontend Developer & Lead');
  const [experience, setExperience] = useState(profile.yearsOfExperience || '2+ years');
  const [noticePeriod, setNoticePeriod] = useState(profile.noticePeriod || '30 Days');
  const [expectedCTC, setExpectedCTC] = useState(profile.expectedCTC || '24 - 30 LPA');
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [newSkillText, setNewSkillText] = useState('');

  const [stepGoalText, setStepGoalText] = useState('10000');
  const [waterGoalText, setWaterGoalText] = useState('3000');
  const [salaryText, setSalaryText] = useState('120000');

  const toggleSkill = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (!newSkillText.trim()) return;
    const clean = newSkillText.trim();
    if (!skills.includes(clean)) {
      setSkills([...skills, clean]);
    }
    setNewSkillText('');
  };

  const handlePickResume = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const success = await profile.pickAndUploadResume();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Resume Attached 📄', 'Resume PDF loaded successfully into your personal career vault!');
    }
  };

  const handleFinishOnboarding = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // 1. Update Candidate Profile
    profile.updateProfile({
      targetRole: targetRole.trim(),
      yearsOfExperience: experience.trim(),
      noticePeriod: noticePeriod.trim(),
      expectedCTC: expectedCTC.trim(),
    });
    profile.setSkills(skills);

    // 2. Update Health & Wealth Goals
    const goalSteps = parseInt(stepGoalText, 10);
    if (!isNaN(goalSteps) && goalSteps > 0) setStepGoal(goalSteps);

    const salary = parseInt(salaryText, 10);
    if (!isNaN(salary) && salary >= 0) setMonthlySalary(salary);

    // 3. Mark Onboarding Complete
    await completeOnboarding();
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.brandRow}>
          <Image source={require('../../../../assets/icon.png')} style={styles.logo} />
          <View>
            <Text style={styles.welcomeTitle}>Welcome to AAYON</Text>
            <Text style={styles.welcomeSubtitle}>
              Hello {user?.name?.split(' ')[0] || 'Executive'}! Let's tailor your personal OS.
            </Text>
          </View>
        </View>

        {/* Step Indicator Progress */}
        <View style={styles.stepsIndicator}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepItemWrap}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep === step && styles.stepCircleActive,
                  currentStep > step && styles.stepCircleCompleted,
                ]}
              >
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={14} color={Colors.textInverse} />
                ) : (
                  <Text style={[styles.stepNumText, currentStep === step && styles.stepNumActive]}>
                    {step}
                  </Text>
                )}
              </View>
              <Text style={styles.stepLabel}>
                {step === 1 ? 'Career' : step === 2 ? 'Resume & Skills' : 'Daily Goals'}
              </Text>
            </View>
          ))}
        </View>

        {/* STEP 1: CAREER & TARGET ROLE */}
        {currentStep === 1 && (
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <Ionicons name="briefcase-outline" size={20} color={Colors.primary} />
              <Text style={styles.stepTitle}>Career Intent & Target Roles</Text>
            </View>
            <Text style={styles.stepDesc}>
              AAYON will auto-discover live remote and tech jobs specifically matching this profile.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Target Role / Position *</Text>
              <TextInput
                style={styles.input}
                value={targetRole}
                onChangeText={setTargetRole}
                placeholder="e.g. Senior Frontend Developer / React Native Lead"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                value={experience}
                onChangeText={setExperience}
                placeholder="e.g. 2+ years"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Notice Period</Text>
                <TextInput
                  style={styles.input}
                  value={noticePeriod}
                  onChangeText={setNoticePeriod}
                  placeholder="e.g. 30 Days"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expected CTC</Text>
                <TextInput
                  style={styles.input}
                  value={expectedCTC}
                  onChangeText={setExpectedCTC}
                  placeholder="e.g. 24 - 30 LPA"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setCurrentStep(2);
              }}
            >
              <Text style={styles.nextBtnText}>Next: Resume & Skills</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} />
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* STEP 2: RESUME UPLOAD & TECH SKILLS */}
        {currentStep === 2 && (
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <Ionicons name="document-text-outline" size={20} color={Colors.gold} />
              <Text style={styles.stepTitle}>Resume & Core Tech Stack</Text>
            </View>
            <Text style={styles.stepDesc}>
              Upload your PDF resume so AAYON can calculate live ATS Match Scores and craft 1-click tailored cover letters.
            </Text>

            {/* Resume Upload Box */}
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickResume}>
              <Ionicons
                name={profile.resumeFileName ? 'document-attach' : 'cloud-upload-outline'}
                size={30}
                color={profile.resumeFileName ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.uploadBoxTitle}>
                {profile.resumeFileName || 'Tap to Upload Resume (PDF)'}
              </Text>
              <Text style={styles.uploadBoxSub}>
                {profile.resumeFileName ? 'Tap to replace with new PDF' : 'PDF, DOCX up to 10MB'}
              </Text>
            </TouchableOpacity>

            {/* Skills Selector */}
            <Text style={styles.sectionHeading}>Tap Skills in Your Repertoire ({skills.length}):</Text>
            <View style={styles.skillsGrid}>
              {POPULAR_SKILLS.map((skill) => {
                const selected = skills.includes(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.skillChip, selected && styles.skillChipActive]}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Ionicons
                      name={selected ? 'checkmark' : 'add'}
                      size={12}
                      color={selected ? Colors.textInverse : Colors.textSecondary}
                    />
                    <Text style={[styles.skillChipText, selected && styles.skillChipTextActive]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add Custom Skill */}
            <View style={styles.addSkillRow}>
              <TextInput
                style={styles.addSkillInput}
                placeholder="Add other skill (e.g. GraphQL, Docker)"
                placeholderTextColor={Colors.textMuted}
                value={newSkillText}
                onChangeText={setNewSkillText}
              />
              <TouchableOpacity style={styles.addSkillBtn} onPress={handleAddCustomSkill}>
                <Text style={styles.addSkillBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(1)}>
                <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextBtnFlex}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setCurrentStep(3);
                }}
              >
                <Text style={styles.nextBtnText}>Next: Daily Goals</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* STEP 3: DAILY VITAL GOALS & LAUNCH */}
        {currentStep === 3 && (
          <GlassCard style={styles.stepCard}>
            <View style={styles.stepCardHeader}>
              <Ionicons name="flame-outline" size={20} color={Colors.cyan} />
              <Text style={styles.stepTitle}>Daily Vitals & Wealth Baseline</Text>
            </View>
            <Text style={styles.stepDesc}>
              AAYON tracks your health vitals via physical phone sensors and keeps your financial records private on-device.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Daily Steps Target</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={stepGoalText}
                onChangeText={setStepGoalText}
                placeholder="10000"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Daily Water Intake (ml)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={waterGoalText}
                onChangeText={setWaterGoalText}
                placeholder="3000"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Monthly Salary / Budget Base (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={salaryText}
                onChangeText={setSalaryText}
                placeholder="e.g. 120000"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentStep(2)}>
                <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.launchBtn} onPress={handleFinishOnboarding}>
                <Ionicons name="rocket" size={16} color={Colors.textInverse} />
                <Text style={styles.launchBtnText}>Launch AAYON 🚀</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  stepItemWrap: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  stepNumActive: {
    color: Colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepCard: {
    padding: Spacing.lg,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: Spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#17171C',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    padding: 12,
    fontSize: 13,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: Spacing.md,
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  uploadBoxSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    gap: 5,
  },
  skillChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  skillChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  skillChipTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  addSkillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  addSkillInput: {
    flex: 1,
    backgroundColor: '#17171C',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  addSkillBtn: {
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  addSkillBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
    gap: 6,
  },
  nextBtnFlex: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radii.md,
    gap: 6,
  },
  nextBtnText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 13,
    borderRadius: Radii.md,
    gap: 6,
  },
  backBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  launchBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radii.md,
    gap: 6,
  },
  launchBtnText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '800',
  },
});
