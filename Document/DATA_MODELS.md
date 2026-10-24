# 📊 Personal App: TypeScript Data Models & Schemas

This document defines the complete TypeScript interfaces and data models powering all state stores in the Personal App.

---

## 1. Career & Job Search Models (`src/stores/job-store.ts`)

```typescript
export type JobStage =
  | 'wishlist'
  | 'applied'
  | 'assessment'
  | 'interview_round_1'
  | 'interview_round_2'
  | 'hr_round'
  | 'offer'
  | 'rejected'
  | 'archived';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface InterviewRound {
  id: string;
  roundName: string; // e.g. "Technical Round 1: React Native & System Design"
  scheduledAt: string; // ISO string
  meetingLink?: string; // Zoom / Google Meet
  interviewerName?: string;
  interviewerLinkedIn?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  questionsAsked?: string[];
  selfRating?: number; // 1 to 5 stars
}

export interface RecruiterContact {
  id: string;
  name: string;
  company: string;
  role: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  lastContactedAt?: string;
  notes?: string;
}

export interface JobApplication {
  id: string;
  companyName: string;
  role: string;
  workMode: WorkMode;
  location: string;
  salaryMin?: number; // in LPA
  salaryMax?: number; // in LPA
  offeredCTC?: number; // in LPA (when stage is 'offer')
  stage: JobStage;
  appliedDate: string; // YYYY-MM-DD
  jobPostUrl?: string;
  jobDescription?: string;
  source: 'LinkedIn' | 'Naukri' | 'Referral' | 'Direct' | 'Other';
  referralPerson?: string;
  interviews: InterviewRound[];
  recruiterId?: string;
  followUpDueDate?: string; // Auto-generated for follow-up alerts
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Health & Vitality Models (`src/stores/health-store.ts`)

```typescript
export interface HourlyStepBin {
  hour: number; // 0 to 23
  steps: number;
}

export interface DailyHealthLog {
  date: string; // YYYY-MM-DD
  steps: number;
  stepGoal: number; // default 10,000
  caloriesBurnedKcal: number;
  distanceKm: number;
  activeMoveMinutes: number;
  hourlyBins: HourlyStepBin[];
  
  // Water
  waterIntakeMl: number;
  waterGoalMl: number; // default 3,000 ml
  
  // Sleep
  sleepHours?: number;
  bedTime?: string; // "23:30"
  wakeTime?: string; // "07:00"
  sleepQuality?: 'restful' | 'good' | 'disturbed';

  // Weight
  weightKg?: number;
}
```

---

## 3. Smart Wealth, Gold & Loan (Vatti) Models (`src/stores/money-store.ts`)

```typescript
export interface GoldItem {
  id: string;
  name: string; // e.g. "Gold Chain 22k", "Wedding Ring", "Gold Coin"
  weightGrams: number;
  sovereigns: number; // 1 sovereign (savaran/pavan) = 8 grams
  purity: '24K' | '22K' | '18K';
  storageLocation: 'Home Locker' | 'Bank Locker' | 'Wearing';
  purchasePricePerGram?: number;
  purchaseDate?: string;
  notes?: string;
}

export interface LoanVattiItem {
  id: string;
  lenderName: string; // e.g. "Kumar Anna", "Bank Loan"
  lenderContact?: string; // Phone or Email for dispatching receipt
  principalAmount: number; // e.g. 200000 (2 Lakhs)
  initialPrincipal: number;
  
  // Vatti rate: e.g. 2% per month (or 2 rooba vatti)
  monthlyInterestRatePercent: number; 
  
  // Computed interest per month: (principalAmount * monthlyInterestRatePercent) / 100
  monthlyInterestAmount: number; // e.g. 4000
  
  loanStartDate: string; // YYYY-MM-DD
  dueDayOfMonth: number; // e.g. 5 (5th of every month)
  
  // Repayment tracking
  interestPaymentHistory: {
    id: string;
    paidDate: string;
    amountPaid: number;
    forMonth: string; // "2026-10"
    receiptSent: boolean;
  }[];
  
  principalPaymentHistory: {
    id: string;
    paidDate: string;
    amountPaid: number;
    remainingPrincipal: number;
  }[];
  
  totalInterestPaidLifetime: number;
  status: 'active' | 'settled';
  notes?: string;
}

export interface TripExpenseItem {
  id: string;
  category: 'travel' | 'stay' | 'food' | 'activity' | 'shopping' | 'other';
  title: string;
  amount: number;
  paidBy: string; // e.g. "Bharathi", "Dinesh", "Split equally"
  date: string;
  receiptImageUri?: string;
}

export interface TripEvent {
  id: string;
  tripName: string; // e.g. "Ooty Weekend Trip"
  startDate: string;
  endDate: string;
  budgetAmount: number;
  expenses: TripExpenseItem[];
  members: string[]; // ["Bharathi", "Dinesh", "Karthik"]
  status: 'planning' | 'ongoing' | 'completed';
}

export interface GroceryItem {
  id: string;
  name: string; // "Basmati Rice 5kg", "Cooking Oil 1L", "Milk", "Onion 2kg"
  category: 'provisions' | 'vegetables' | 'dairy' | 'household' | 'medicine';
  approxPrice: number;
  isPurchased: boolean; // checklist strike-through
  recurringMonthly: boolean;
}

export interface CashFlowTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
}
```

---

## 4. Knowledge, Notes & Second Brain (`src/stores/note-store.ts`)

```typescript
export interface NoteItem {
  id: string;
  title: string;
  content: string; // Markdown supported
  tags: string[]; // ["#Career", "#TechNotes", "#SystemDesign"]
  codeLanguage?: string; // "typescript" | "python" | "javascript"
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TechBookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  status: 'to_read' | 'reading' | 'completed';
  notes?: string;
  addedAt: string;
}
```

---

## 5. Daily Agenda, Habits & Tasks (`src/stores/task-store.ts`)

```typescript
export interface DailyTask {
  id: string;
  title: string;
  isPriorityTop3: boolean; // Top 3 Focus item
  isCompleted: boolean;
  dueDate?: string;
  pomodoroMinutesEstimated?: number;
  pomodoroMinutesSpent?: number;
  category: 'career' | 'health' | 'learning' | 'personal';
  createdAt: string;
}

export interface HabitItem {
  id: string;
  name: string; // "Solved 1 DSA problem", "8,000 steps", "Apply to 3 jobs"
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays';
  currentStreakDays: number;
  bestStreakDays: number;
  completionHistory: { [dateYYYYMMDD: string]: boolean };
}
```

---

## 6. AI Agent, Briefings & Settings (`src/stores/agent-store.ts`)

```typescript
export interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: 'ADD_JOB' | 'SET_REMINDER' | 'ADD_NOTE' | 'LOG_WATER';
    payload: any;
    status: 'success' | 'failed';
  };
}

export interface DailyBriefingSnapshot {
  date: string;
  greeting: string;
  weatherSummary?: string;
  interviewsCountToday: number;
  followUpsCountToday: number;
  stepsYesterday: number;
  waterGoalYesterdayHit: boolean;
  topTasks: string[];
  motivationalQuote: string;
}
```
