# 🏛️ Enterprise-Grade Scalable File Structure & Architecture

**Architecture Style:** Domain-Driven & Feature-Sliced Architecture (FSA)  
**Reference:** High-Scale Production Mobile Apps (including `saga_mail_native` & Clean Architecture)  
**Core Principles:** High Cohesion, Loose Coupling, Self-Contained Domain Modules, Separation of Concerns  

---

## 1. Why Flat/Basic Structure Fails at Scale

In basic React Native apps, files are dumped into generic folders:
- ❌ `components/`: Hundreds of mixed components with no domain context.
- ❌ `screens/`: Massive 800-line screen files mixing UI, business logic, sensor calls, and storage.
- ❌ `stores/`: Monolithic stores with tight cross-coupling.

### In Enterprise / Production Architecture:
- Every feature (`career`, `health`, `wealth`, `agent`, `today`, `notes`) is an **independent, self-contained domain module**.
- A feature owns its own **Screens, UI Components, Custom Hooks, State Stores, Native Adapters, and Type Definitions**.
- Cross-cutting utilities (UI Primitives, Hardware Sensor Bridges, Storage Adapters) reside in a unified **`shared/` / `core/`** layer.

---

## 2. Complete Enterprise Directory Tree

```
Personal_App/
├── App.tsx                           # Application Root & Providers Registry
├── app.config.js                     # Expo Dynamic Config, Bundle IDs, Plugins
├── index.ts                          # Mobile App Entrypoint
├── package.json                      # Dependencies & Scripts
├── tsconfig.json                     # Strict TypeScript & Path Mappings (@/*)
│
├── Document/                         # Architecture & Specification Docs
│   ├── features.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODELS.md
│   ├── UI_UX_FLOW.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── DESIGN_SYSTEM_AND_UI_UX.md
│   └── ENTERPRISE_STRUCTURE.md       # This blueprint
│
├── assets/                           # Media & Typography Assets
│   ├── brand/                        # App Icons, Splash Screens, Adaptive Badges
│   ├── fonts/                        # SpaceMono, Inter-SemiBold, PlusJakartaSans
│   └── sounds/                       # Pomodoro Bell, Haptic Chimes
│
└── src/
    │
    ├── config/                       # Global Constants & App Configuration
    │   ├── constants.ts              # App version, defaults, limits
    │   ├── env.ts                    # Environment variables & secrets
    │   └── feature-flags.ts          # Feature toggles
    │
    ├── core/                         # Enterprise Infrastructure & Foundation
    │   ├── design-system/            # Atomic Design Tokens & UI Primitives
    │   │   ├── tokens/
    │   │   │   ├── colors.ts         # Zinc scale, Emerald, Cyan, Gold tokens
    │   │   │   ├── typography.ts     # Tabular nums, Display scale, Font weights
    │   │   │   ├── spacing.ts        # 4px grid system (4, 8, 12, 16, 24, 32, 48)
    │   │   │   └── elevation.ts      # Border strokes, translucent glass backdrops
    │   │   ├── primitives/
    │   │   │   ├── Box.tsx           # Flexbox container primitive
    │   │   │   ├── Text.tsx          # Type-safe typography wrapper
    │   │   │   ├── Button.tsx        # Primary, Secondary, Ghost, Icon buttons
    │   │   │   ├── GlassCard.tsx     # Reusable semi-translucent zinc card
    │   │   │   ├── Badge.tsx         # Status & Category chip primitive
    │   │   │   ├── Input.tsx         # Form input with validation states
    │   │   │   └── ModalSheet.tsx    # Bottom sheet gesture modal
    │   │   └── index.ts              # Unified Design System export
    │   │
    │   ├── storage/                  # Storage Engine & Data Management
    │   │   ├── async-storage-engine.ts # Robust AsyncStorage wrapper with fallback
    │   │   ├── encrypted-vault.ts    # SecureStore integration for confidential items
    │   │   ├── migrations.ts         # Schema versioning & data migration pipeline
    │   │   └── backup-exporter.ts    # Full database JSON export & restore
    │   │
    │   ├── native-bridges/           # Hardware Adapters & Device Sensors
    │   │   ├── pedometer-adapter.ts  # Device step counter & sensor permissions
    │   │   ├── notification-engine.ts# Recurring local notification scheduler
    │   │   ├── haptics-service.ts    # Device vibration tactile feedback
    │   │   ├── speech-engine.ts      # Text-to-speech engine (`expo-speech`)
    │   │   └── biometrics-guard.ts   # Fingerprint & Face ID local authentication
    │   │
    │   └── utils/                    # Pure Mathematical & Formatting Utilities
    │       ├── currency-formatter.ts # Indian Lakhs/Crores & INR formatting
    │       ├── date-time.ts          # Relative countdowns, ISO parser, formatting
    │       ├── interest-math.ts      # Vatti calculations `(P * R) / 100`
    │       └── ats-matcher.ts        # Keyword frequency and resume match algorithm
    │
    ├── navigation/                   # Deep Navigation & Flow Management
    │   ├── RootNavigator.tsx         # Native Stack Root (Modals, Details)
    │   ├── BottomTabNavigator.tsx    # 5 Main Tabs (Today, Career, Health, Vault, Agent)
    │   ├── TabBarCustomItem.tsx      # Custom Tab Item with haptics & active state
    │   ├── routes.ts                 # Type-safe Route name constants
    │   └── types.ts                  # React Navigation StackParamList & TabParamList
    │
    └── features/                     # Autonomous Domain Modules (Domain-Driven)
        │
        ├── auth/                     # 🔐 DOMAIN 0: Authentication & Account (Firebase Auth)
        │   ├── components/           # GoogleSignInButton, AuthFormShell, PasswordInput
        │   ├── hooks/                # useAuthSession, useGoogleAuth
        │   ├── screens/              # LoginScreen.tsx, SignupScreen.tsx, ForgotPasswordScreen.tsx
        │   ├── state/                # auth-store.ts (User profile, session token, sync status)
        │   ├── services/             # firebase-auth-service.ts, user-profile-service.ts
        │   └── types.ts              # AuthUser, SessionState, AuthCredentials
        │
        ├── today/                    # 🏠 DOMAIN 1: Command Center & Discipline
        │   ├── components/           # FocusTaskList, HabitCheckRow, QuickRingsBar
        │   ├── hooks/                # useTodayAgenda, usePomodoroTimer
        │   ├── screens/              # TodayScreen.tsx
        │   ├── state/                # task-store.ts, habit-store.ts
        │   └── types.ts              # TaskItem, HabitStreak, PomodoroSession
        │
        ├── career/                   # 💼 DOMAIN 2: Job Search & ATS Pipeline
        │   ├── components/           # KanbanBoard, JobCard, RecruiterActionSheet,
        │   │                         # InterviewCountdown, AtsScoreBadge
        │   ├── hooks/                # useJobPipeline, useRecruiterLauncher, useInHandSalary
        │   ├── screens/              # CareerScreen.tsx, JobDetailModal.tsx,
        │   │                         # AddJobModal.tsx, AtsMatcherScreen.tsx
        │   ├── state/                # job-store.ts, recruiter-store.ts
        │   ├── services/             # ctc-tax-calculator.ts, follow-up-tracker.ts
        │   └── types.ts              # JobApplication, InterviewRound, Recruiter
        │
        ├── health/                   # 🏃 DOMAIN 3: Google Fit Style Activity Hub
        │   ├── components/           # StepGoalRing (SVG), TimeBarChart (Day/Week/Month),
        │   │                         # WaterBottleAnimation, SleepCard, ErgonomicsTimer
        │   ├── hooks/                # usePedometerLive, useHydrationLog, useTimeFilter
        │   ├── screens/              # HealthDashboardScreen.tsx, HistoryTrendScreen.tsx
        │   ├── state/                # health-store.ts
        │   ├── services/             # step-accumulator.ts, calories-calculator.ts
        │   └── types.ts              # DailyHealthLog, HourlyStepBin, SleepRecord
        │
        ├── wealth/                   # 💰 DOMAIN 4: Smart Money, Debt (Vatti), Trips & Groceries
        │   ├── components/           # LoanVattiCard, GoldHoldingCard, TripBudgetBar,
        │   │                         # GroceryChecklistRow, CashFlowOverview
        │   ├── hooks/                # useVattiEngine, useGoldValuation, useTripSplitter
        │   ├── screens/              # WealthDashboardScreen.tsx, AddLoanModal.tsx,
        │   │                         # TripDetailScreen.tsx, GroceryListScreen.tsx
        │   ├── state/                # wealth-store.ts, trip-store.ts, grocery-store.ts
        │   ├── services/             # vatti-schedule-service.ts, receipt-generator.ts
        │   └── types.ts              # LoanVattiItem, GoldAsset, TripEvent, GroceryItem
        │
        ├── vault/                    # 📝 DOMAIN 5: Notes & Knowledge Second Brain
        │   ├── components/           # MarkdownViewer, CodeSnippetCard, TagFilterList
        │   ├── hooks/                # useNotesVault, useTechBookmarks
        │   ├── screens/              # NotesScreen.tsx, NoteEditorModal.tsx
        │   ├── state/                # note-store.ts
        │   └── types.ts              # NoteItem, TechBookmark
        │
        └── agent/                    # 🤖 DOMAIN 6: AI Executive Copilot & Retrospective
            ├── components/           # ChatBubble, VoiceWaveVisualizer, ActionCard,
            │                         # SundayResetSheet, FlashcardDeck
            ├── hooks/                # useAgentCopilot, useVoiceAssistant, useSundayReset
            ├── screens/              # AgentChatScreen.tsx, SundayResetScreen.tsx
            ├── state/                # agent-store.ts
            ├── services/             # intent-dispatcher.ts, tool-executor.ts
            └── types.ts              # AgentMessage, BriefingSnapshot, Flashcard
```

