import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { useJobStore, JobApplicationItem, JobStage, InterviewRoundItem, getJobPlatformSource } from '../state/job-store';

interface Props {
  visible: boolean;
  job: JobApplicationItem | null;
  onClose: () => void;
  onOpenCoverLetter: (job: JobApplicationItem) => void;
  onOpenAutoApply: (job: JobApplicationItem) => void;
  onOpenOutreach?: (
    job: JobApplicationItem,
    defaultType?: 'linkedin_connect' | 'referral_request' | 'recruiter_inmail' | 'follow_up_checkin'
  ) => void;
}

const STAGES: { stage: JobStage; label: string; icon: any; color: string }[] = [
  { stage: 'wishlist', label: 'Wishlist', icon: 'bookmark-outline', color: '#94A3B8' },
  { stage: 'applied', label: 'Applied', icon: 'paper-plane-outline', color: '#38BDF8' },
  { stage: 'assessment', label: 'Assessment', icon: 'code-slash-outline', color: '#F59E0B' },
  { stage: 'interview', label: 'Interview', icon: 'videocam-outline', color: '#A855F7' },
  { stage: 'offer', label: 'Offer 🎉', icon: 'trophy-outline', color: '#4ADE80' },
  { stage: 'rejected', label: 'Rejected', icon: 'close-circle-outline', color: '#EF4444' },
];

