import { TextStyle, Platform } from 'react-native';

const SANS_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

const SANS_MEDIUM = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'sans-serif',
});

export const Typography: { [key: string]: TextStyle } = {
  display: {
    fontFamily: SANS_MEDIUM,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: SANS_MEDIUM,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: SANS_MEDIUM,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: SANS_MEDIUM,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily: SANS_FONT,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: SANS_MEDIUM,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  caption: {
    fontFamily: SANS_FONT,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  badge: {
    fontFamily: SANS_MEDIUM,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  monoNumbers: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  heroNumbers: {
    fontFamily: SANS_MEDIUM,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
};
