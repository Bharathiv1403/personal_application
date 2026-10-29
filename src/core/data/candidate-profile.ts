export const DEFAULT_CANDIDATE_PROFILE = {
  name: 'Candidate User',
  title: 'Full Stack & Mobile Engineer | React • Next.js • React Native',
  email: 'user@example.com',
  phone: '+91 98765 43210',
  location: 'India',
  yearsOfExperience: '2+ years',
  currentCompany: 'Technology Solutions Pvt Ltd',
  currentRole: 'Senior Software Engineer / Team Lead',
  period: '2023 – Present',
  languages: ['JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3', 'Python', 'SQL'],
  frontendSkills: [
    'React.js',
    'Next.js (App Router)',
    'Vue.js',
    'React Native',
    'Expo',
    'Tailwind CSS',
    'Zustand',
    'REST APIs',
  ],
  mobileSkills: [
    'React Native',
    'Expo',
    'Hermes Bytecode',
    'Push Notifications (FCM)',
    'Offline First (AsyncStorage)',
    'Biometrics & SecureStore',
  ],
  backendCloudSkills: [
    'FastAPI',
    'Node.js',
    'PostgreSQL / MySQL',
    'Docker',
    'CI/CD Pipelines',
  ],
  keyProjects: [
    'Enterprise Mobile Client: React Native (Expo) app with real-time push and offline sync',
    'Admin & Operations Console: React, TypeScript, TanStack Query, and robust automated testing',
    'Authentication & SSO Security: OIDC handover, biometric unlock, and encrypted session security',
    'AAYON Life OS: Executive AI, Biometric Vault, Offline-first mobile platform',
  ],
  noticePeriod: '30 Days (Negotiable)',
  expectedCTC: '18 - 28 LPA',
};

export const CURATED_INTERVIEW_QUESTIONS = [
  {
    topic: 'React 19 & Core Internals',
    question: 'How does React Fiber architecture work under the hood, and how does React 19 Actions / useActionState improve form state and pending transitions compared to traditional useState + useEffect?',
    hint: 'Mention time-slicing, priority lanes, automatic pending state, and optimistic updates.',
  },
  {
    topic: 'Next.js App Router & Performance',
    question: 'In Next.js App Router, explain the difference between Server Components (RSC) and Client Components. When would you force a component to be Client-side, and how do Server Actions handle authentication cookies and mutations?',
    hint: 'Mention zero-bundle size for RSC, event listeners/hooks requiring "use client", and httpOnly cookies in Server Actions.',
  },
  {
    topic: 'State Management (Zustand & TanStack Query)',
    question: 'Why would you choose Zustand over Redux Toolkit for client state, and how do you separate Server Cache (TanStack Query) from Global UI state (Zustand) in a large SaaS application?',
    hint: 'Discuss boilerplate reduction, bundle size, atomic selectors, and avoiding duplicating server state in client stores.',
  },
  {
    topic: 'React Native & Mobile Engineering',
    question: 'In React Native with Expo, how does the Hermes JavaScript engine improve startup time (TTI) and memory footprint? Also, how do you handle background push notifications with Firebase FCM when the app is in quit/killed state?',
    hint: 'Precompiled bytecode vs JIT compilation, headless JS tasks, FCM background message handler.',
  },
  {
    topic: 'Web Security & Authentication',
    question: 'You implemented OIDC and TOTP MFA in your previous SaaS project. Explain the PKCE flow in OAuth2/OIDC for Single Page Applications, and how do you prevent race conditions with refresh tokens?',
    hint: 'Code verifier & code challenge, rotating refresh tokens with mutex/queue lock in Axios interceptors.',
  },
  {
    topic: 'Frontend System Design',
    question: 'Design an enterprise webmail client UI (similar to Outlook or Gmail) with 50,000+ emails. How do you implement virtualized list rendering, debounced server-side search, and offline draft caching?',
    hint: 'Windowing/virtualization (TanStack Virtual), AsyncStorage / IndexDB for offline persistence, optimistic UI updates.',
  },
  {
    topic: 'Behavioral / Leadership (STAR)',
    question: 'As an Engineering Team Lead, how did you handle a situation where a developer wrote code that had performance bottlenecks or missed a critical deadline? (Answer using STAR format)',
    hint: 'Situation, Task, Action (constructive code review, pair programming), Result (improved velocity, on-time delivery).',
  },
];

export const CURATED_ENGLISH_BYTES = [
  {
    phrase: 'Bring up to speed',
    tamil: 'ஒரு விஷயத்துல என்ன நடக்குதுனு ஒருத்தருக்கு முழுசா அப்டேட் பண்ணி ரெடி பண்றது (Catch up / Update).',
    corporateExample: '“Hey team, could you please bring me up to speed on the latest deployment blocker?”',
    betterAlternative: 'Say this instead of: "Can you tell me everything from the start?"',
  },
  {
    phrase: 'Touch base',
    tamil: 'சுருக்கமா ஒரு தடவை பேசி status செக் பண்றது (Quick connect / Brief meeting).',
    corporateExample: '“Let’s touch base tomorrow morning regarding the OIDC authentication bug before the demo.”',
    betterAlternative: 'Say this instead of: "Let us meet and talk about this tomorrow."',
  },
  {
    phrase: 'Bandwidth',
    tamil: 'இப்போதைக்கு புது வேலை செய்ய நேரம்/வாய்ப்பு இருக்கிறதா என்று சொல்வது (Capacity / Available time).',
    corporateExample: '“I don’t have the bandwidth to take on the redesign this sprint, but I can pick it up next week.”',
    betterAlternative: 'Say this instead of: "I am too busy and have no time."',
  },
  {
    phrase: 'Circle back',
    tamil: 'பிறகு மீண்டும் அந்த விஷயத்திற்குத் திரும்பி வருவது (Revisit later).',
    corporateExample: '“Let’s circle back to the caching strategy once we have the performance benchmarks.”',
    betterAlternative: 'Say this instead of: "We will talk about this later."',
  },
  {
    phrase: 'Ballpark estimate',
    tamil: 'தோராயமான ஒரு மதிப்பீடு (Rough or approximate calculation).',
    corporateExample: '“Can you give me a ballpark estimate on when the Hermes migration will be completed?”',
    betterAlternative: 'Say this instead of: "Give me some rough guess."',
  },
];
