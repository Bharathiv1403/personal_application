import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useJobStore, JobStage, JobApplicationItem } from '../state/job-store';
import { useCandidateProfileStore } from '../state/candidate-profile-store';
import { CareerProfileModal } from '../components/CareerProfileModal';
import { JobPreferencesModal } from '../components/JobPreferencesModal';
import { AnswerBankModal } from '../components/AnswerBankModal';
import { AutoApplyPreviewModal } from '../components/AutoApplyPreviewModal';
import { AddJobModal } from '../components/AddJobModal';
import { AtsScannerModal } from '../components/AtsScannerModal';
import { InHandSalaryModal } from '../components/InHandSalaryModal';
import { AiCoverLetterModal } from '../components/AiCoverLetterModal';
import { InterviewCoachModal } from '../components/InterviewCoachModal';

type NavTab = 'Jobs' | 'Tracker' | 'Profile' | 'Preferences' | 'Answer Bank';

export const CareerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Jobs');
  const [trackerStage, setTrackerStage] = useState<'All' | 'wishlist' | 'applied' | 'interview' | 'offer'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [answerBankModalVisible, setAnswerBankModalVisible] = useState(false);
  const [autoApplyModalVisible, setAutoApplyModalVisible] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobApplicationItem | null>(null);

  const [addJobModalVisible, setAddJobModalVisible] = useState(false);
  const [atsModalVisible, setAtsModalVisible] = useState(false);
  const [inHandModalVisible, setInHandModalVisible] = useState(false);
  const [coverLetterModalVisible, setCoverLetterModalVisible] = useState(false);
  const [coachModalVisible, setCoachModalVisible] = useState(false);
  const [selectedJobForLetter, setSelectedJobForLetter] = useState<JobApplicationItem | null>(null);

  // Stores
  const jobs = useJobStore((s) => s.jobs);
  const isLoadingLiveJobs = useJobStore((s) => s.isLoadingLiveJobs);
  const updateJobStage = useJobStore((s) => s.updateJobStage);
  const applyToJob = useJobStore((s) => s.applyToJob);
  const deleteJob = useJobStore((s) => s.deleteJob);
  const refreshLiveJobs = useJobStore((s) => s.refreshLiveJobs);
  const profile = useCandidateProfileStore();

  // Statistics
  const totalDiscovered = jobs.length;
  const appliedCount = jobs.filter((j) => j.stage === 'applied').length;
  const interviewCount = jobs.filter((j) => j.stage === 'interview' || j.stage === 'assessment').length;
  const offerCount = jobs.filter((j) => j.stage === 'offer').length;
  const highMatchCount = jobs.filter((j) => (j.matchScore || 0) >= (profile.preferences.skillsMatchThreshold || 75)).length;

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        j.role.toLowerCase().includes(query) ||
        j.companyName.toLowerCase().includes(query) ||
        (j.tags && j.tags.some((t) => t.toLowerCase().includes(query)));

      if (activeTab === 'Tracker') {
        const matchesStage = trackerStage === 'All' ? true : j.stage === trackerStage;
        return matchesStage && matchesQuery;
      }

      return matchesQuery;
    });
  }, [jobs, activeTab, trackerStage, searchQuery]);

  const handleLiveAutoSearch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const count = await refreshLiveJobs(searchQuery);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Live Discovery Complete ⚡',
      count > 0
        ? `Found and synced ${count} new matching roles from Greenhouse, Lever & Remote job feeds!`
        : 'All job feeds are up to date with your resume preferences.'
    );
  };

  const handleOpenAutoApply = (job: JobApplicationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedJobForApply(job);
    setAutoApplyModalVisible(true);
  };

  const handleOpenCoverLetter = (job: JobApplicationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedJobForLetter(job);
    setCoverLetterModalVisible(true);
  };

  const handleFollowUp = (company: string, recruiter?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert(
      'Follow-Up Template Ready 📬',
      `Subject: Follow-up on Application - ${company}\n\nHi ${recruiter || 'Hiring Team'},\n\nI am following up on my application for the Developer position at ${company}. Having architected scalable production apps, I am eager to discuss how my experience fits your team.\n\nBest regards,\n${profile.name}\n${profile.targetRole}`
    );
  };

  const getStageVariant = (stage: JobStage) => {
    switch (stage) {
      case 'interview':
        return 'purple';
      case 'applied':
        return 'cyan';
      case 'offer':
        return 'primary';
      case 'assessment':
        return 'gold';
      default:
        return 'neutral';
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================= */}
        {/* TOP HEADER & ANALYTICS BANNER */}
        {/* ========================================================= */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.screenTitle}>CareerPilot OS</Text>
              <Badge label="AUTO-APPLY READY" variant="primary" />
            </View>
            <Text style={styles.screenSubtitle}>
              {profile.name} • {profile.targetRole}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerAiBtn}
            onPress={() => setCoachModalVisible(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={14} color="#A855F7" />
            <Text style={styles.headerAiText}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Analytics Grid */}
        <GlassCard style={styles.analyticsCard} variant="elevated">
          <View style={styles.analyticsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalDiscovered}</Text>
              <Text style={styles.statLabel}>Discovered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#38BDF8' }]}>{highMatchCount}</Text>
              <Text style={styles.statLabel}>Top Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#4ADE80' }]}>{appliedCount}</Text>
              <Text style={styles.statLabel}>Applied</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#C084FC' }]}>{interviewCount}</Text>
              <Text style={styles.statLabel}>Interviews</Text>
            </View>
          </View>
        </GlassCard>

        {/* ========================================================= */}
        {/* QUICK ACTION BAR */}
        {/* ========================================================= */}
        <View style={styles.quickBar}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366F1' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setProfileModalVisible(true);
            }}
          >
            <Ionicons name="person" size={14} color="#818CF8" />
            <Text style={[styles.quickBtnText, { color: '#818CF8' }]}>Profile & Resumes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setPreferencesModalVisible(true);
            }}
          >
            <Ionicons name="options" size={14} color="#38BDF8" />
            <Text style={[styles.quickBtnText, { color: '#38BDF8' }]}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAnswerBankModalVisible(true);
            }}
          >
            <Ionicons name="bookmark" size={14} color="#10B981" />
            <Text style={[styles.quickBtnText, { color: '#10B981' }]}>Answer Bank</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* NAVIGATION SEGMENTED TABS */}
        {/* ========================================================= */}
        <View style={styles.navTabRow}>
          {(['Jobs', 'Tracker', 'Profile', 'Preferences', 'Answer Bank'] as NavTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.navTabChip, isSelected && styles.navTabChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  if (tab === 'Profile') setProfileModalVisible(true);
                  else if (tab === 'Preferences') setPreferencesModalVisible(true);
                  else if (tab === 'Answer Bank') setAnswerBankModalVisible(true);
                  else setActiveTab(tab);
                }}
              >
                <Text style={[styles.navTabChipText, isSelected && styles.navTabChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================= */}
        {/* SEARCH & DISCOVERY BAR */}
        {/* ========================================================= */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search roles, skills (React, Vue, Remote)..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleLiveAutoSearch}
            disabled={isLoadingLiveJobs}
          >
            {isLoadingLiveJobs ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Tracker Pipeline Filter (When in Tracker tab) */}
        {activeTab === 'Tracker' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageFilterScroll}>
            {(['All', 'wishlist', 'applied', 'interview', 'offer'] as const).map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.stageChip, trackerStage === st && styles.stageChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setTrackerStage(st);
                }}
              >
                <Text style={[styles.stageChipText, trackerStage === st && styles.stageChipTextActive]}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ========================================================= */}
        {/* JOB CARDS LIST */}
        {/* ========================================================= */}
        <View style={styles.jobsList}>
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="briefcase-outline" size={42} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No matching roles found</Text>
              <Text style={styles.emptySub}>
                Tap the refresh icon to sync real remote opportunities from live job feeds.
              </Text>
            </View>
          ) : (
            filteredJobs.map((job) => {
              const matchScore = job.matchScore || 85;
              const isApplied = job.stage === 'applied';

              return (
                <GlassCard key={job.id} style={styles.jobCard} variant="elevated">
                  {/* Job Header */}
                  <View style={styles.jobCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobRole}>{job.role}</Text>
                      <Text style={styles.jobCompany}>{job.companyName}</Text>
                    </View>
                    <Badge
                      label={`${matchScore}% Match`}
                      variant={matchScore >= 80 ? 'primary' : 'gold'}
                    />
                  </View>

                  {/* Metadata Row */}
                  <View style={styles.jobMetaRow}>
                    <View style={styles.metaPill}>
                      <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.metaPillText}>{job.location}</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="globe-outline" size={12} color="#38BDF8" />
                      <Text style={[styles.metaPillText, { color: '#38BDF8' }]}>{job.workMode}</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="cash-outline" size={12} color="#4ADE80" />
                      <Text style={[styles.metaPillText, { color: '#4ADE80' }]}>
                        ₹{job.ctcMin} – {job.ctcMax} LPA
                      </Text>
                    </View>
                  </View>

                  {/* Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {job.tags.slice(0, 4).map((tag, idx) => (
                        <View key={idx} style={styles.skillChip}>
                          <Text style={styles.skillChipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardDivider} />

                  {/* Bottom Actions */}
                  <View style={styles.jobCardBottom}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Badge label={job.stage.toUpperCase()} variant={getStageVariant(job.stage)} />
                      {job.appliedDate && (
                        <Text style={styles.appliedDateText}>Applied: {job.appliedDate}</Text>
                      )}
                    </View>

                    <View style={styles.cardActionGroup}>
                      <TouchableOpacity
                        style={styles.letterBtn}
                        onPress={() => handleOpenCoverLetter(job)}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#F59E0B" />
                        <Text style={styles.letterBtnText}>Letter</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.applyBtn, isApplied && styles.applyBtnDisabled]}
                        onPress={() => handleOpenAutoApply(job)}
                      >
                        <Ionicons
                          name={isApplied ? 'checkmark-circle' : 'rocket'}
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text style={styles.applyBtnText}>
                          {isApplied ? 'Re-Apply' : 'Auto-Apply'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* ALL MODALS */}
      {/* ========================================================= */}
      <CareerProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
      <JobPreferencesModal
        visible={preferencesModalVisible}
        onClose={() => setPreferencesModalVisible(false)}
      />
      <AnswerBankModal
        visible={answerBankModalVisible}
        onClose={() => setAnswerBankModalVisible(false)}
      />
      <AutoApplyPreviewModal
        visible={autoApplyModalVisible}
        job={selectedJobForApply}
        onClose={() => setAutoApplyModalVisible(false)}
        onApplied={(id) => applyToJob(id)}
        onOpenCoverLetter={handleOpenCoverLetter}
      />
      <AddJobModal
        visible={addJobModalVisible}
        onClose={() => setAddJobModalVisible(false)}
      />
      <AtsScannerModal
        visible={atsModalVisible}
        onClose={() => setAtsModalVisible(false)}
      />
      <InHandSalaryModal
        visible={inHandModalVisible}
        onClose={() => setInHandModalVisible(false)}
      />
      <AiCoverLetterModal
        visible={coverLetterModalVisible}
        job={selectedJobForLetter}
        onClose={() => setCoverLetterModalVisible(false)}
        onApply={(j) => applyToJob(j.id, j.url)}
      />
      <InterviewCoachModal
        visible={coachModalVisible}
        onClose={() => setCoachModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: '#A855F7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    gap: 6,
  },
  headerAiText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A855F7',
  },

  // Analytics Banner
  analyticsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Quick Bar
  quickBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: 6,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Nav Tabs
  navTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  navTabChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  navTabChipActive: {
    backgroundColor: Colors.primary,
  },
  navTabChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  navTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 10,
  },
  syncBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stage Filter
  stageFilterScroll: {
    marginBottom: Spacing.md,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stageChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: Colors.primary,
  },
  stageChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  stageChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Job Cards
  jobsList: {
    gap: 12,
  },
  jobCard: {
    padding: Spacing.md,
    borderRadius: Radii.xl,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobRole: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  jobCompany: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    gap: 4,
  },
  metaPillText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  skillChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  skillChipText: {
    fontSize: 10,
    color: '#A5B4FC',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },
  jobCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedDateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  cardActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  letterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    gap: 4,
  },
  letterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
    gap: 5,
  },
  applyBtnDisabled: {
    backgroundColor: '#059669',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
