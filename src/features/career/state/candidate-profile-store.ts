import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

// ==========================================
// Career Profile Types
// ==========================================

export interface EducationRecord {
  id: string;
  qualification: string; // e.g. "MCA", "B.Sc"
  degree: string; // e.g. "Master of Computer Applications"
  college: string;
  specialization?: string;
  startYear: string;
  graduationYear: string;
  grade: string; // e.g. "8.2 CGPA"
  status: 'Completed' | 'Pursuing';
}

export interface WorkExperienceRecord {
  id: string;
  companyName: string;
  jobTitle: string;
  employmentType: 'Full-time' | 'Contract' | 'Freelance' | 'Internship';
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  workLocation: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  responsibilities: string;
  skillsUsed: string[];
  noticePeriod?: string;
  currentCTC?: string;
  expectedCTC?: string;
}

export interface SkillRecord {
  id: string;
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  yearsOfExperience: string;
}

export interface ResumeItem {
  id: string;
  name: string;
  targetRole: string;
  fileName: string;
  uri?: string | null;
  fileSize?: number | null;
  uploadedAt: string;
  isDefault: boolean;
}

export interface JobPreferences {
  targetJobTitles: string[];
  targetKeywords: string[];
  preferredLocations: string[];
  workModes: ('Remote' | 'Hybrid' | 'On-site')[];
  totalExperience: string;
  minimumSalaryLPA: number;
  maximumSalaryLPA: number;
  skillsMatchThreshold: number; // e.g. 75%
  autoApplyEnabled: boolean;
  dailyApplicationLimit: number;
}

export interface AnswerBankItem {
  id: string;
  question: string;
  answer: string;
  category: 'Authorization' | 'Salary' | 'Notice Period' | 'Technical' | 'General';
  isVerified: boolean;
}

export interface CandidateProfileState {
  // Personal Info
  name: string;
  email: string;
  phone: string;
  currentCity: string;
  state: string;
  country: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  workAuthorization: string;

  // Collections
  educations: EducationRecord[];
  experiences: WorkExperienceRecord[];
  skillsList: SkillRecord[];
  resumes: ResumeItem[];
  preferences: JobPreferences;
  answerBank: AnswerBankItem[];

  // Legacy compatibility fields
  targetRole: string;
  yearsOfExperience: string;
  noticePeriod: string;
  expectedCTC: string;
  skills: string[];
  resumeFileName: string | null;
  resumeUri: string | null;
  resumeFileSize: number | null;
  resumeUploadedAt: string | null;

  // Actions
  updatePersonalInfo: (fields: Partial<CandidateProfileState>) => void;
  updatePreferences: (prefs: Partial<JobPreferences>) => void;
  
  // Education Actions
  addEducation: (edu: Omit<EducationRecord, 'id'>) => void;
  deleteEducation: (id: string) => void;

  // Experience Actions
  addExperience: (exp: Omit<WorkExperienceRecord, 'id'>) => void;
  deleteExperience: (id: string) => void;

  // Resume Actions
  addResumeItem: (resume: Omit<ResumeItem, 'id'>) => void;
  setDefaultResume: (id: string) => void;
  deleteResumeItem: (id: string) => void;
  pickAndUploadResume: () => Promise<boolean>;

  // Answer Bank Actions
  updateAnswer: (id: string, newAnswer: string) => void;
  addAnswer: (item: Omit<AnswerBankItem, 'id' | 'isVerified'>) => void;

  // Legacy skill actions
  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  removeResume: () => void;
  updateProfile: (fields: Partial<CandidateProfileState>) => void;
  syncWithAuthUser: (name: string, email: string) => void;
  resetProfile: () => void;
}

// ==========================================
// Initial Clean Defaults for Multi-User Play Store Release
// ==========================================

const INITIAL_EDUCATIONS: EducationRecord[] = [];
const INITIAL_EXPERIENCES: WorkExperienceRecord[] = [];
const INITIAL_RESUMES: ResumeItem[] = [];

