# 🎨 Design System, Typography & UI/UX Architecture

**Reference Inspiration:** Saga Mail Native (`saga_mail_native`)  
**Design Paradigm:** Premium OLED Dark Mode, Zinc Palette, Emerald Accents, Native Haptics & Glassmorphic Surfaces  
**Platform:** Expo (React Native) + TypeScript  

---

## 1. Design Philosophy & Aesthetic Foundation

In `saga_mail_native`, the UI achieved a responsive, distraction-free, and executive feel by using:
1. **OLED Pure Blacks & Deep Zincs:** No cheap gray backgrounds. The dark mode uses `#09090B` (Zinc-950) so OLED screens consume minimal battery and text pops crisply.
2. **Subtle Elevation Borders:** Cards don't rely on harsh drop shadows; instead, they use semi-translucent borders (`rgba(255, 255, 255, 0.08)`) and high-density zinc card surfaces (`#18181B`).
3. **Intentional Accent Colors:** Emerald Green (`#10B981`) as the primary brand vitality color, paired with Cyan (`#06B6D4`) for technical cues, Amber (`#F59E0B`) for financial alerts, and Rose (`#EF4444`) for urgency.
4. **Tabular Monospace Figures:** Numeric figures (Currency ₹2,00,000, Steps 10,000, Pomodoro 25:00) use monospace alignment to eliminate jumping numbers during live countdowns.

---

## 2. Color Palette & Design Tokens (`src/theme/colors.ts`)

```typescript
export const Palette = {
  // Backgrounds & Surfaces (Zinc Scale matching Saga Mail Native)
  background: '#09090B',       // App Canvas (Zinc-950)
  surface: '#121215',          // Elevated Container (Zinc-900+)
  card: '#18181B',             // Standard Card Surface (Zinc-900)
  cardGlass: 'rgba(24, 24, 27, 0.85)', // Translucent Glass panel
  cardSubtle: '#27272A',       // Nested item / Input field (Zinc-800)

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(16, 185, 129, 0.4)', // Emerald glow
  divider: '#27272A',

  // Typography Colors
  textPrimary: '#FAFAFA',      // High emphasis (Zinc-50)
  textSecondary: '#A1A1AA',    // Medium emphasis (Zinc-400)
  textMuted: '#71717A',        // Low emphasis / Placeholders (Zinc-500)
  textInverse: '#09090B',

  // Brand & Semantic Accents
  primary: '#10B981',          // Emerald-500 (Vitality, Success, Habits)
  primaryDark: '#059669',      // Emerald-600
  primaryGlow: 'rgba(16, 185, 129, 0.15)',

  // Secondary Accents
  cyan: '#06B6D4',             // Technical tags, Career Pipeline
  cyanGlow: 'rgba(6, 182, 212, 0.15)',
  
  purple: '#8B5CF6',           // AI Copilot, Sunday Reset, Briefings
  purpleGlow: 'rgba(139, 92, 246, 0.15)',

  gold: '#F59E0B',             // Gold asset inventory, Wealth, Stars
  goldGlow: 'rgba(245, 158, 11, 0.15)',

  danger: '#EF4444',           // Kadan/Vatti due dates, Urgent, Rejected
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
};
```

---

## 3. Typography & Font System (`src/theme/typography.ts`)

### Font Family Strategy:
- **Headings & Body:** Modern clean Sans-Serif (System font on iOS `San Francisco` / Android `Roboto` or bundled `Inter` / `Plus Jakarta Sans`).
- **Numbers, Financials & Counters:** `SpaceMono` or Tabular Figure font (`fontVariant: ['tabular-nums']`) so step counters, countdown timers, and Indian currency amounts align vertically with zero jitter.

### Typography Scale Hierarchy:

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `display` | 32px | 38px | Bold (700) | Hero Numbers, Big Steps Counter, Net Worth |
| `h1` | 24px | 30px | Bold (700) | Screen Titles ("Today", "Career", "Health") |
| `h2` | 20px | 26px | SemiBold (600) | Section Headers ("Upcoming Interviews", "Vatti Engine") |
| `h3` | 16px | 22px | SemiBold (600) | Card Titles, Company Names, Task Titles |
| `body` | 14px | 20px | Regular (400) | Descriptions, Notes text, Recruiter messages |
| `bodyMedium` | 14px | 20px | Medium (500) | Form Labels, Interactive row titles |
| `caption` | 12px | 16px | Regular (400) | Timestamps, Secondary metadata, Dates |
| `badge` | 11px | 14px | SemiBold (600) | Stage badges (`APPLIED`, `OFFER`, `SAVARAN`) |
| `monoNumbers` | 15px | 20px | SemiBold (600) | Currency values (`₹2,00,000`), Timers (`25:00`) |

