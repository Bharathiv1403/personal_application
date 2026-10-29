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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useJobStore, JobStage, JobApplicationItem, getJobPlatformSource } from '../state/job-store';
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
import { JobDetailModal } from '../components/JobDetailModal';
import { OutreachGeneratorModal, OutreachType } from '../components/OutreachGeneratorModal';
import { OfferNegotiatorModal } from '../components/OfferNegotiatorModal';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { AIService } from '@/core/utils/ai-service';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';

type NavTab = 'Jobs' | 'Tracker';

const PLATFORM_FILTERS = [
  { id: 'All', label: 'All Feeds', icon: 'apps-outline', color: '#94A3B8' },
  { id: 'LinkedIn', label: 'LinkedIn', icon: 'logo-linkedin', color: '#38BDF8' },
  { id: 'Naukri', label: 'Naukri', icon: 'briefcase', color: '#60A5FA' },
  { id: 'Indeed', label: 'Indeed', icon: 'search', color: '#818CF8' },
  { id: 'Foundit', label: 'Foundit', icon: 'flash', color: '#C084FC' },
  { id: 'Handshake', label: 'Handshake', icon: 'hand-right', color: '#FB923C' },
  { id: 'Company Site', label: 'Company Portal', icon: 'business', color: '#34D399' },
  { id: 'Remote Hub', label: 'Remote Hub', icon: 'globe-outline', color: '#22D3EE' },
];

