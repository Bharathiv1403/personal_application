import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useCandidateProfileStore, EducationRecord, WorkExperienceRecord } from '../state/candidate-profile-store';
import { Badge } from '@/core/design-system/primitives/Badge';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type ActiveSection = 'Personal' | 'Education' | 'Experience' | 'Resumes';

export const CareerProfileModal: React.FC<Props> = ({ visible, onClose }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('Personal');

  const profile = useCandidateProfileStore();
  const updatePersonalInfo = useCandidateProfileStore((s) => s.updatePersonalInfo);
  const addEducation = useCandidateProfileStore((s) => s.addEducation);
  const deleteEducation = useCandidateProfileStore((s) => s.deleteEducation);
  const addExperience = useCandidateProfileStore((s) => s.addExperience);
  const deleteExperience = useCandidateProfileStore((s) => s.deleteExperience);
  const pickAndUploadResume = useCandidateProfileStore((s) => s.pickAndUploadResume);
  const setDefaultResume = useCandidateProfileStore((s) => s.setDefaultResume);
  const deleteResumeItem = useCandidateProfileStore((s) => s.deleteResumeItem);

  // Form states
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [currentCity, setCurrentCity] = useState(profile.currentCity);
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl);
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl);

  const prevVisibleRef = React.useRef(false);

  React.useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
      setCurrentCity(profile.currentCity);
      setLinkedinUrl(profile.linkedinUrl);
      setGithubUrl(profile.githubUrl);
      setPortfolioUrl(profile.portfolioUrl);
    }
    prevVisibleRef.current = visible;
  }, [visible, profile]);

  // New Education state
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [eduDegree, setEduDegree] = useState('');
  const [eduCollege, setEduCollege] = useState('');
  const [eduGradYear, setEduGradYear] = useState('');
  const [eduGrade, setEduGrade] = useState('');

  // New Experience state
  const [showAddExp, setShowAddExp] = useState(false);
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('Present');
  const [expWorkMode, setExpWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');

  const handleSavePersonal = () => {
    updatePersonalInfo({
      name,
      email,
      phone,
      currentCity,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('Saved ✅', 'Personal information updated successfully.');
  };

  const handleCreateEdu = () => {
    if (!eduDegree.trim() || !eduCollege.trim()) {
      Alert.alert('Required Fields', 'Please enter Degree and College name.');
      return;
    }
    addEducation({
      qualification: 'Degree',
      degree: eduDegree.trim(),
      college: eduCollege.trim(),
      startYear: '2020',
      graduationYear: eduGradYear.trim() || '2024',
      grade: eduGrade.trim() || 'First Class',
      status: 'Completed',
    });
    setShowAddEdu(false);
    setEduDegree('');
    setEduCollege('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleCreateExp = () => {
    if (!expCompany.trim() || !expRole.trim()) {
      Alert.alert('Required Fields', 'Please enter Company and Role name.');
      return;
    }
    addExperience({
      companyName: expCompany.trim(),
      jobTitle: expRole.trim(),
      employmentType: 'Full-time',
      startDate: expStart.trim() || '2024',
      endDate: expEnd.trim() || 'Present',
      isCurrentJob: expEnd.toLowerCase().includes('present'),
      workLocation: currentCity || 'Chennai',
      workMode: expWorkMode,
      responsibilities: 'Core engineering and software development.',
      skillsUsed: ['React', 'TypeScript', 'JavaScript'],
      noticePeriod: '30 Days',
    });
    setShowAddExp(false);
    setExpCompany('');
    setExpRole('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleUploadResume = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const success = await pickAndUploadResume();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Resume Uploaded! 📄', 'Added new resume version to your candidate vault.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Master Career Profile</Text>
              <Text style={styles.modalSubtitle}>Reusable resume & candidate application data</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section Navigation */}
          <View style={styles.sectionTabRow}>
            {(['Personal', 'Education', 'Experience', 'Resumes'] as ActiveSection[]).map((sec) => {
              const isSelected = activeSection === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.sectionTab, isSelected && styles.sectionTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setActiveSection(sec);
                  }}
                >
                  <Text style={[styles.sectionTabText, isSelected && styles.sectionTabTextActive]}>
                    {sec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 1. PERSONAL INFORMATION */}
            {activeSection === 'Personal' && (
              <View style={styles.sectionBody}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput style={styles.textInput} value={name} onChangeText={setName} />

                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput style={styles.textInput} value={email} onChangeText={setEmail} keyboardType="email-address" />

                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <TextInput style={styles.textInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                <Text style={styles.fieldLabel}>Current City</Text>
                <TextInput style={styles.textInput} value={currentCity} onChangeText={setCurrentCity} />

                <Text style={styles.fieldLabel}>LinkedIn URL</Text>
                <TextInput style={styles.textInput} value={linkedinUrl} onChangeText={setLinkedinUrl} />

                <Text style={styles.fieldLabel}>GitHub URL</Text>
                <TextInput style={styles.textInput} value={githubUrl} onChangeText={setGithubUrl} />

                <Text style={styles.fieldLabel}>Portfolio Website</Text>
                <TextInput style={styles.textInput} value={portfolioUrl} onChangeText={setPortfolioUrl} />

                <TouchableOpacity style={styles.saveBtn} onPress={handleSavePersonal}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Personal Details</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. EDUCATION */}
            {activeSection === 'Education' && (
              <View style={styles.sectionBody}>
                <View style={styles.subHeaderRow}>
                  <Text style={styles.subTitle}>Degrees & Qualifications</Text>
                  <TouchableOpacity
                    style={styles.addSmallBtn}
                    onPress={() => setShowAddEdu(!showAddEdu)}
                  >
                    <Ionicons name={showAddEdu ? 'close' : 'add'} size={15} color="#FFFFFF" />
                    <Text style={styles.addSmallBtnText}>{showAddEdu ? 'Cancel' : '+ Add'}</Text>
                  </TouchableOpacity>
                </View>

                {showAddEdu && (
                  <View style={styles.inlineForm}>
                    <Text style={styles.fieldLabel}>Degree / Qualification *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. MCA or B.Tech CSE"
                      placeholderTextColor={Colors.textMuted}
                      value={eduDegree}
                      onChangeText={setEduDegree}
                    />

                    <Text style={styles.fieldLabel}>College / University *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. University of Madras"
                      placeholderTextColor={Colors.textMuted}
                      value={eduCollege}
                      onChangeText={setEduCollege}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Grad Year</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="2024"
                          placeholderTextColor={Colors.textMuted}
                          value={eduGradYear}
                          onChangeText={setEduGradYear}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>CGPA / Grade</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="8.4 CGPA"
                          placeholderTextColor={Colors.textMuted}
                          value={eduGrade}
                          onChangeText={setEduGrade}
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleCreateEdu}>
                      <Text style={styles.inlineSaveText}>Save Education</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {profile.educations.length === 0 && !showAddEdu && (
                  <View style={styles.emptyCardBox}>
                    <Text style={styles.emptyCardText}>No education added yet.</Text>
                    <Text style={styles.emptyCardSub}>Tap "+ Add" above to record your degree or college.</Text>
                  </View>
                )}

                {profile.educations.map((edu) => (
                  <View key={edu.id} style={styles.cardItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{edu.degree}</Text>
                      <Text style={styles.cardSub}>{edu.college}</Text>
                      <Text style={styles.cardMeta}>{edu.graduationYear} • {edu.grade}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteEducation(edu.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* 3. WORK EXPERIENCE */}
            {activeSection === 'Experience' && (
              <View style={styles.sectionBody}>
                <View style={styles.subHeaderRow}>
                  <Text style={styles.subTitle}>Employment History</Text>
                  <TouchableOpacity
                    style={styles.addSmallBtn}
                    onPress={() => setShowAddExp(!showAddExp)}
                  >
                    <Ionicons name={showAddExp ? 'close' : 'add'} size={15} color="#FFFFFF" />
                    <Text style={styles.addSmallBtnText}>{showAddExp ? 'Cancel' : '+ Add'}</Text>
                  </TouchableOpacity>
                </View>

                {showAddExp && (
                  <View style={styles.inlineForm}>
                    <Text style={styles.fieldLabel}>Company Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Acme Corp or Infosys"
                      placeholderTextColor={Colors.textMuted}
                      value={expCompany}
                      onChangeText={setExpCompany}
                    />

                    <Text style={styles.fieldLabel}>Job Title / Role *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Frontend Team Lead"
                      placeholderTextColor={Colors.textMuted}
                      value={expRole}
                      onChangeText={setExpRole}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Start Period</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Aug 2024"
                          placeholderTextColor={Colors.textMuted}
                          value={expStart}
                          onChangeText={setExpStart}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>End Period</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Present"
                          placeholderTextColor={Colors.textMuted}
                          value={expEnd}
                          onChangeText={setExpEnd}
                        />
                      </View>
                    </View>

                    <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleCreateExp}>
                      <Text style={styles.inlineSaveText}>Save Experience</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {profile.experiences.length === 0 && !showAddExp && (
                  <View style={styles.emptyCardBox}>
                    <Text style={styles.emptyCardText}>No work experience added yet.</Text>
                    <Text style={styles.emptyCardSub}>Tap "+ Add" above to record your past or current roles.</Text>
                  </View>
                )}

                {profile.experiences.map((exp) => (
                  <View key={exp.id} style={styles.cardItem}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cardTitle}>{exp.jobTitle}</Text>
                        {exp.isCurrentJob && <Badge label="Current" variant="primary" />}
                      </View>
                      <Text style={styles.cardSub}>{exp.companyName} ({exp.workMode})</Text>
                      <Text style={styles.cardMeta}>{exp.startDate} – {exp.endDate} • {exp.workLocation}</Text>
                      {exp.skillsUsed && (
                        <Text style={styles.cardSkills}>Skills: {exp.skillsUsed.join(', ')}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteExperience(exp.id)}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* 4. MULTIPLE RESUMES */}
            {activeSection === 'Resumes' && (
              <View style={styles.sectionBody}>
                <View style={styles.subHeaderRow}>
                  <Text style={styles.subTitle}>Uploaded Resume Versions</Text>
                  <TouchableOpacity style={styles.addSmallBtn} onPress={handleUploadResume}>
                    <Ionicons name="cloud-upload" size={14} color="#FFFFFF" />
                    <Text style={styles.addSmallBtnText}>+ Upload PDF</Text>
                  </TouchableOpacity>
                </View>

                {profile.resumes.length === 0 && (
                  <View style={styles.emptyCardBox}>
                    <Text style={styles.emptyCardText}>No resume PDF attached yet.</Text>
                    <Text style={styles.emptyCardSub}>Tap "+ Upload PDF" above to attach your resume file.</Text>
                  </View>
                )}

                {profile.resumes.map((res) => (
                  <View key={res.id} style={styles.cardItem}>
                    <View style={styles.resumeIconBox}>
                      <Ionicons name="document-text" size={24} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{res.name}</Text>
                        {res.isDefault && <Badge label="Default" variant="gold" />}
                      </View>
                      <Text style={styles.cardSub}>{res.fileName}</Text>
                      <Text style={styles.cardMeta}>
                        Uploaded: {res.uploadedAt} {res.fileSize ? `• ${(res.fileSize / 1024).toFixed(0)} KB` : ''}
                      </Text>

                      {!res.isDefault && (
                        <TouchableOpacity
                          style={styles.makeDefaultBtn}
                          onPress={() => setDefaultResume(res.id)}
                        >
                          <Text style={styles.makeDefaultText}>Set as Default Resume</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {profile.resumes.length > 1 && (
                      <TouchableOpacity
                        onPress={() => deleteResumeItem(res.id)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
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
  modalContainer: {
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  sectionTabActive: {
    backgroundColor: Colors.primary,
  },
  sectionTabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sectionTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  sectionBody: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.lg,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    gap: 4,
  },
  addSmallBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inlineForm: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  inlineSaveBtn: {
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    marginTop: 10,
  },
  inlineSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8,
    gap: 10,
  },
  resumeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardSkills: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 6,
  },
  makeDefaultBtn: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  makeDefaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyCardBox: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  emptyCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