const INITIAL_PREFERENCES: JobPreferences = {
  targetJobTitles: [
    'Software Engineer',
    'Frontend Developer',
    'Mobile Application Engineer (React Native)',
    'Full Stack Engineer',
  ],
  targetKeywords: ['React', 'React Native', 'TypeScript', 'JavaScript', 'Next.js', 'Node.js', 'Tailwind CSS'],
  preferredLocations: ['Remote', 'Bengaluru', 'Chennai', 'Hyderabad'],
  workModes: ['Remote', 'Hybrid'],
  totalExperience: '2+ years',
  minimumSalaryLPA: 12,
  maximumSalaryLPA: 28,
  skillsMatchThreshold: 75,
  autoApplyEnabled: true,
  dailyApplicationLimit: 15,
};

const INITIAL_ANSWER_BANK: AnswerBankItem[] = [
  {
    id: 'ans-1',
    question: 'Are you legally authorized to work in India?',
    answer: 'Yes, authorized to work anywhere in India with standard tax and employment compliance.',
    category: 'Authorization',
    isVerified: true,
  },
  {
    id: 'ans-2',
    question: 'Will you require visa sponsorship now or in the future?',
    answer: 'No sponsorship required for roles based in India or remote.',
    category: 'Authorization',
    isVerified: true,
  },
  {
    id: 'ans-3',
    question: 'What is your current notice period?',
    answer: '30 Days (Negotiable with early release option if required).',
    category: 'Notice Period',
    isVerified: true,
  },
  {
    id: 'ans-4',
    question: 'What is your expected CTC (annual compensation)?',
    answer: 'Competitive and aligned with market standards for this role, open to discussion.',
    category: 'Salary',
    isVerified: true,
  },
  {
    id: 'ans-5',
    question: 'How many years of experience do you have with modern web & mobile stacks?',
    answer: 'Over 2+ years building production applications with React, React Native, and TypeScript.',
    category: 'Technical',
    isVerified: true,
  },
  {
    id: 'ans-6',
    question: 'Are you open to Remote or Hybrid work arrangement?',
    answer: 'Yes, fully comfortable working in Remote or Hybrid environments.',
    category: 'General',
    isVerified: true,
  },
  {
    id: 'ans-7',
    question: 'Why are you interested in this role?',
    answer: 'Eager to leverage my engineering expertise and problem-solving skills to accelerate team goals and deliver high-impact software.',
    category: 'General',
    isVerified: true,
  },
];

