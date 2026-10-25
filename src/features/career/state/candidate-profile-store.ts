import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { BHARATHI_CANDIDATE_PROFILE } from '@/core/data/candidate-profile';

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
}

// ==========================================
// Initial Real Seed Data for Bharathi V
// ==========================================

const INITIAL_EDUCATIONS: EducationRecord[] = [
  {
    id: 'edu-1',
    qualification: 'PG Degree',
    degree: 'Master of Computer Applications (MCA)',
    college: 'University of Madras',
    specialization: 'Computer Applications & Software Engineering',
    startYear: '2022',
    graduationYear: '2024',
    grade: '8.4 CGPA',
    status: 'Completed',
  },
  {
    id: 'edu-2',
    qualification: 'UG Degree',
    degree: 'B.Sc. Computer Science',
    college: 'Thiruvalluvar University',
    specialization: 'Computer Science',
    startYear: '2019',
    graduationYear: '2022',
    grade: '8.1 CGPA',
    status: 'Completed',
  },
];

const INITIAL_EXPERIENCES: WorkExperienceRecord[] = [
  {
    id: 'exp-1',
    companyName: 'Sagasoft Technologies Pvt Ltd',
    jobTitle: 'Frontend Developer & Lead (UI/UX Architect)',
    employmentType: 'Full-time',
    startDate: 'Aug 2024',
    endDate: 'Present',
    isCurrentJob: true,
    workLocation: 'Chennai / Viluppuram',
    workMode: 'Hybrid',
    responsibilities:
      'Spearheading frontend architecture for enterprise SaaS products. Built Saga Mail (React Native & Hermes push engine) and SagaID Admin Console with OIDC authentication.',
    skillsUsed: ['React.js', 'Next.js', 'React Native', 'Expo', 'TypeScript', 'Zustand', 'OIDC'],
    noticePeriod: '30 Days (Negotiable)',
    currentCTC: '18 LPA',
    expectedCTC: '24 - 30 LPA',
  },
];

const INITIAL_RESUMES: ResumeItem[] = [
  {
    id: 'res-1',
    name: 'Frontend Lead Resume (React • Vue • Next.js)',
    targetRole: 'Frontend Developer & Lead',
    fileName: 'Bharathi_V_Frontend_Lead_Resume.pdf',
    uploadedAt: '2026-10-25',
    isDefault: true,
    fileSize: 106032,
  },
  {
    id: 'res-2',
    name: 'Mobile Engineering Resume (React Native • Expo)',
    targetRole: 'Senior React Native Developer',
    fileName: 'Bharathi_V_ReactNative_Mobile_Resume.pdf',
    uploadedAt: '2026-10-20',
    isDefault: false,
    fileSize: 98400,
  },
  {
    id: 'res-3',
    name: 'Full Stack Engineer Resume (React + FastAPI)',
    targetRole: 'Full Stack Engineer',
    fileName: 'Bharathi_V_FullStack_Resume.pdf',
    uploadedAt: '2026-10-15',
    isDefault: false,
    fileSize: 112500,
  },
];

const INITIAL_PREFERENCES: JobPreferences = {
  targetJobTitles: [
    'Frontend Developer & Lead',
    'Senior React / React Native Engineer',
    'Full Stack Engineer',
    'Vue.js / Next.js Specialist',
  ],
  targetKeywords: ['React', 'React Native', 'Next.js', 'Vue.js', 'TypeScript', 'FastAPI', 'Hermes'],
  preferredLocations: ['Chennai', 'Bengaluru', 'Remote'],
  workModes: ['Remote', 'Hybrid'],
  totalExperience: '2+ years',
  minimumSalaryLPA: 18,
  maximumSalaryLPA: 32,
  skillsMatchThreshold: 75,
  autoApplyEnabled: true,
  dailyApplicationLimit: 15,
};

const INITIAL_ANSWER_BANK: AnswerBankItem[] = [
  {
    id: 'ans-1',
    question: 'Are you legally authorized to work in India?',
    answer: 'Yes, Indian citizen with full authorization to work anywhere in India.',
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
    answer: '30 Days (Officially negotiable with early buyout option).',
    category: 'Notice Period',
    isVerified: true,
  },
  {
    id: 'ans-4',
    question: 'What is your expected CTC (annual compensation)?',
    answer: '₹24 - 30 LPA (Negotiable based on stock options & benefits).',
    category: 'Salary',
    isVerified: true,
  },
  {
    id: 'ans-5',
    question: 'How many years of experience do you have with React & React Native?',
    answer: 'Over 2+ years leading production web (React 19, Next.js) and mobile (Expo, Hermes, Zustand) apps.',
    category: 'Technical',
    isVerified: true,
  },
  {
    id: 'ans-6',
    question: 'Are you willing to work in Hybrid mode in Chennai or Bengaluru?',
    answer: 'Yes, fully open to Hybrid in Chennai/Bengaluru or 100% Remote.',
    category: 'General',
    isVerified: true,
  },
  {
    id: 'ans-7',
    question: 'Why are you interested in this role?',
    answer: 'Eager to leverage my expertise in scalable frontend architecture (Hermes push engine, RSC, OIDC security) to accelerate product engineering.',
    category: 'General',
    isVerified: true,
  },
];

export const useCandidateProfileStore = create<CandidateProfileState>()(
  persist(
    (set, get) => ({
      // Personal Details
      name: BHARATHI_CANDIDATE_PROFILE.name,
      email: BHARATHI_CANDIDATE_PROFILE.email,
      phone: BHARATHI_CANDIDATE_PROFILE.phone,
      currentCity: 'Viluppuram',
      state: 'Tamil Nadu',
      country: 'India',
      linkedinUrl: 'https://linkedin.com/in/bharathiv1403',
      githubUrl: 'https://github.com/Bharathiv1403',
      portfolioUrl: 'https://bharathi.dev',
      workAuthorization: 'Authorized (Indian Citizen)',

      // Collections
      educations: INITIAL_EDUCATIONS,
      experiences: INITIAL_EXPERIENCES,
      skillsList: [
        { id: 'sk-1', name: 'React.js / Next.js', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-2', name: 'React Native / Expo', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-3', name: 'Vue.js (Pinia)', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-4', name: 'TypeScript', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-5', name: 'FastAPI / Python', proficiency: 'Intermediate', yearsOfExperience: '1+ yrs' },
        { id: 'sk-6', name: 'Zustand / Redux', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
        { id: 'sk-7', name: 'Tailwind CSS', proficiency: 'Advanced', yearsOfExperience: '2+ yrs' },
      ],
      resumes: INITIAL_RESUMES,
      preferences: INITIAL_PREFERENCES,
      answerBank: INITIAL_ANSWER_BANK,

      // Legacy compatibility fields
      targetRole: 'Frontend Developer & Lead',
      yearsOfExperience: BHARATHI_CANDIDATE_PROFILE.yearsOfExperience,
      noticePeriod: BHARATHI_CANDIDATE_PROFILE.noticePeriod,
      expectedCTC: BHARATHI_CANDIDATE_PROFILE.expectedCTC,
      skills: [
        'React.js',
        'Next.js',
        'TypeScript',
        'React Native',
        'Expo',
        'Vue.js',
        'Tailwind CSS',
        'Zustand',
        'FastAPI',
        'Hermes',
        'OIDC / Auth',
      ],
      resumeFileName: 'Bharathi_V_Frontend_Lead_Resume.pdf',
      resumeUri: null,
      resumeFileSize: 106032,
      resumeUploadedAt: new Date().toISOString().split('T')[0],

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
    }),
    {
      name: 'personal-app:candidate-profile-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
