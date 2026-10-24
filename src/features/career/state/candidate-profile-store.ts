import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { BHARATHI_CANDIDATE_PROFILE } from '@/core/data/candidate-profile';

export interface CandidateProfileState {
  name: string;
  email: string;
  phone: string;
  location: string;
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
  updateProfile: (fields: Partial<Omit<CandidateProfileState, 'skills'>>) => void;
  setSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  pickAndUploadResume: () => Promise<boolean>;
  removeResume: () => void;
}

export const useCandidateProfileStore = create<CandidateProfileState>()(
  persist(
    (set, get) => ({
      name: BHARATHI_CANDIDATE_PROFILE.name,
      email: BHARATHI_CANDIDATE_PROFILE.email,
      phone: BHARATHI_CANDIDATE_PROFILE.phone,
      location: BHARATHI_CANDIDATE_PROFILE.location,
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
        'REST APIs',
        'Hermes',
        'OIDC / Auth',
      ],
      resumeFileName: 'Bharathi_V_Frontend_Lead_Resume.pdf',
      resumeUri: null,
      resumeFileSize: 106032,
      resumeUploadedAt: new Date().toISOString().split('T')[0],

      updateProfile: (fields) => set((state) => ({ ...state, ...fields })),

      setSkills: (skills) => set({ skills }),

      addSkill: (skill) => {
        const clean = skill.trim();
        if (!clean || get().skills.includes(clean)) return;
        set((state) => ({ skills: [...state.skills, clean] }));
      },

      removeSkill: (skill) => {
        set((state) => ({ skills: state.skills.filter((s) => s !== skill) }));
      },

      pickAndUploadResume: async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            copyToCacheDirectory: true,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            set({
              resumeFileName: asset.name,
              resumeUri: asset.uri,
              resumeFileSize: asset.size || null,
              resumeUploadedAt: new Date().toISOString().split('T')[0],
            });
            return true;
          }
          return false;
        } catch (error) {
          console.warn('Document picker error:', error);
          return false;
        }
      },

      removeResume: () => {
        set({
          resumeFileName: null,
          resumeUri: null,
          resumeFileSize: null,
          resumeUploadedAt: null,
        });
      },
    }),
    {
      name: 'personal-app:candidate-profile-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
