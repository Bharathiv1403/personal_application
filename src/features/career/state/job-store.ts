import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { REAL_CAREER_SEED_JOBS } from '@/core/data/real-career-seed';
import { BHARATHI_CANDIDATE_PROFILE } from '@/core/data/candidate-profile';
import { JobDiscoveryService, DiscoveredJobItem } from '@/core/utils/job-discovery-service';

export type JobStage = 'wishlist' | 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected';

export interface InterviewRoundItem {
  id: string;
  roundName: string;
  scheduledAt: string;
  meetLink?: string;
  interviewer?: string;
  notes?: string;
}

export interface JobApplicationItem {
  id: string;
  companyName: string;
  role: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite';
  ctcMin: number;
  ctcMax: number;
  stage: JobStage;
  appliedDate: string;
  jobDescription?: string;
  matchScore?: number;
  missingSkills?: string[];
  url?: string;
  tags?: string[];
  interviews: InterviewRoundItem[];
  recruiterName?: string;
  recruiterPhone?: string;
  recruiterEmail?: string;
}

interface JobState {
  myResumeSkills: string[];
  jobs: JobApplicationItem[];
  isLoadingLiveJobs: boolean;

  // Actions
  addJob: (job: Omit<JobApplicationItem, 'id' | 'interviews'>) => void;
  updateJobStage: (id: string, stage: JobStage) => void;
  applyToJob: (id: string, url?: string) => Promise<void>;
  addInterviewRound: (jobId: string, round: Omit<InterviewRoundItem, 'id'>) => void;
  deleteJob: (id: string) => void;
  refreshLiveJobs: (query?: string) => Promise<number>;
  calculateJdMatch: (jobDescriptionText: string) => { matchScore: number; matchedSkills: string[]; missingSkills: string[] };
  calculateInHandSalary: (grossAnnualLPA: number) => {
    monthlyGross: number;
    monthlyEPF: number;
    monthlyTax: number;
    monthlyInHand: number;
  };
}

