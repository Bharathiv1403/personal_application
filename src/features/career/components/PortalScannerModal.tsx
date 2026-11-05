import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import {
  JobDiscoveryService,
  DiscoveredJobItem,
  RECOMMENDED_ATS_PORTALS,
  AtsCompanyPreset,
} from '@/core/utils/job-discovery-service';
import { JobLivenessService, LivenessResult } from '@/core/services/job-liveness-service';
import { useJobStore } from '../state/job-store';

export interface PortalScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectJobForAts?: (job: { role: string; companyName: string; jobDescription?: string }) => void;
  onSelectJobForStar?: (job: { role: string; companyName: string; jobDescription?: string }) => void;
}

const DEFAULT_POSITIVE_KEYWORDS = ['React', 'TypeScript', 'Frontend', 'Mobile', 'Full Stack', 'Engineer'];
const DEFAULT_NEGATIVE_KEYWORDS = ['Intern', 'PHP', 'WordPress', 'Director', 'Recruiter'];

export const PortalScannerModal: React.FC<PortalScannerModalProps> = ({
  visible,
  onClose,
  onSelectJobForAts,
  onSelectJobForStar,
}) => {
  const [companyQuery, setCompanyQuery] = useState('');
  const [selectedSeniority, setSelectedSeniority] = useState<'all' | 'entry' | 'mid' | 'senior' | 'lead'>('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [activePositiveKeywords, setActivePositiveKeywords] = useState<string[]>(['React', 'TypeScript']);
  const [activeNegativeKeywords, setActiveNegativeKeywords] = useState<string[]>(['Intern']);
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Results & Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedJobs, setScannedJobs] = useState<DiscoveredJobItem[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [livenessMap, setLivenessMap] = useState<Record<string, LivenessResult>>({});
  const [isCheckingLiveness, setIsCheckingLiveness] = useState<Record<string, boolean>>({});

  // Job store
  const addJob = useJobStore((s) => s.addJob);
  const existingJobs = useJobStore((s) => s.jobs);

  const handleScan = async (overrideCompany?: string) => {
    const target = (overrideCompany || companyQuery).trim();
    if (!target) {
      Alert.alert('Enter Company', 'Please enter a company name or choose one from the presets.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsScanning(true);
    setHasScanned(true);

    try {
      const results = await JobDiscoveryService.scanCompanyPortals(target, {
        positiveKeywords: activePositiveKeywords,
        negativeKeywords: activeNegativeKeywords,
        seniorityTier: selectedSeniority,
        workMode: selectedWorkMode,
      });

      setScannedJobs(results);
      Haptics.notificationAsync(
        results.length > 0
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    } catch {
      Alert.alert('Scan Failed', 'Could not fetch jobs from portal. Please check the company slug or try another.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectPreset = (preset: AtsCompanyPreset) => {
    setCompanyQuery(preset.slug);
    handleScan(preset.slug);
  };

  const togglePositiveKeyword = (kw: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (activePositiveKeywords.includes(kw)) {
      setActivePositiveKeywords((prev) => prev.filter((k) => k !== kw));
    } else {
      setActivePositiveKeywords((prev) => [...prev, kw]);
    }
  };

  const toggleNegativeKeyword = (kw: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (activeNegativeKeywords.includes(kw)) {
      setActiveNegativeKeywords((prev) => prev.filter((k) => k !== kw));
    } else {
      setActiveNegativeKeywords((prev) => [...prev, kw]);
    }
  };

  const handleAddCustomKeyword = () => {
    const kw = customKeywordInput.trim();
    if (!kw) return;
    if (!activePositiveKeywords.includes(kw)) {
      setActivePositiveKeywords((prev) => [...prev, kw]);
    }
    setCustomKeywordInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const isJobInPipeline = (job: DiscoveredJobItem) => {
    return existingJobs.some(
      (j) =>
        j.url === job.url ||
        (j.companyName.toLowerCase() === job.company.toLowerCase() &&
          j.role.toLowerCase() === job.title.toLowerCase())
    );
  };

  const handleAddJobToPipeline = (job: DiscoveredJobItem, stage: 'wishlist' | 'applied') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addJob({
      companyName: job.company,
      role: job.title,
      location: job.location,
      workMode: job.workplaceType === 'remote' ? 'Remote' : job.workplaceType === 'hybrid' ? 'Hybrid' : 'Onsite',
      ctcMin: 18,
      ctcMax: 35,
      stage,
      appliedDate: new Date().toISOString().split('T')[0],
      source: job.source,
      matchScore: job.matchScore,
      tags: job.tags,
      url: job.url,
      missingSkills: [],
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Added to Pipeline 🎯',
      `"${job.title}" at ${job.company} added to your ${stage.toUpperCase()} board!`
    );
  };

  const handleCheckLiveness = async (job: DiscoveredJobItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsCheckingLiveness((prev) => ({ ...prev, [job.id]: true }));

    try {
      const result = await JobLivenessService.verifyUrlLiveness(job.url);
      setLivenessMap((prev) => ({ ...prev, [job.id]: result }));
      Haptics.notificationAsync(
        result.isLive
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    } catch {
      setLivenessMap((prev) => ({
        ...prev,
        [job.id]: { isLive: false, statusText: 'Liveness check timed out', vendor: 'Direct' },
      }));
    } finally {
      setIsCheckingLiveness((prev) => ({ ...prev, [job.id]: false }));
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.atsBadge}>
                  <Ionicons name="flash" size={11} color="#38BDF8" />
                  <Text style={styles.atsBadgeText}>CAREER-OPS ZERO-TOKEN SCANNER</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>⚡ ATS Portal Scanner</Text>
              <Text style={styles.headerSubtitle}>
                Instant real-time crawler for Greenhouse, Lever & Ashby boards
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Search Input Row */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#38BDF8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter company (e.g. Figma, Stripe, Linear)..."
                  placeholderTextColor="#64748B"
                  value={companyQuery}
                  onChangeText={setCompanyQuery}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={() => handleScan()}
                />
                {companyQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCompanyQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.scanBtn, isScanning && { opacity: 0.7 }]}
                  onPress={() => handleScan()}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#030712" />
                  ) : (
                    <>
                      <Ionicons name="rocket-sharp" size={16} color="#030712" />
                      <Text style={styles.scanBtnText}>Scan Portal</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons
                    name={showFilters ? 'options' : 'options-outline'}
                    size={16}
                    color={showFilters ? '#38BDF8' : '#94A3B8'}
                  />
                  <Text style={[styles.filterToggleText, showFilters && { color: '#38BDF8' }]}>
                    Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Presets Horizontal Scroll */}
            <View style={styles.presetSection}>
              <Text style={styles.sectionLabel}>Popular ATS Portals:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsList}>
                {RECOMMENDED_ATS_PORTALS.map((preset) => {
                  const isSelected = companyQuery.toLowerCase() === preset.slug.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={preset.slug}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => handleSelectPreset(preset)}
                    >
                      <Text style={styles.presetLogo}>{preset.logo}</Text>
                      <Text style={[styles.presetName, isSelected && styles.presetNameActive]}>
                        {preset.name}
                      </Text>
                      <Text style={styles.presetAtsTag}>{preset.ats}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Collapsible Filters */}
            {showFilters && (
              <View style={styles.filtersContainer}>
                {/* Seniority */}
                <Text style={styles.filterSubLabel}>Seniority Tier:</Text>
                <View style={styles.chipRow}>
                  {(['all', 'entry', 'mid', 'senior', 'lead'] as const).map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      style={[styles.tierChip, selectedSeniority === tier && styles.tierChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedSeniority(tier);
                      }}
                    >
                      <Text style={[styles.tierChipText, selectedSeniority === tier && styles.tierChipTextActive]}>
                        {tier.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Work Mode */}
                <Text style={styles.filterSubLabel}>Work Mode:</Text>
                <View style={styles.chipRow}>
                  {(['all', 'remote', 'hybrid', 'onsite'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.tierChip, selectedWorkMode === mode && styles.tierChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedWorkMode(mode);
                      }}
                    >
                      <Text style={[styles.tierChipText, selectedWorkMode === mode && styles.tierChipTextActive]}>
                        {mode.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Positive Keywords */}
                <Text style={styles.filterSubLabel}>Must-Have Keywords (Positive):</Text>
                <View style={styles.chipRow}>
                  {DEFAULT_POSITIVE_KEYWORDS.map((kw) => {
                    const active = activePositiveKeywords.includes(kw);
                    return (
                      <TouchableOpacity
                        key={kw}
                        style={[styles.kwChip, active && styles.kwChipPositiveActive]}
                        onPress={() => togglePositiveKeyword(kw)}
                      >
                        <Text style={[styles.kwChipText, active && styles.kwChipTextActive]}>
                          {active ? '✓ ' : '+ '}
                          {kw}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Negative Keywords */}
                <Text style={styles.filterSubLabel}>Negative Keywords (Exclude / Discard):</Text>
                <View style={styles.chipRow}>
                  {DEFAULT_NEGATIVE_KEYWORDS.map((kw) => {
                    const active = activeNegativeKeywords.includes(kw);
                    return (
                      <TouchableOpacity
                        key={kw}
                        style={[styles.kwChip, active && styles.kwChipNegativeActive]}
                        onPress={() => toggleNegativeKeyword(kw)}
                      >
                        <Text style={[styles.kwChipText, active && { color: '#F87171' }]}>
                          {active ? '✕ ' : ''}
                          {kw}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Keyword Input */}
                <View style={styles.addKwRow}>
                  <TextInput
                    style={styles.addKwInput}
                    placeholder="Add custom keyword..."
                    placeholderTextColor="#64748B"
                    value={customKeywordInput}
                    onChangeText={setCustomKeywordInput}
                    onSubmitEditing={handleAddCustomKeyword}
                  />
                  <TouchableOpacity style={styles.addKwBtn} onPress={handleAddCustomKeyword}>
                    <Text style={styles.addKwBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Results Header */}
            {hasScanned && (
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.resultsTitle}>
                  {isScanning
                    ? 'Scanning ATS Boards...'
                    : `Found ${scannedJobs.length} roles at ${companyQuery || 'Company'}`}
                </Text>
                {scannedJobs.length > 0 && (
                  <View style={styles.sourceTag}>
                    <Text style={styles.sourceTagText}>{scannedJobs[0].source} Board</Text>
                  </View>
                )}
              </View>
            )}

            {/* Loading Indicator */}
            {isScanning && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.loadingText}>Fetching live openings directly from ATS API...</Text>
                <Text style={styles.loadingSubtext}>Zero-token • No scraping block • 100% verified</Text>
              </View>
            )}

            {/* Results List */}
            {!isScanning && hasScanned && scannedJobs.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="file-tray-outline" size={42} color="#64748B" />
                <Text style={styles.emptyTitle}>No Matching Roles Found</Text>
                <Text style={styles.emptyDesc}>
                  Try clearing positive/negative keywords, or choose a different company from the presets.
                </Text>
              </View>
            )}

            {!isScanning &&
              scannedJobs.map((job) => {
                const inPipeline = isJobInPipeline(job);
                const liveness = livenessMap[job.id];
                const checkingLiveness = isCheckingLiveness[job.id];

                return (
                  <View key={job.id} style={styles.jobCard}>
                    {/* Top Row */}
                    <View style={styles.jobCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.jobRole} numberOfLines={2}>
                          {job.title}
                        </Text>
                        <Text style={styles.jobCompany}>
                          {job.company} • {job.location}
                        </Text>
                      </View>
                      <View style={styles.matchScoreBadge}>
                        <Text style={styles.matchScoreText}>{job.matchScore}%</Text>
                        <Text style={styles.matchScoreSub}>FIT</Text>
                      </View>
                    </View>

                    {/* Meta Badges */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaBadge}>
                        <Ionicons name="business" size={11} color="#38BDF8" />
                        <Text style={styles.metaBadgeText}>{job.source}</Text>
                      </View>
                      {job.seniority && (
                        <View style={[styles.metaBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                          <Text style={[styles.metaBadgeText, { color: '#C084FC' }]}>
                            {job.seniority.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {job.workplaceType && (
                        <View style={[styles.metaBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                          <Text style={[styles.metaBadgeText, { color: '#34D399' }]}>
                            {job.workplaceType.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {job.salary && (
                        <View style={[styles.metaBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                          <Text style={[styles.metaBadgeText, { color: '#FBBF24' }]}>
                            {job.salary}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Liveness Result Display */}
                    {liveness && (
                      <View
                        style={[
                          styles.livenessResultRow,
                          liveness.isLive ? styles.livenessActive : styles.livenessExpired,
                        ]}
                      >
                        <Ionicons
                          name={liveness.isLive ? 'checkmark-circle' : 'alert-circle'}
                          size={14}
                          color={liveness.isLive ? '#4ADE80' : '#F87171'}
                        />
                        <Text
                          style={[
                            styles.livenessResultText,
                            { color: liveness.isLive ? '#4ADE80' : '#F87171' },
                          ]}
                        >
                          {liveness.statusText}
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      {/* Liveness Check */}
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => handleCheckLiveness(job)}
                        disabled={checkingLiveness}
                      >
                        {checkingLiveness ? (
                          <ActivityIndicator size="small" color="#38BDF8" />
                        ) : (
                          <>
                            <Ionicons name="flash-outline" size={13} color="#38BDF8" />
                            <Text style={styles.cardActionText}>Liveness</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* ATS 5.0 Scan */}
                      {onSelectJobForAts && (
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={() => {
                            onClose();
                            setTimeout(() => {
                              onSelectJobForAts({
                                role: job.title,
                                companyName: job.company,
                                jobDescription: `${job.title} at ${job.company} (${job.location})`,
                              });
                            }, 300);
                          }}
                        >
                          <Ionicons name="analytics-outline" size={13} color="#C084FC" />
                          <Text style={[styles.cardActionText, { color: '#C084FC' }]}>ATS 5.0</Text>
                        </TouchableOpacity>
                      )}

                      {/* STAR Prep */}
                      {onSelectJobForStar && (
                        <TouchableOpacity
                          style={styles.cardActionBtn}
                          onPress={() => {
                            onClose();
                            setTimeout(() => {
                              onSelectJobForStar({
                                role: job.title,
                                companyName: job.company,
                                jobDescription: `${job.title} at ${job.company}`,
                              });
                            }, 300);
                          }}
                        >
                          <Ionicons name="star-outline" size={13} color="#F59E0B" />
                          <Text style={[styles.cardActionText, { color: '#FBBF24' }]}>STAR</Text>
                        </TouchableOpacity>
                      )}

                      {/* Direct Link */}
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => handleOpenUrl(job.url)}
                      >
                        <Ionicons name="open-outline" size={13} color="#94A3B8" />
                        <Text style={styles.cardActionText}>Apply</Text>
                      </TouchableOpacity>

                      {/* Add to Pipeline */}
                      {inPipeline ? (
                        <View style={styles.inPipelineBadge}>
                          <Ionicons name="checkmark-done" size={13} color="#4ADE80" />
                          <Text style={styles.inPipelineText}>Tracked</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.trackJobBtn}
                          onPress={() => handleAddJobToPipeline(job, 'wishlist')}
                        >
                          <Ionicons name="bookmark-outline" size={13} color="#030712" />
                          <Text style={styles.trackJobText}>Track</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  atsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  atsBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchSection: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  scanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    height: 42,
  },
  scanBtnText: {
    color: '#030712',
    fontSize: 14,
    fontWeight: '800',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 14,
    height: 42,
  },
  filterToggleBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  filterToggleText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  presetSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsList: {
    gap: 8,
    paddingBottom: 4,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  presetChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  presetLogo: {
    fontSize: 14,
  },
  presetName: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  presetNameActive: {
    color: '#38BDF8',
  },
  presetAtsTag: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    padding: 14,
    marginBottom: 14,
  },
  filterSubLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tierChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tierChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  tierChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  tierChipTextActive: {
    color: '#38BDF8',
  },
  kwChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kwChipPositiveActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  kwChipNegativeActive: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  kwChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  kwChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  addKwRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addKwInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 10,
    height: 34,
    color: '#F8FAFC',
    fontSize: 12,
  },
  addKwBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  addKwBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultsTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  sourceTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceTagText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingSubtext: {
    color: '#64748B',
    fontSize: 11,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    padding: 14,
    marginBottom: 12,
  },
  jobCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  jobRole: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  jobCompany: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  matchScoreBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  matchScoreText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  matchScoreSub: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  livenessResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 4,
    marginBottom: 8,
  },
  livenessActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  livenessExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  livenessResultText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  cardActionText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  inPipelineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inPipelineText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
  },
  trackJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trackJobText: {
    color: '#030712',
    fontSize: 11,
    fontWeight: '800',
  },
});

