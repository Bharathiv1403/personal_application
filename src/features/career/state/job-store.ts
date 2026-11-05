import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { REAL_CAREER_SEED_JOBS } from '@/core/data/real-career-seed';
import { JobDiscoveryService, DiscoveredJobItem } from '@/core/utils/job-discovery-service';
import { useCandidateProfileStore } from './candidate-profile-store';

export type JobStage = 'wishlist' | 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected';

export interface InterviewRoundItem {
  id: string;
  roundName: string;
  scheduledAt: string;
  meetLink?: string;
  interviewer?: string;
  notes?: string;
  rating?: number; // 1-5 stars
  questionsAsked?: string[];
  whatWentWell?: string;
  whatToRevise?: string;
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
  source?: string; // 'LinkedIn' | 'Naukri' | 'Indeed' | 'Foundit' | 'Handshake' | 'Company Site' | 'Referral' | etc.
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

export interface JobPlatformInfo {
  name: string;
  icon: any;
  color: string;
  bg: string;
}

export const getJobPlatformSource = (job: Partial<JobApplicationItem>): JobPlatformInfo => {
  const url = (job.url || '').toLowerCase();
  const tags = (job.tags || []).map((t) => t.toLowerCase());
  const explicit = (job.source || '').toLowerCase();

  if (explicit.includes('linkedin') || url.includes('linkedin.com') || tags.includes('linkedin')) {
    return { name: 'LinkedIn', icon: 'logo-linkedin', color: '#38BDF8', bg: 'rgba(14, 165, 233, 0.15)' };
  }
  if (explicit.includes('naukri') || url.includes('naukri.com') || tags.includes('naukri')) {
    return { name: 'Naukri', icon: 'briefcase', color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.15)' };
  }
  if (explicit.includes('indeed') || url.includes('indeed.com') || tags.includes('indeed')) {
    return { name: 'Indeed', icon: 'search', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.15)' };
  }
  if (explicit.includes('foundit') || explicit.includes('monster') || url.includes('foundit') || url.includes('monster')) {
    return { name: 'Foundit', icon: 'flash', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)' };
  }
  if (explicit.includes('handshake') || url.includes('joinhandshake') || url.includes('handshake') || tags.includes('handshake')) {
    return { name: 'Handshake', icon: 'people', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)' };
  }
  if (explicit.includes('company') || url.includes('greenhouse.io') || url.includes('lever.co') || url.includes('myworkdayjobs.com') || url.includes('careers.')) {
    return { name: 'Company Portal', icon: 'business', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' };
  }
  if (url.includes('arbeitnow') || url.includes('jobicy') || url.includes('remotive')) {
    return { name: 'Remote Hub', icon: 'globe-outline', color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.15)' };
  }
  if (explicit.includes('referral') || tags.includes('referral')) {
    return { name: 'Referral', icon: 'gift-outline', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' };
  }

  return { name: job.source || 'Company Portal', icon: 'browsers-outline', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' };
};

export interface EnterpriseAtsEvaluation {
  matchScore: number;
  tierScore: number; // 1.0 to 5.0
  tierLabel: 'Elite Match 🌟' | 'Strong Fit ✅' | 'Moderate Fit ⚠️' | 'Low Alignment ❌';
  matchedSkills: string[];
  missingSkills: string[];
  hardSkillsScore: number;
  seniorityAlignment: 'Exact Fit' | 'Overqualified' | 'Junior for Role';
  redFlags: string[];
  actionPlan: string[];
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
  updateInterviewRound: (jobId: string, roundId: string, updates: Partial<InterviewRoundItem>) => void;
  deleteJob: (id: string) => void;
  refreshLiveJobs: (query?: string) => Promise<number>;
  calculateJdMatch: (jobDescriptionText: string, customSkills?: string[]) => EnterpriseAtsEvaluation;
  calculateInHandSalary: (grossAnnualLPA: number) => {
    monthlyGross: number;
    monthlyEPF: number;
    monthlyTax: number;
    monthlyInHand: number;
  };
}

// Convert real career seed jobs from career_pilot.db to initial state items (all 140 multi-platform jobs)
const INITIAL_REAL_JOBS: JobApplicationItem[] = REAL_CAREER_SEED_JOBS.map((seed, idx) => ({
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
      myResumeSkills: [],
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
        const appliedDate = new Date().toISOString().split('T')[0];
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id
              ? { ...j, stage: 'applied', appliedDate }
              : j
          ),
        }));

        const appliedJob = get().jobs.find((j) => j.id === id);
        if (appliedJob) {
          try {
            const { NotificationService } = require('@/core/utils/notification-service');
            NotificationService.scheduleJobFollowUpReminder(
              appliedJob.id,
              appliedJob.companyName,
              appliedJob.role,
              appliedDate
            );
          } catch (e) {
            console.warn('[JobStore] Follow-up reminder note:', e);
          }
        }

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
          const currentJobs = get().jobs.length > 0 ? get().jobs : INITIAL_REAL_JOBS;
          const currentIds = new Set(currentJobs.map((j) => j.id));

          // Ensure multi-platform seed jobs (LinkedIn, Naukri, Indeed, Foundit, Company Portal) are present
          const missingSeedJobs = INITIAL_REAL_JOBS.filter((seed) => !currentIds.has(seed.id));
          missingSeedJobs.forEach((s) => currentIds.add(s.id));

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
              source: item.source,
              url: item.url,
              tags: item.tags,
              missingSkills: [],
              interviews: [],
            }));

          set({
            jobs: [...newFormatted, ...missingSeedJobs, ...currentJobs],
            isLoadingLiveJobs: false,
          });

          return newFormatted.length + missingSeedJobs.length;
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

      updateInterviewRound: (jobId, roundId, updates) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  interviews: j.interviews.map((r) =>
                    r.id === roundId ? { ...r, ...updates } : r
                  ),
                }
              : j
          ),
        }));
      },

      deleteJob: (id) => {
        set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
      },

      calculateJdMatch: (jobDescriptionText, customSkills) => {
        const jdLower = jobDescriptionText.toLowerCase();

        // 1. Resolve skills from candidate-profile-store & job-store
        const profileState = useCandidateProfileStore.getState();
        const profileSkills = [
          ...(profileState.skills || []),
          ...(profileState.skillsList || []).map((s) => s.name),
        ];
        const storeSkills = get().myResumeSkills;

        const candidateSkills =
          customSkills && customSkills.length > 0
            ? customSkills
            : storeSkills.length > 0
              ? storeSkills
              : profileSkills.length > 0
                ? profileSkills
                : [
                    'React Native',
                    'TypeScript',
                    'JavaScript',
                    'React',
                    'Mobile Development',
                    'REST APIs',
                    'Git',
                    'State Management',
                  ];

        const matched: string[] = [];
        const missing: string[] = [];

        candidateSkills.forEach((skill) => {
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
          'Node.js',
          'PostgreSQL',
        ];

        commonTech.forEach((tech) => {
          const inJd = jdLower.includes(tech.toLowerCase());
          const alreadyMatched = candidateSkills.some(
            (s) => s.toLowerCase() === tech.toLowerCase()
          );
          if (inJd && !alreadyMatched) {
            missing.push(tech);
          }
        });

        const totalChecked = Math.max(1, matched.length + missing.length);
        const matchScore = Math.min(
          99,
          Math.max(45, Math.round((matched.length / totalChecked) * 100))
        );

        // 1.0 - 5.0 Tier Scoring Rubric (from career-ops modes/_shared.md)
        const tierScore = parseFloat(Math.min(5.0, Math.max(1.0, matchScore / 20)).toFixed(1));
        let tierLabel: EnterpriseAtsEvaluation['tierLabel'] = 'Elite Match 🌟';
        if (tierScore < 2.5) {
          tierLabel = 'Low Alignment ❌';
        } else if (tierScore < 3.8) {
          tierLabel = 'Moderate Fit ⚠️';
        } else if (tierScore < 4.5) {
          tierLabel = 'Strong Fit ✅';
        }

        // Seniority alignment
        const isSeniorJd = jdLower.includes('lead') || jdLower.includes('senior') || jdLower.includes('staff') || jdLower.includes('principal');
        const experiences = useCandidateProfileStore.getState().experiences || [];
        const candidateExpYears = experiences.length > 0 ? Math.max(2, experiences.length * 2) : 3;
        let seniorityAlignment: EnterpriseAtsEvaluation['seniorityAlignment'] = 'Exact Fit';
        if (isSeniorJd && candidateExpYears < 3) {
          seniorityAlignment = 'Junior for Role';
        } else if (!isSeniorJd && candidateExpYears >= 7) {
          seniorityAlignment = 'Overqualified';
        }

        // Red Flags
        const redFlags: string[] = [];
        if (jdLower.includes('unpaid') || jdLower.includes('volunteer')) {
          redFlags.push('Role mentions unpaid work or volunteer terms');
        }
        if (jdLower.includes('registration fee') || jdLower.includes('security deposit')) {
          redFlags.push('Candidate-paid fee warning detected in posting text');
        }
        if (missing.length >= 4) {
          redFlags.push(`Missing ${missing.length} core technologies listed in requirements`);
        }

        // Action Plan
        const actionPlan: string[] = [];
        if (missing.length > 0) {
          actionPlan.push(`Incorporate keywords for ${missing.slice(0, 3).join(', ')} into your profile summary or experience.`);
        }
        actionPlan.push('Tailor your top experience bullet to quantify metric impact and system scale.');
        if (seniorityAlignment === 'Junior for Role') {
          actionPlan.push('Highlight leadership initiative, architecture ownership, and self-directed project deliveries.');
        } else {
          actionPlan.push('Review the company careers portal before applying to confirm active vacancy status.');
        }

        return {
          matchScore,
          tierScore,
          tierLabel,
          matchedSkills: matched,
          missingSkills: missing.slice(0, 5),
          hardSkillsScore: Math.round((matched.length / Math.max(1, matched.length + missing.length)) * 100),
          seniorityAlignment,
          redFlags,
          actionPlan,
        };
      },

      calculateInHandSalary: (grossAnnualLPA) => {
        const grossAnnual = grossAnnualLPA * 100000;
        const monthlyGross = Math.round(grossAnnual / 12);
        const monthlyEPF = Math.round(Math.min(3500, monthlyGross * 0.5 * 0.12));

        // Standard Deduction: ₹75,000 under Indian New Tax Regime (Budget 2024 onwards)
        const taxable = Math.max(0, grossAnnual - 75000);
        let annualTax = 0;

        // Section 87A Tax Rebate: If taxable income is <= ₹7,00,000, 100% tax rebate applies (₹0 Tax)
        if (taxable <= 700000) {
          annualTax = 0;
        } else if (taxable > 1500000) {
          annualTax += (taxable - 1500000) * 0.3 + 140000;
        } else if (taxable > 1200000) {
          annualTax += (taxable - 1200000) * 0.2 + 80000;
        } else if (taxable > 1000000) {
          annualTax += (taxable - 1000000) * 0.15 + 50000;
        } else if (taxable > 700000) {
          // ₹3L to ₹7L = 5% (₹20,000) + 10% on excess above ₹7L
          annualTax += 20000 + (taxable - 700000) * 0.1;
        }

        // 4% Health & Education Cess
        if (annualTax > 0) {
          annualTax = Math.round(annualTax * 1.04);
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