// Convert real career seed jobs from career_pilot.db to initial state items
const INITIAL_REAL_JOBS: JobApplicationItem[] = REAL_CAREER_SEED_JOBS.slice(0, 45).map((seed, idx) => ({
  id: seed.id || `real-job-${idx}`,
  companyName: seed.company,
  role: seed.title,
  location: seed.location,
  workMode: seed.location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
  ctcMin: 18,
  ctcMax: 32,
  stage: seed.stage as JobStage,
  appliedDate: seed.appliedDate,
  matchScore: seed.matchScore,
  url: seed.url,
  tags: seed.tags,
  missingSkills: [],
  interviews: [],
}));

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      myResumeSkills: BHARATHI_CANDIDATE_PROFILE.frontendSkills.concat(BHARATHI_CANDIDATE_PROFILE.mobileSkills),
      jobs: INITIAL_REAL_JOBS,
      isLoadingLiveJobs: false,

      addJob: (jobData) => {
        const { matchScore, missingSkills } = jobData.jobDescription
          ? get().calculateJdMatch(jobData.jobDescription)
          : { matchScore: 88, missingSkills: [] };

        const newJob: JobApplicationItem = {
          ...jobData,
          id: `job-${Date.now()}`,
          matchScore,
          missingSkills,
          interviews: [],
        };
        set((state) => ({ jobs: [newJob, ...state.jobs] }));
      },

      updateJobStage: (id, stage) => {
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, stage } : j)),
        }));
      },

      /**
       * 1-Click Apply: Opens the real job URL in browser and moves stage to 'applied'
       */
      applyToJob: async (id: string, url?: string) => {
        const targetUrl = url || get().jobs.find((j) => j.id === id)?.url;
        
        // Mark as applied in local pipeline
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id
              ? { ...j, stage: 'applied', appliedDate: new Date().toISOString().split('T')[0] }
              : j
          ),
        }));

        // Open application URL in browser
        if (targetUrl) {
          try {
            await WebBrowser.openBrowserAsync(targetUrl);
          } catch {
            await Linking.openURL(targetUrl);
          }
        }
      },

      /**
       * Auto-Search: Fetches live jobs from Arbeitnow & Jobicy, calculates match score, and merges
       */
      refreshLiveJobs: async (query?: string) => {
        set({ isLoadingLiveJobs: true });
        try {
          const liveItems = await JobDiscoveryService.fetchLiveJobs(query);
          const currentJobs = get().jobs;
          const currentIds = new Set(currentJobs.map((j) => j.id));

          const newFormatted: JobApplicationItem[] = liveItems
            .filter((item) => !currentIds.has(item.id))
            .map((item) => ({
              id: item.id,
              companyName: item.company,
              role: item.title,
              location: item.location,
              workMode: item.location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
              ctcMin: 20,
              ctcMax: 35,
              stage: 'wishlist',
              appliedDate: item.appliedDate,
              matchScore: item.matchScore,
              url: item.url,
              tags: item.tags,
              missingSkills: [],
              interviews: [],
            }));

          set((state) => ({
            jobs: [...newFormatted, ...state.jobs],
            isLoadingLiveJobs: false,
          }));

          return newFormatted.length;
        } catch (e) {
          console.warn('Failed to refresh live jobs:', e);
          set({ isLoadingLiveJobs: false });
          return 0;
        }
      },

      addInterviewRound: (jobId, round) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? { ...j, interviews: [...j.interviews, { ...round, id: `int-${Date.now()}` }] }
              : j
          ),
        }));
      },

      deleteJob: (id) => {
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
      },

      calculateJdMatch: (jobDescriptionText) => {
        const resumeSkills = get().myResumeSkills;
        const jdLower = jobDescriptionText.toLowerCase();

        const matched: string[] = [];
        const missing: string[] = [];

        resumeSkills.forEach((skill) => {
          if (jdLower.includes(skill.toLowerCase())) {
            matched.push(skill);
          }
        });

        const commonTech = [
          'GraphQL',
          'Jest',
          'CI/CD',
          'Reanimated',
          'Native Modules',
          'Kotlin',
          'Swift',
          'Docker',
          'WebSockets',
        ];

        commonTech.forEach((tech) => {
          if (jdLower.includes(tech.toLowerCase()) && !resumeSkills.includes(tech)) {
            missing.push(tech);
          }
        });

        const totalChecked = Math.max(1, matched.length + missing.length);
        const matchScore = Math.min(99, Math.max(75, Math.round((matched.length / totalChecked) * 100)));

        return {
          matchScore,
          matchedSkills: matched,
          missingSkills: missing.slice(0, 4),
        };
      },

      calculateInHandSalary: (grossAnnualLPA) => {
        const grossAnnual = grossAnnualLPA * 100000;
        const monthlyGross = Math.round(grossAnnual / 12);
        const monthlyEPF = Math.round(Math.min(3500, (monthlyGross * 0.5) * 0.12));

        const taxable = Math.max(0, grossAnnual - 75000);
        let annualTax = 0;
        if (taxable > 1500000) {
          annualTax += (taxable - 1500000) * 0.3 + 140000;
        } else if (taxable > 1200000) {
          annualTax += (taxable - 1200000) * 0.2 + 80000;
        } else if (taxable > 1000000) {
          annualTax += (taxable - 1000000) * 0.15 + 50000;
        } else if (taxable > 700000) {
          annualTax += (taxable - 700000) * 0.1 + 20000;
        } else if (taxable > 300000) {
          annualTax += (taxable - 300000) * 0.05;
        }

        const monthlyTax = Math.round(annualTax / 12);
        const monthlyInHand = Math.max(0, monthlyGross - monthlyEPF - monthlyTax - 200);

        return {
          monthlyGross,
          monthlyEPF,
          monthlyTax,
          monthlyInHand,
        };
      },
    }),
    {
      name: 'personal-app:career-jobs-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