export const JobDetailModal: React.FC<Props> = ({
  visible,
  job,
  onClose,
  onOpenCoverLetter,
  onOpenAutoApply,
  onOpenOutreach,
}) => {
  if (!job) return null;

  const updateJobStage = useJobStore((s) => s.updateJobStage);
  const addInterviewRound = useJobStore((s) => s.addInterviewRound);
  const deleteJob = useJobStore((s) => s.deleteJob);

  // Scheduling round state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [notes, setNotes] = useState('');

  const currentStageInfo = STAGES.find((s) => s.stage === job.stage) || STAGES[0];
  const platform = getJobPlatformSource(job);

  const handleStageChange = (newStage: JobStage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    updateJobStage(job.id, newStage);
  };

  const handleScheduleRound = () => {
    if (!roundName.trim()) {
      Alert.alert('Required Field', 'Please enter a round name (e.g. Technical Round 1).');
      return;
    }

    const scheduledAt = `${scheduledDate.trim() || 'Upcoming'} ${scheduledTime.trim()}`.trim();

    addInterviewRound(job.id, {
      roundName: roundName.trim(),
      scheduledAt,
      meetLink: meetLink.trim() || undefined,
      interviewer: interviewer.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShowScheduleForm(false);
    setRoundName('');
    setScheduledDate('');
    setScheduledTime('');
    setMeetLink('');
    setInterviewer('');
    setNotes('');

    // If job was not in interview stage, promote to interview
    if (job.stage !== 'interview' && job.stage !== 'offer') {
      updateJobStage(job.id, 'interview');
    }
  };

  const handleOpenMeetLink = (url?: string) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch(() => {
      Alert.alert('Invalid Link', 'Could not open meeting link.');
    });
  };

  const handleCallRecruiter = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Unable to Call', 'Cannot launch phone dialer.');
    });
  };

  const handleEmailRecruiter = (email?: string) => {
    if (!email) return;
    Linking.openURL(
      `mailto:${email}?subject=Regarding Application for ${job.role} at ${job.companyName}`
    ).catch(() => {
      Alert.alert('Unable to Mail', 'Cannot launch email app.');
    });
  };

  const handleWhatsAppRecruiter = (phone?: string) => {
    if (!phone) return;
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi, I am following up regarding my application for the ${job.role} position at ${job.companyName}. Looking forward to connecting!`
    );
    Linking.openURL(`https://wa.me/${cleanNumber}?text=${message}`).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp.');
    });
  };

  const handleDelete = () => {
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
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Top Bar */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.companyName}>{job.companyName}</Text>
                <View style={[styles.platformPill, { backgroundColor: platform.bg, borderColor: platform.color + '40' }]}>
                  <Ionicons name={platform.icon} size={11} color={platform.color} />
                  <Text style={[styles.platformPillText, { color: platform.color }]}>{platform.name}</Text>
                </View>
              </View>
              <Text style={styles.roleTitle}>{job.role}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Quick Metrics Bar */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricItem, { backgroundColor: platform.bg, borderColor: platform.color + '30', borderWidth: 1 }]}>
                <Ionicons name={platform.icon} size={13} color={platform.color} />
                <Text style={[styles.metricText, { color: platform.color, fontWeight: '700' }]}>{platform.name}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metricText}>{job.location}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="globe-outline" size={14} color="#38BDF8" />
                <Text style={[styles.metricText, { color: '#38BDF8' }]}>{job.workMode}</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="cash-outline" size={14} color="#4ADE80" />
                <Text style={[styles.metricText, { color: '#4ADE80' }]}>
                  ₹{job.ctcMin} – {job.ctcMax} LPA
                </Text>
              </View>
              {job.matchScore ? (
                <View style={styles.metricItem}>
                  <Ionicons name="sparkles" size={14} color="#F59E0B" />
                  <Text style={[styles.metricText, { color: '#F59E0B' }]}>
                    {job.matchScore}% Match
                  </Text>
                </View>
              ) : null}
            </View>

            {/* STAGE SELECTOR PIPELINE */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>Application Pipeline Stage</Text>
              <Text style={styles.sectionHeaderSub}>
                Tap to move this role to your current hiring progress:
              </Text>
              <View style={styles.stageGrid}>
                {STAGES.map((st) => {
                  const isCurrent = job.stage === st.stage;
                  return (
                    <TouchableOpacity
                      key={st.stage}
                      style={[
                        styles.stageBtn,
                        isCurrent && {
                          backgroundColor: st.color + '25',
                          borderColor: st.color,
                        },
                      ]}
                      onPress={() => handleStageChange(st.stage)}
                    >
                      <Ionicons
                        name={st.icon}
                        size={14}
                        color={isCurrent ? st.color : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.stageBtnText,
                          isCurrent && { color: st.color, fontWeight: '700' },
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* RECRUITER CONTACT CARD */}
            {(job.recruiterName || job.recruiterPhone || job.recruiterEmail) ? (
              <View style={styles.sectionCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionHeaderTitle}>Recruiter / HR Contact</Text>
                  <Badge label="Direct Reachout" variant="cyan" />
                </View>

                {job.recruiterName && (
                  <Text style={styles.recruiterName}>{job.recruiterName}</Text>
                )}

                <View style={styles.recruiterActionRow}>
                  {job.recruiterPhone && (
                    <>
                      <TouchableOpacity
                        style={styles.recruiterBtn}
                        onPress={() => handleCallRecruiter(job.recruiterPhone)}
                      >
                        <Ionicons name="call" size={14} color="#4ADE80" />
                        <Text style={styles.recruiterBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.recruiterBtn}
                        onPress={() => handleWhatsAppRecruiter(job.recruiterPhone)}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                        <Text style={styles.recruiterBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {job.recruiterEmail && (
                    <TouchableOpacity
                      style={styles.recruiterBtn}
                      onPress={() => handleEmailRecruiter(job.recruiterEmail)}
                    >
                      <Ionicons name="mail" size={14} color="#38BDF8" />
                      <Text style={styles.recruiterBtnText}>Email</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}

            {/* INTERVIEW ROUNDS SECTION */}
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.sectionHeaderTitle}>Interview Schedule</Text>
                  <Text style={styles.sectionHeaderSub}>
                    {job.interviews.length === 0
                      ? 'No interview rounds scheduled yet'
                      : `${job.interviews.length} Round(s) Recorded`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.scheduleToggleBtn}
                  onPress={() => setShowScheduleForm(!showScheduleForm)}
                >
                  <Ionicons
                    name={showScheduleForm ? 'chevron-up' : 'add'}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.scheduleToggleBtnText}>
                    {showScheduleForm ? 'Hide Form' : '+ Schedule'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Schedule New Round Form */}
              {showScheduleForm && (
                <View style={styles.scheduleForm}>
                  <Text style={styles.formInputLabel}>Round Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Technical Round 1 / System Design"
                    placeholderTextColor={Colors.textMuted}
                    value={roundName}
                    onChangeText={setRoundName}
                  />

                  <View style={styles.twoCol}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formInputLabel}>Date</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD or Tomorrow"
                        placeholderTextColor={Colors.textMuted}
                        value={scheduledDate}
                        onChangeText={setScheduledDate}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formInputLabel}>Time</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 3:00 PM"
                        placeholderTextColor={Colors.textMuted}
                        value={scheduledTime}
                        onChangeText={setScheduledTime}
                      />
                    </View>
                  </View>

                  <Text style={styles.formInputLabel}>Meeting Link (Google Meet / Zoom)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://meet.google.com/xyz-abc"
                    placeholderTextColor={Colors.textMuted}
                    value={meetLink}
                    onChangeText={setMeetLink}
                    autoCapitalize="none"
                  />

                  <Text style={styles.formInputLabel}>Interviewer & Topics</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Lead Architect - React Native & Node.js"
                    placeholderTextColor={Colors.textMuted}
                    value={interviewer}
                    onChangeText={setInterviewer}
                  />

                  <TouchableOpacity style={styles.saveRoundBtn} onPress={handleScheduleRound}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.saveRoundBtnText}>Save Interview Round</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Scheduled Rounds List */}
              {job.interviews.map((round) => (
                <View key={round.id} style={styles.roundCard}>
                  <View style={styles.roundHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roundNameText}>{round.roundName}</Text>
                      <Text style={styles.roundTimeText}>
                        🗓️ {round.scheduledAt || 'Time not set'}
                      </Text>
                    </View>
                    {round.meetLink && (
                      <TouchableOpacity
                        style={styles.joinMeetBtn}
                        onPress={() => handleOpenMeetLink(round.meetLink)}
                      >
                        <Ionicons name="videocam" size={14} color="#FFFFFF" />
                        <Text style={styles.joinMeetBtnText}>Join Meet</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {round.interviewer && (
                    <Text style={styles.roundMetaText}>👤 {round.interviewer}</Text>
                  )}
                  {round.notes && (
                    <Text style={styles.roundNotesText}>📝 {round.notes}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* JOB DESCRIPTION SECTION */}
            {job.jobDescription && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeaderTitle}>Job Description & Requirements</Text>
                <Text style={styles.jdBodyText}>{job.jobDescription}</Text>
              </View>
            )}

            {/* SKILLS TAGS */}
            {job.tags && job.tags.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeaderTitle}>Required Skills</Text>
                <View style={styles.tagsWrap}>
                  {job.tags.map((t, idx) => (
                    <View key={idx} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* LINKEDIN REFERRAL & OUTREACH BAR */}
            <TouchableOpacity
              style={styles.outreachTriggerBtn}
              onPress={() => {
                onClose();
                onOpenOutreach?.(job, 'referral_request');
              }}
            >
              <Ionicons name="people" size={16} color="#38BDF8" />
              <Text style={styles.outreachTriggerText}>Generate LinkedIn Referral / Outreach Pitch</Text>
            </TouchableOpacity>

            {/* ACTION BUTTONS */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.letterBtn}
                onPress={() => {
                  onClose();
                  onOpenCoverLetter(job);
                }}
              >
                <Ionicons name="document-text-outline" size={16} color="#F59E0B" />
                <Text style={styles.letterBtnText}>AI Cover Letter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: platform.color }]}
                onPress={() => {
                  onClose();
                  onOpenAutoApply(job);
                }}
              >
                <Ionicons name="rocket" size={16} color="#FFFFFF" />
                <Text style={styles.applyBtnText}>
                  {job.stage === 'applied' ? `Re-Apply on ${platform.name}` : `Apply on ${platform.name} 🚀`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* DELETE APPLICATION */}
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Delete This Application</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  companyName: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    borderWidth: 1,
    gap: 4,
  },
  platformPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrollBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stageBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recruiterName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 6,
    marginBottom: 8,
  },
  recruiterActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  recruiterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recruiterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  scheduleToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scheduleForm: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.md,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  formInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  saveRoundBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.sm,
    gap: 6,
    marginTop: 12,
  },
  saveRoundBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  roundCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginTop: 8,
  },
  roundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roundTimeText: {
    fontSize: 12,
    color: '#C084FC',
    marginTop: 2,
    fontWeight: '600',
  },
  joinMeetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
  },
  joinMeetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roundMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  roundNotesText: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 4,
    fontStyle: 'italic',
  },
  jdBodyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  tagPillText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  letterBtn: {
    flex: 1,
    minWidth: 135,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Radii.md,
  },
  letterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  applyBtn: {
    flex: 1.2,
    minWidth: 155,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  outreachTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: Spacing.md,
  },
  outreachTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