---

## 4. Production File Structure (Patterned after Saga Mail Native)

```
Personal_App/
├── App.tsx                      # Root component, Safe Area, Nav Container, Theme
├── app.config.js                # Expo configuration, bundle ID, icons, permissions
├── index.ts                     # Entry registration
├── tsconfig.json                # TypeScript strict config & path aliases (@/...)
├── package.json
│
├── assets/                      # Icons, splash images, fonts
│   ├── adaptive-icon.png
│   ├── icon.png
│   ├── splash.png
│   └── fonts/                   # SpaceMono-Regular.ttf, Inter-Medium.ttf
│
├── Document/                    # Engineering & Design Documentation
│   ├── features.md              # All researched features
│   ├── ARCHITECTURE.md          # Technical architecture & state design
│   ├── DATA_MODELS.md           # Full TypeScript data models & schemas
│   ├── UI_UX_FLOW.md            # ASCII wireframes & navigation flow
│   ├── IMPLEMENTATION_ROADMAP.md # Phased milestone roadmap
│   └── DESIGN_SYSTEM_AND_UI_UX.md # This document
│
└── src/
    ├── theme/                   # Central Design Tokens
    │   ├── colors.ts            # Zinc palette, emerald, cyan, gold
    │   ├── typography.ts        # Type scale, font weights, line heights
    │   ├── spacing.ts           # Spacing tokens (xs: 4, sm: 8, md: 16, lg: 24, xl: 32)
    │   ├── radii.ts             # Border radius (sm: 8, md: 12, lg: 16, full: 9999)
    │   └── index.ts             # Unified Theme export
    │
    ├── navigation/              # Navigation Routing Layer
    │   ├── RootNavigator.tsx    # Native Stack (Detail modals, Add forms)
    │   ├── BottomTabNavigator.tsx # 5 Primary Tabs
    │   ├── TabBarCustomIcon.tsx # Animated active tab icons
    │   └── types.ts             # Navigation stack and tab param list
    │
    ├── stores/                  # Modular Zustand State Stores (Offline First)
    │   ├── job-store.ts         # Career pipeline, interviews, recruiter CRM
    │   ├── health-store.ts      # Pedometer steps, water, sleep, calories
    │   ├── money-store.ts       # Salary, Gold items, Kadan/Vatti engine, Trips, Groceries
    │   ├── note-store.ts        # Markdown notes, code snippets, tags
    │   ├── task-store.ts        # Daily top 3 tasks, habits streaks, Pomodoro
    │   ├── agent-store.ts       # AI chat history, daily briefings, voice actions
    │   └── settings-store.ts    # User profile, theme, biometrics, notifications
    │
    ├── components/              # Shared Reusable Atomic UI Components
    │   ├── common/
    │   │   ├── ScreenContainer.tsx # SafeAreaView, StatusBar, Background wrapper
    │   │   ├── Header.tsx          # Screen header with title, subtitle & action buttons
    │   │   ├── Button.tsx          # Primary (Emerald), Secondary (Zinc), Ghost buttons
    │   │   ├── Badge.tsx           # Color-coded status chip (Wishlist, Applied, Offer)
    │   │   ├── Card.tsx            # Zinc-900 surface with subtle border & optional glass
    │   │   ├── Input.tsx           # Accessible text input with label & error text
    │   │   └── ModalSheet.tsx      # Slide-up bottom sheet for quick forms
    │   │
    │   ├── health/
    │   │   ├── StepGoalRing.tsx    # Circular SVG progress ring (Google Fit style)
    │   │   ├── WaterBottle.tsx     # Animated water level container (+250ml action)
    │   │   └── TimeBarChart.tsx    # 7-day and 24-hour interactive activity bar chart
    │   │
    │   ├── career/
    │   │   ├── JobCard.tsx         # Application card with countdown & stage badge
    │   │   ├── StageFilterBar.tsx  # Horizontal scrollable stage selector
    │   │   └── RecruiterCard.tsx   # Contact card with 1-click WhatsApp/LinkedIn
    │   │
    │   ├── money/
    │   │   ├── LoanVattiCard.tsx   # Principal, 2% monthly vatti, due alert & receipt button
    │   │   ├── GoldSummaryCard.tsx # Grams, Savaran & Live market value estimator
    │   │   ├── TripSummaryCard.tsx # Trip budget, expense breakdown & group split
    │   │   └── GroceryChecklistRow.tsx # Tap-to-strike grocery item with price
    │   │
    │   └── agent/
    │       ├── ChatBubble.tsx      # User (Cyan) vs AI Agent (Emerald/Purple) bubbles
    │       ├── VoiceMicButton.tsx  # Pulsing mic button for voice commands
    │       └── BriefingCard.tsx    # Daily executive summary card
    │
    ├── services/                # Hardware & Platform Services
    │   ├── pedometer.ts         # Device step sensor subscriber & background sync
    │   ├── notifications.ts     # Scheduled local notifications (Vatti & Water)
    │   ├── speech.ts            # Text-to-speech engine (`expo-speech`)
    │   ├── haptics.ts           # Tactile feedback wrapper (`expo-haptics`)
    │   └── biometrics.ts        # Face ID / Fingerprint lock (`expo-local-authentication`)
    │
    └── utils/                   # Pure Helper Functions & Math
        ├── currency.ts          # Format INR (e.g. ₹2,00,000 / 2.5 Lakhs)
        ├── date.ts              # Relative dates ("in 2 days", "yesterday", "Oct 23")
        ├── vatti-calculator.ts  # Monthly interest calculation `(P * R) / 100`
        ├── ats-scorer.ts        # Resume vs Job Description keyword matcher
        └── in-hand-salary.ts    # Indian tax regime deduction calculator
```