export const CareerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Jobs');
  const [trackerStage, setTrackerStage] = useState<'All' | 'wishlist' | 'applied' | 'interview' | 'offer'>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const isAiConfigured = useAiConfigStore((s) => s.isConfigured);
  const hasKey = isAiConfigured || AIService.hasConfiguredKey();

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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobApplicationItem | null>(null);

  // New Modals: Outreach & Offer Negotiator
  const [outreachModalVisible, setOutreachModalVisible] = useState(false);
  const [selectedJobForOutreach, setSelectedJobForOutreach] = useState<JobApplicationItem | null>(null);
  const [outreachDefaultType, setOutreachDefaultType] = useState<OutreachType>('referral_request');
  const [offerNegotiatorVisible, setOfferNegotiatorVisible] = useState(false);

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

      if (selectedPlatform !== 'All') {
        const platform = getJobPlatformSource(j);
        if (platform.name !== selectedPlatform) return false;
      }

      if (activeTab === 'Tracker') {
        const matchesStage = trackerStage === 'All' ? true : j.stage === trackerStage;
        return matchesStage && matchesQuery;
      }

      return matchesQuery;
    });
  }, [jobs, activeTab, trackerStage, searchQuery, selectedPlatform]);

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

  const handleOpenJobDetail = (job: JobApplicationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedJobForDetail(job);
    setDetailModalVisible(true);
  };

  const handleOpenOutreach = (job: JobApplicationItem, type: OutreachType = 'referral_request') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedJobForOutreach(job);
    setOutreachDefaultType(type);
    setOutreachModalVisible(true);
  };

  const getApplicationAgeDays = (appliedDate?: string): number => {
    if (!appliedDate) return 0;
    const diff = Date.now() - new Date(appliedDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const handleExportPipelineCSV = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const headers = [
      'Company',
      'Role',
      'Stage',
      'Applied Date',
      'Location',
      'Work Mode',
      'CTC Min (LPA)',
      'CTC Max (LPA)',
      'ATS Match %',
      'Recruiter',
      'URL',
    ];
    const rows = jobs.map((j) => [
      `"${j.companyName}"`,
      `"${j.role}"`,
      `"${j.stage.toUpperCase()}"`,
      `"${j.appliedDate || ''}"`,
      `"${j.location}"`,
      `"${j.workMode}"`,
      j.ctcMin,
      j.ctcMax,
      j.matchScore || '',
      `"${j.recruiterName || ''}"`,
      `"${j.url || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    try {
      await Share.share({
        message: csvContent,
        title: 'CareerPilot_Pipeline_Export.csv',
      });
    } catch {
      Alert.alert('Export Failed', 'Unable to share CSV export.');
    }
  };

  const handleQuickStageChange = (job: JobApplicationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const stageOrder: { stage: JobStage; label: string }[] = [
      { stage: 'wishlist', label: 'Wishlist' },
      { stage: 'applied', label: 'Applied' },
      { stage: 'assessment', label: 'Assessment' },
      { stage: 'interview', label: 'Interview' },
      { stage: 'offer', label: 'Offer 🎉' },
      { stage: 'rejected', label: 'Rejected' },
    ];
    Alert.alert(
      'Move Application Stage',
      `Role: ${job.role} at ${job.companyName}\nCurrent Stage: ${job.stage.toUpperCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...stageOrder.map((st) => ({
          text: `${st.label} ${job.stage === st.stage ? '✓' : ''}`,
          onPress: () => {
            updateJobStage(job.id, st.stage);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        })),
      ]
    );
  };

  const handleDeleteJob = (job: JobApplicationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Delete Application',
      `Are you sure you want to delete "${job.role}" at ${job.companyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteJob(job.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
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
          <View style={styles.headerTitleWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.screenTitle} numberOfLines={1}>CareerPilot OS</Text>
              <Badge label="AUTO-APPLY READY" variant="primary" />
            </View>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              {profile.name} • {profile.targetRole}
            </Text>
          </View>

          <View style={styles.headerActionsWrap}>
            <TouchableOpacity
              style={styles.headerExportBtn}
              onPress={handleExportPipelineCSV}
            >
              <Ionicons name="download-outline" size={13} color="#38BDF8" />
              <Text style={styles.headerExportText}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerAiBtn}
              onPress={() => setCoachModalVisible(true)}
            >
              <Ionicons name="chatbubble-ellipses" size={14} color="#A855F7" />
              <Text style={styles.headerAiText}>AI Coach</Text>
            </TouchableOpacity>
          </View>
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
        {/* CAREER TOOL BELT (HORIZONTAL SCROLL) */}
        {/* ========================================================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.toolBeltScroll}
          contentContainerStyle={styles.toolBeltContent}
        >
          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAddJobModalVisible(true);
            }}
          >
            <Ionicons name="add-circle" size={15} color="#10B981" />
            <Text style={[styles.toolChipText, { color: '#10B981' }]}>+ Add Application</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolChip,
              hasKey
                ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }
                : { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setApiKeyModalVisible(true);
            }}
          >
            <Ionicons name="key" size={15} color={hasKey ? '#10B981' : '#F59E0B'} />
            <Text style={[styles.toolChipText, { color: hasKey ? '#10B981' : '#F59E0B' }]}>
              {hasKey ? 'AI Key 🟢' : 'Set AI Key 🔑'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              if (jobs.length > 0) {
                handleOpenOutreach(jobs[0], 'referral_request');
              } else {
                Alert.alert('No Jobs', 'Discover or add a job application first.');
              }
            }}
          >
            <Ionicons name="people" size={15} color="#38BDF8" />
            <Text style={[styles.toolChipText, { color: '#38BDF8' }]}>Referral & Outreach</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setOfferNegotiatorVisible(true);
            }}
          >
            <Ionicons name="scale" size={15} color="#F59E0B" />
            <Text style={[styles.toolChipText, { color: '#F59E0B' }]}>Offer Negotiator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(6, 182, 212, 0.15)', borderColor: '#06B6D4' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAtsModalVisible(true);
            }}
          >
            <Ionicons name="scan-outline" size={15} color="#06B6D4" />
            <Text style={[styles.toolChipText, { color: '#06B6D4' }]}>ATS Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setInHandModalVisible(true);
            }}
          >
            <Ionicons name="calculator-outline" size={15} color="#F59E0B" />
            <Text style={[styles.toolChipText, { color: '#F59E0B' }]}>In-Hand CTC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setCoachModalVisible(true);
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={15} color="#C084FC" />
            <Text style={[styles.toolChipText, { color: '#C084FC' }]}>AI Coach</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366F1' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setProfileModalVisible(true);
            }}
          >
            <Ionicons name="person" size={15} color="#818CF8" />
            <Text style={[styles.toolChipText, { color: '#818CF8' }]}>Profile & Resumes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setPreferencesModalVisible(true);
            }}
          >
            <Ionicons name="options" size={15} color="#38BDF8" />
            <Text style={[styles.toolChipText, { color: '#38BDF8' }]}>Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolChip, { backgroundColor: 'rgba(20, 184, 166, 0.15)', borderColor: '#14B8A6' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAnswerBankModalVisible(true);
            }}
          >
            <Ionicons name="bookmark" size={15} color="#2DD4BF" />
            <Text style={[styles.toolChipText, { color: '#2DD4BF' }]}>Answer Bank</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ========================================================= */}
        {/* NAVIGATION SEGMENTED TABS */}
        {/* ========================================================= */}
        <View style={styles.navTabRow}>
          <TouchableOpacity
            style={[styles.navTabChip, activeTab === 'Jobs' && styles.navTabChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('Jobs');
            }}
          >
            <Ionicons
              name="briefcase-outline"
              size={14}
              color={activeTab === 'Jobs' ? '#FFFFFF' : Colors.textMuted}
            />
            <Text style={[styles.navTabChipText, activeTab === 'Jobs' && styles.navTabChipTextActive]}>
              Discover Roles ({totalDiscovered})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabChip, activeTab === 'Tracker' && styles.navTabChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setActiveTab('Tracker');
            }}
          >
            <Ionicons
              name="funnel-outline"
              size={14}
              color={activeTab === 'Tracker' ? '#FFFFFF' : Colors.textMuted}
            />
            <Text style={[styles.navTabChipText, activeTab === 'Tracker' && styles.navTabChipTextActive]}>
              Pipeline Tracker ({appliedCount + interviewCount + offerCount})
            </Text>
          </TouchableOpacity>
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

        {/* Platform Source Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.platformFilterScroll}
          contentContainerStyle={styles.platformFilterContent}
        >
          {PLATFORM_FILTERS.map((p) => {
            const isActive = selectedPlatform === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.platformFilterChip,
                  isActive && styles.platformFilterChipActive,
                  isActive && p.color ? { borderColor: p.color, backgroundColor: p.color + '22' } : null,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedPlatform(p.id);
                }}
              >
                <Ionicons
                  name={p.icon as any}
                  size={12}
                  color={isActive ? (p.color || '#FFFFFF') : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.platformFilterChipText,
                    isActive && styles.platformFilterChipTextActive,
                    isActive && p.color ? { color: p.color } : null,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
              const platform = getJobPlatformSource(job);

              return (
                <TouchableOpacity
                  key={job.id}
                  activeOpacity={0.9}
                  onPress={() => handleOpenJobDetail(job)}
                  onLongPress={() => handleDeleteJob(job)}
                >
                  <GlassCard style={styles.jobCard} variant="elevated">
                    {/* Job Header */}
                    <View style={styles.jobCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobRole}>{job.role}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <Text style={styles.jobCompany}>{job.companyName}</Text>
                          <View style={[styles.platformBadge, { backgroundColor: platform.bg, borderColor: platform.color + '40' }]}>
                            <Ionicons name={platform.icon} size={11} color={platform.color} />
                            <Text style={[styles.platformBadgeText, { color: platform.color }]}>{platform.name}</Text>
                          </View>
                        </View>
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

                    {/* Upcoming Scheduled Interview Round Banner */}
                    {job.interviews && job.interviews.length > 0 && (
                      <View style={styles.interviewAlertPill}>
                        <Ionicons name="videocam" size={12} color="#C084FC" />
                        <Text style={styles.interviewAlertText} numberOfLines={1}>
                          {job.interviews[job.interviews.length - 1].roundName} • {job.interviews[job.interviews.length - 1].scheduledAt || 'Upcoming'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardDivider} />

                    {/* Bottom Actions */}
                    <View style={styles.jobCardBottom}>
                      <View style={styles.jobCardStageRow}>
                        <TouchableOpacity
                          style={styles.stagePickerTrigger}
                          onPress={() => handleQuickStageChange(job)}
                        >
                          <Badge label={job.stage.toUpperCase()} variant={getStageVariant(job.stage)} />
                          <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
                        </TouchableOpacity>
                        {job.appliedDate && (
                          <Text style={styles.appliedDateText}>Applied: {job.appliedDate}</Text>
                        )}
                        {/* Stale Application Follow-up Flag */}
                        {job.stage === 'applied' && (() => {
                          const age = getApplicationAgeDays(job.appliedDate);
                          if (age >= 5 && age < 14) {
                            return (
                              <TouchableOpacity
                                style={styles.followUpBadgeBtn}
                                onPress={() => handleOpenOutreach(job, 'follow_up_checkin')}
                              >
                                <Ionicons name="time-outline" size={11} color="#F59E0B" />
                                <Text style={styles.followUpBadgeText}>Follow-up Due ({age}d) ⏳</Text>
                              </TouchableOpacity>
                            );
                          }
                          if (age >= 14) {
                            return (
                              <View style={styles.staleBadge}>
                                <Text style={styles.staleBadgeText}>Stale ({age}d+)</Text>
                              </View>
                            );
                          }
                          return null;
                        })()}
                      </View>

                      <View style={styles.cardActionGroup}>
                        <TouchableOpacity
                          style={styles.pitchBtn}
                          onPress={() => handleOpenOutreach(job, 'referral_request')}
                        >
                          <Ionicons name="people-outline" size={13} color="#38BDF8" />
                          <Text style={styles.pitchBtnText}>Pitch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.letterBtn}
                          onPress={() => handleOpenCoverLetter(job)}
                        >
                          <Ionicons name="document-text-outline" size={13} color="#F59E0B" />
                          <Text style={styles.letterBtnText}>Letter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.applyBtn, isApplied && styles.applyBtnDisabled]}
                          onPress={() => handleOpenAutoApply(job)}
                        >
                          <Ionicons
                            name={isApplied ? 'checkmark-circle' : 'rocket'}
                            size={13}
                            color="#FFFFFF"
                          />
                          <Text style={styles.applyBtnText}>
                            {isApplied ? 'Re-Apply' : 'Auto-Apply'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
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
      <JobDetailModal
        visible={detailModalVisible}
        job={selectedJobForDetail}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedJobForDetail(null);
        }}
        onOpenCoverLetter={handleOpenCoverLetter}
        onOpenAutoApply={handleOpenAutoApply}
        onOpenOutreach={(j, type) => handleOpenOutreach(j, type)}
      />
      <OutreachGeneratorModal
        visible={outreachModalVisible}
        job={selectedJobForOutreach}
        defaultType={outreachDefaultType}
        onClose={() => {
          setOutreachModalVisible(false);
          setSelectedJobForOutreach(null);
        }}
      />
      <OfferNegotiatorModal
        visible={offerNegotiatorVisible}
        onClose={() => setOfferNegotiatorVisible(false)}
      />
      <ApiKeyModal
        visible={apiKeyModalVisible}
        onClose={() => setApiKeyModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 160,
    marginRight: 6,
  },
  headerActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
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

  // Career Tool Belt
  toolBeltScroll: {
    marginBottom: Spacing.md,
  },
  toolBeltContent: {
    paddingRight: Spacing.md,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: 8,
  },
  toolChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Nav Tabs
  navTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 6,
  },
  navTabChip: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  navTabChipActive: {
    backgroundColor: Colors.primary,
  },
  navTabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  navTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stagePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  interviewAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  interviewAlertText: {
    fontSize: 11,
    color: '#C084FC',
    fontWeight: '600',
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
    gap: 8,
    marginTop: 4,
  },
  jobCardStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  appliedDateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  cardActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  letterBtn: {
    flex: 1,
    minWidth: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: Radii.md,
    gap: 4,
  },
  letterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  applyBtn: {
    flex: 1.2,
    minWidth: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radii.md,
    gap: 4,
  },
  applyBtnDisabled: {
    backgroundColor: '#059669',
  },
  applyBtnText: {
    fontSize: 11,
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
  headerExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 4,
  },
  headerExportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  pitchBtn: {
    flex: 1,
    minWidth: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: Radii.md,
    gap: 4,
  },
  pitchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  followUpBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  followUpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  staleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  staleBadgeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    borderWidth: 1,
    gap: 3,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  platformFilterScroll: {
    marginBottom: Spacing.sm,
  },
  platformFilterContent: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  platformFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 5,
  },
  platformFilterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: '#FFFFFF',
  },
  platformFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  platformFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