---

## 3. Structural Comparison: Basic vs Enterprise

| Aspect | Basic / Monolithic | Our Enterprise Domain-Driven Structure |
|---|---|---|
| **Component Discovery** | Dumped in `components/`, hard to locate which screen uses what | Scoped inside `features/<domain>/components/` |
| **Business Logic** | Tangled directly inside React Screen components | Encapsulated in domain-specific `hooks/` and `services/` |
| **State Separation** | Massive global stores that cause unnecessary re-renders | Granular, decoupled domain stores (`job-store`, `health-store`, `wealth-store`) |
| **Native APIs** | Direct platform calls inside UI | Abstracted into `core/native-bridges/` for easy mocking and testing |
| **Reusability** | Duplicate code across screens | Shared UI primitives in `core/design-system/primitives/` |
| **Testing & Maintenance** | Impossible to isolate unit tests | Every domain has pure helper services and isolated state stores |

---

## 4. Communication & Dependency Rules

1. **Feature Independence:** `features/career` should NEVER directly import internal components of `features/health`. If cross-domain communication is needed, it goes through state stores or shared domain events.
2. **Downward Flow:**
   ```
   Screens (features/*/screens)
       └── Components (features/*/components)
           └── Hooks & Stores (features/*/hooks & state)
               └── Core Infrastructure (core/design-system, core/storage, core/native-bridges)
   ```
3. **No Circular Dependencies:** Handled cleanly via strict TypeScript `@/*` path mapping.
