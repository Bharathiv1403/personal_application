export const Colors = {
  // Pure OLED Blacks & Zinc Scales (Patterned after Saga Mail Native)
  background: '#09090B',       // Canvas Zinc-950
  surface: '#121215',          // Elevated Panel Zinc-900+
  card: '#18181B',             // Standard Card Surface Zinc-900
  cardElevated: '#202024',     // Hover/Active Surface
  cardGlass: 'rgba(24, 24, 27, 0.85)', // Translucent Backdrop
  cardSubtle: '#27272A',       // Subtle Surface

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderActive: 'rgba(16, 185, 129, 0.4)',
  divider: '#27272A',

  // Typography
  textPrimary: '#FAFAFA',      // Zinc-50
  textSecondary: '#A1A1AA',    // Zinc-400
  textMuted: '#71717A',        // Zinc-500
  textInverse: '#09090B',

  // Semantic Accents
  primary: '#10B981',          // Emerald-500 (Health, Success, Habits)
  primaryDark: '#059669',      // Emerald-600
  primaryGlow: 'rgba(16, 185, 129, 0.15)',

  cyan: '#06B6D4',             // Cyan-500 (Career, Tech, Navigation)
  cyanDark: '#0891B2',
  cyanGlow: 'rgba(6, 182, 212, 0.15)',

  purple: '#8B5CF6',           // Purple-500 (AI Copilot, Briefings)
  purpleGlow: 'rgba(139, 92, 246, 0.15)',

  gold: '#F59E0B',             // Amber-500 (Gold Assets, High Priority)
  goldDark: '#D97706',
  goldGlow: 'rgba(245, 158, 11, 0.15)',

  danger: '#EF4444',           // Rose-500 (Vatti Due, Rejected, Urgent)
  dangerDark: '#DC2626',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
} as const;

export type ColorToken = keyof typeof Colors;