---

## 5. Key Reusable UI Components Specifications

### 5.1 `ScreenContainer.tsx`
- Wraps every screen with consistent dark background (`#09090B`).
- Applies `SafeAreaView` from `react-native-safe-area-context` to respect notches, camera punch-holes, and bottom home indicators.
- Sets dark `StatusBar` style (`barStyle="light-content"`).

### 5.2 `Card.tsx`
- Rounded corners (`borderRadius: 16`).
- Dark zinc background (`#18181B`) with 1px border (`rgba(255, 255, 255, 0.08)`).
- Padding: 16px standard.
- Inner elements separated by 12px spacing.

### 5.3 `Badge.tsx`
- Compact capsule (`borderRadius: 20`, padding vertical 4px, horizontal 10px).
- Font size: 11px, SemiBold, letter spacing 0.5px.
- Dynamic colors:
  - `Applied`: Cyan badge (`#06B6D4` text with `rgba(6, 182, 212, 0.12)` background).
  - `Interview`: Violet badge (`#8B5CF6` text with `rgba(139, 92, 246, 0.12)` background).
  - `Offer`: Emerald badge (`#10B981` text with `rgba(16, 185, 129, 0.15)` background).
  - `Due Alert / Urgent`: Rose badge (`#EF4444` text with `rgba(239, 68, 68, 0.15)` background).

### 5.4 `StepGoalRing.tsx` (Google Fit Inspired)
- Uses `react-native-svg` to draw a clean circular stroke ring with rounded caps.
- Dynamic gradient from `#059669` (Dark Emerald) to `#34D399` (Bright Mint).
- Center text displays live steps count in bold display font, with percentage of target goal.

### 5.5 `LoanVattiCard.tsx`
- Highlights:
  - Top Row: Lender Name (`Kumar Anna`) + Status badge (`Active`).
  - Middle: Principal Amount in big tabular figures (`₹2,00,000`), with subtitle `2% Monthly Vatti (2 Rooba)`.
  - Next Row: Monthly Interest Highlight `₹4,000 / month` with due badge (`Due in 3 days - 5th Oct`).
  - Bottom Action Bar: `[ Pay Vatti ]`, `[ Part Repay Principal ]`, `[ Send Receipt ]`.
