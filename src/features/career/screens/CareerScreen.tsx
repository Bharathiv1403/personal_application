import React, { useState } from 'react';
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
import { AddJobModal } from '../components/AddJobModal';
import { AtsScannerModal } from '../components/AtsScannerModal';
import { InHandSalaryModal } from '../components/InHandSalaryModal';
import { AiCoverLetterModal } from '../components/AiCoverLetterModal';
import { InterviewCoachModal } from '../components/InterviewCoachModal';
import { useCandidateProfileStore } from '../state/candidate-profile-store';

export const CareerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'wishlist' | 'applied' | 'interview' | 'offer'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [addJobModalVisible, setAddJobModalVisible] = useState(false);
  const [atsModalVisible, setAtsModalVisible] = useState(false);
  const [inHandModalVisible, setInHandModalVisible] = useState(false);
  const [coverLetterModalVisible, setCoverLetterModalVisible] = useState(false);
  const [coachModalVisible, setCoachModalVisible] = useState(false);
  const [selectedJobForLetter, setSelectedJobForLetter] = useState<JobApplicationItem | null>(null);

  const jobs = useJobStore((s) => s.jobs);
  const isLoadingLiveJobs = useJobStore((s) => s.isLoadingLiveJobs);
  const updateJobStage = useJobStore((s) => s.updateJobStage);
  const applyToJob = useJobStore((s) => s.applyToJob);
  const deleteJob = useJobStore((s) => s.deleteJob);
  const refreshLiveJobs = useJobStore((s) => s.refreshLiveJobs);
  const profile = useCandidateProfileStore();

  // Filter jobs by active tab and search query
  const filteredJobs = jobs.filter((j) => {
    const matchesTab = activeTab === 'All' ? true : j.stage === activeTab;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      j.role.toLowerCase().includes(query) ||
      j.companyName.toLowerCase().includes(query) ||
      (j.tags && j.tags.some((t) => t.toLowerCase().includes(query)));
    return matchesTab && matchesQuery;
  });

  const handleLiveAutoSearch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const count = await refreshLiveJobs(searchQuery);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Live Discovery Complete ⚡',
      count > 0
        ? `Found and synced ${count} new matching roles from live remote job boards!`
        : 'All existing roles are up-to-date with your resume skills.'
    );
  };

  const handle1ClickApply = (job: JobApplicationItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    applyToJob(job.id, job.url);
    Alert.alert(
      'Opening Application 🚀',
      `Launching application page for ${job.companyName}. Moving role to your "Applied" tracker!`,
      [{ text: 'OK' }]
    );
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
      `Subject: Follow-up on Senior Developer Application - ${company}\n\nHi ${recruiter || 'Hiring Team'},\n\nI am following up on my application for the Frontend / Mobile Developer position at ${company}. Having architected enterprise SaaS products (Saga Mail, Vue.js, React Native), I am very eager to discuss how my experience fits your team.\n\nBest regards,\nBharathi V\nFrontend Lead`
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
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.screenTitle}>CareerPilot Engine</Text>
              <Badge label="LIVE" variant="primary" />
            </View>
            <Text style={styles.screenSubtitle}>
              {jobs.length} Active Opportunities • {profile.name} ({profile.targetRole})
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAddJobModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Search & Auto-Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search React, Mobile, Next.js, Lead..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.autoSearchBtn}
            onPress={handleLiveAutoSearch}
            disabled={isLoadingLiveJobs}
          >
            {isLoadingLiveJobs ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <>
                <Ionicons name="sync" size={14} color={Colors.textInverse} />
                <Text style={styles.autoSearchBtnText}>Auto-Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Tools Dock */}
        <View style={styles.toolsDock}>
          <TouchableOpacity
            style={styles.toolChip}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              const uploaded = await profile.pickAndUploadResume();
              if (uploaded) {
                Alert.alert('Resume Attached 📄', 'Resume uploaded into your career profile!');
              }
            }}
          >
            <Ionicons name="document-attach-outline" size={15} color={Colors.gold} />
            <Text style={styles.toolChipText} numberOfLines={1}>
              {profile.resumeFileName ? 'Resume (PDF)' : 'Attach Resume'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolChip}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setCoachModalVisible(true);
            }}
          >
            <Ionicons name="school-outline" size={15} color={Colors.primary} />
            <Text style={styles.toolChipText}>Coach</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolChip}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAtsModalVisible(true);
            }}
          >
            <Ionicons name="document-text-outline" size={15} color={Colors.cyan} />
            <Text style={styles.toolChipText}>ATS Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolChip}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setInHandModalVisible(true);
            }}
          >
            <Ionicons name="calculator-outline" size={15} color={Colors.gold} />
            <Text style={styles.toolChipText}>In-Hand CTC</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'All', label: 'All Jobs' },
            { id: 'wishlist', label: 'Discovered' },
            { id: 'applied', label: 'Applied' },
            { id: 'interview', label: 'Interviews' },
            { id: 'offer', label: 'Offers' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab(tab.id as any);
              }}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Job Cards */}
        {filteredJobs.length === 0 ? (
          <GlassCard style={{ padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="briefcase-outline" size={36} color={Colors.primary} />
            <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 10 }}>
              No Roles in {activeTab === 'All' ? 'Pipeline' : activeTab.toUpperCase()}
            </Text>
            <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Tap "Auto-Search" above to discover matching remote & tech jobs from live boards!
            </Text>
          </GlassCard>
        ) : (
          filteredJobs.map((job) => (
            <GlassCard key={job.id} style={styles.jobCard}>
              {/* Top Row: Company & Badges */}
              <View style={styles.jobTopRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {job.companyName}
                  </Text>
                  <Text style={styles.jobRole} numberOfLines={2}>
                    {job.role}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Badge label={job.stage.toUpperCase()} variant={getStageVariant(job.stage)} />
                  {job.matchScore ? (
                    <Badge
                      label={`${job.matchScore}% Match`}
                      variant={job.matchScore >= 90 ? 'primary' : 'gold'}
                    />
                  ) : null}
                </View>
              </View>

              {/* Meta Info: Location & Salary */}
              <View style={styles.jobMetaRow}>
                <Text style={styles.jobMetaText}>
                  <Ionicons name="location-outline" size={13} color={Colors.textSecondary} /> {job.location} ({job.workMode})
                </Text>
                <Text style={styles.jobMetaText}>
                  <Ionicons name="cash-outline" size={13} color={Colors.textSecondary} /> {job.ctcMin} - {job.ctcMax} LPA
                </Text>
              </View>

              {/* Tags Row */}
              {job.tags && job.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {job.tags.slice(0, 4).map((t, idx) => (
                    <View key={idx} style={styles.tagPill}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Primary Action Buttons: 1-Click Apply & AI Cover Letter */}
              <View style={styles.actionButtonsGrid}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.applyBtn]}
                  onPress={() => handle1ClickApply(job)}
                >
                  <Ionicons name="rocket" size={14} color={Colors.textInverse} />
                  <Text style={styles.applyBtnText}>1-Click Apply</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, styles.coverLetterBtn]}
                  onPress={() => handleOpenCoverLetter(job)}
                >
                  <Ionicons name="sparkles" size={14} color={Colors.gold} />
                  <Text style={styles.coverLetterBtnText}>AI Cover Letter</Text>
                </TouchableOpacity>
              </View>

              {/* Secondary Actions: Advance Stage & Delete */}
              <View style={styles.secondaryRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => handleFollowUp(job.companyName, job.recruiterName)}
                >
                  <Ionicons name="mail-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.secondaryBtnText}>Follow Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    const nextStage: JobStage =
                      job.stage === 'wishlist'
                        ? 'applied'
                        : job.stage === 'applied'
                        ? 'interview'
                        : job.stage === 'interview'
                        ? 'offer'
                        : 'wishlist';
                    updateJobStage(job.id, nextStage);
                  }}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={13} color={Colors.primary} />
                  <Text style={styles.secondaryBtnText}>
                    Stage: {job.stage.toUpperCase()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    Alert.alert('Remove Role', `Remove ${job.companyName} from your tracker?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => deleteJob(job.id),
                      },
                    ]);
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <AddJobModal visible={addJobModalVisible} onClose={() => setAddJobModalVisible(false)} />
      <AtsScannerModal visible={atsModalVisible} onClose={() => setAtsModalVisible(false)} />
      <InHandSalaryModal visible={inHandModalVisible} onClose={() => setInHandModalVisible(false)} />
      <AiCoverLetterModal
        visible={coverLetterModalVisible}
        job={selectedJobForLetter}
        onClose={() => setCoverLetterModalVisible(false)}
        onApply={(job) => handle1ClickApply(job)}
      />
      <InterviewCoachModal visible={coachModalVisible} onClose={() => setCoachModalVisible(false)} />
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
    marginBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  autoSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    gap: 6,
  },
  autoSearchBtnText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  toolsDock: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  toolChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: Radii.md,
    gap: 5,
  },
  toolChipText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: Colors.cardSubtle,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  jobCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  jobRole: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 8,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
  },
  applyBtnText: {
    color: Colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  coverLetterBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  coverLetterBtnText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    gap: Spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: Radii.sm,
    backgroundColor: Colors.cardSubtle,
    gap: 4,
  },
  secondaryBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});