export const useCandidateProfileStore = create<CandidateProfileState>()(
  persist(
    (set, get) => ({
      // Personal Details - Dynamically populated from Auth User
      name: '',
      email: '',
      phone: '',
      currentCity: '',
      state: '',
      country: 'India',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      workAuthorization: 'Authorized',

      // Collections
      educations: INITIAL_EDUCATIONS,
      experiences: INITIAL_EXPERIENCES,
      skillsList: [
        { id: 'sk-1', name: 'React.js / Next.js', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-2', name: 'React Native / Expo', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-3', name: 'TypeScript', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-4', name: 'JavaScript', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-5', name: 'Node.js / REST APIs', proficiency: 'Intermediate', yearsOfExperience: '1+ yrs' },
        { id: 'sk-6', name: 'UI / UX Design', proficiency: 'Intermediate', yearsOfExperience: '1+ yrs' },
        { id: 'sk-7', name: 'Tailwind CSS', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
      ],
      resumes: INITIAL_RESUMES,
      preferences: INITIAL_PREFERENCES,
      answerBank: INITIAL_ANSWER_BANK,

      // Legacy compatibility fields
      targetRole: 'Software Engineer',
      yearsOfExperience: '2+ years',
      noticePeriod: '30 Days',
      expectedCTC: '15 - 25 LPA',
      skills: [
        'React.js',
        'Next.js',
        'TypeScript',
        'React Native',
        'Expo',
        'JavaScript',
        'Tailwind CSS',
        'REST APIs',
      ],
      resumeFileName: null,
      resumeUri: null,
      resumeFileSize: null,
      resumeUploadedAt: null,

      updatePersonalInfo: (fields) => set((state) => ({ ...state, ...fields })),
      updatePreferences: (prefs) =>
        set((state) => ({ preferences: { ...state.preferences, ...prefs } })),

      addEducation: (edu) => {
        const item: EducationRecord = { ...edu, id: `edu-${Date.now()}` };
        set((state) => ({ educations: [...state.educations, item] }));
      },

      deleteEducation: (id) =>
        set((state) => ({ educations: state.educations.filter((e) => e.id !== id) })),

      addExperience: (exp) => {
        const item: WorkExperienceRecord = { ...exp, id: `exp-${Date.now()}` };
        set((state) => ({ experiences: [item, ...state.experiences] }));
      },

      deleteExperience: (id) =>
        set((state) => ({ experiences: state.experiences.filter((e) => e.id !== id) })),

      addResumeItem: (res) => {
        const item: ResumeItem = { ...res, id: `res-${Date.now()}` };
        set((state) => ({ resumes: [...state.resumes, item] }));
      },

      setDefaultResume: (id) => {
        set((state) => ({
          resumes: state.resumes.map((r) => ({ ...r, isDefault: r.id === id })),
          resumeFileName: state.resumes.find((r) => r.id === id)?.fileName || state.resumeFileName,
        }));
      },

      deleteResumeItem: (id) =>
        set((state) => ({ resumes: state.resumes.filter((r) => r.id !== id) })),

      updateAnswer: (id, newAnswer) => {
        set((state) => ({
          answerBank: state.answerBank.map((a) =>
            a.id === id ? { ...a, answer: newAnswer, isVerified: true } : a
          ),
        }));
      },

      addAnswer: (item) => {
        const newItem: AnswerBankItem = {
          ...item,
          id: `ans-${Date.now()}`,
          isVerified: true,
        };
        set((state) => ({ answerBank: [...state.answerBank, newItem] }));
      },

      // Legacy skill and profile methods
      updateProfile: (fields) => set((state) => ({ ...state, ...fields })),
      setSkills: (skills) => set({ skills }),
      addSkill: (skill) => {
        const clean = skill.trim();
        if (!clean || get().skills.includes(clean)) return;
        set((state) => ({ skills: [...state.skills, clean] }));
      },
      removeSkill: (skill) =>
        set((state) => ({ skills: state.skills.filter((s) => s !== skill) })),

      pickAndUploadResume: async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({
            type: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            copyToCacheDirectory: true,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const newRes: ResumeItem = {
              id: `res-${Date.now()}`,
              name: asset.name.replace(/\.[^/.]+$/, ''),
              targetRole: get().targetRole || 'Software Engineer',
              fileName: asset.name,
              uri: asset.uri,
              fileSize: asset.size || null,
              uploadedAt: new Date().toISOString().split('T')[0],
              isDefault: get().resumes.length === 0,
            };

            set((state) => ({
              resumes: [...state.resumes, newRes],
              resumeFileName: asset.name,
              resumeUri: asset.uri,
              resumeFileSize: asset.size || null,
              resumeUploadedAt: new Date().toISOString().split('T')[0],
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.warn('Document picker error:', error);
          return false;
        }
      },

      removeResume: () =>
        set({
          resumeFileName: null,
          resumeUri: null,
          resumeFileSize: null,
          resumeUploadedAt: null,
        }),

      syncWithAuthUser: (name, email) => {
        if (!name && !email) return;
        set((state) => ({
          name: name ? name.trim() : state.name,
          email: email ? email.trim().toLowerCase() : state.email,
        }));
      },

      resetProfile: () => {
        set({
          name: '',
          email: '',
          phone: '',
          educations: [],
          experiences: [],
          resumes: [],
          resumeFileName: null,
          resumeUri: null,
          resumeFileSize: null,
          resumeUploadedAt: null,
        });
      },
    }),
    {
      name: 'aayon:candidate-profile-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
