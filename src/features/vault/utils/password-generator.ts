// KeePassDX-Grade Password & Passphrase Generator & Strength Auditor

export interface PasswordGeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useDigits: boolean;
  useSymbols: boolean;
  avoidAmbiguous: boolean;
  mode: 'random' | 'passphrase';
  wordCount?: number;
  delimiter?: string;
}

export type PasswordStrength = 'very_weak' | 'weak' | 'fair' | 'strong' | 'military_grade';

export interface PasswordScore {
  strength: PasswordStrength;
  entropyBits: number;
  label: string;
  color: string;
  barPercent: number;
  suggestions: string[];
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = /[l1IO0o]/g;

const WORDLIST = [
  'correct', 'horse', 'battery', 'staple', 'galaxy', 'quantum', 'cipher',
  'phoenix', 'beacon', 'shield', 'aurora', 'matrix', 'orbital', 'granite',
  'titan', 'vortex', 'falcon', 'summit', 'zenith', 'nebula', 'cosmic',
  'safeguard', 'sentinel', 'prism', 'valiant', 'cascade', 'monarch', 'pulse'
];

export class PasswordGenerator {
  static generate(options: PasswordGeneratorOptions): string {
    if (options.mode === 'passphrase') {
      const count = options.wordCount || 4;
      const delimiter = options.delimiter ?? '-';
      const selected: string[] = [];
      for (let i = 0; i < count; i++) {
        const randIdx = Math.floor(Math.random() * WORDLIST.length);
        let word = WORDLIST[randIdx];
        if (i % 2 === 1) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        selected.push(word);
      }
      return selected.join(delimiter);
    }

    let charset = '';
    if (options.useUpper) charset += UPPER;
    if (options.useLower) charset += LOWER;
    if (options.useDigits) charset += DIGITS;
    if (options.useSymbols) charset += SYMBOLS;

    if (options.avoidAmbiguous) {
      charset = charset.replace(AMBIGUOUS, '');
    }

    if (!charset) {
      charset = LOWER + DIGITS;
    }

    const length = Math.max(4, Math.min(64, options.length));
    let password = '';

    // Ensure at least 1 char from each enabled pool
    const pools: string[] = [];
    if (options.useUpper) pools.push(options.avoidAmbiguous ? UPPER.replace(AMBIGUOUS, '') : UPPER);
    if (options.useLower) pools.push(options.avoidAmbiguous ? LOWER.replace(AMBIGUOUS, '') : LOWER);
    if (options.useDigits) pools.push(options.avoidAmbiguous ? DIGITS.replace(AMBIGUOUS, '') : DIGITS);
    if (options.useSymbols) pools.push(SYMBOLS);

    for (const pool of pools) {
      if (password.length < length && pool.length > 0) {
        password += pool.charAt(Math.floor(Math.random() * pool.length));
      }
    }

    while (password.length < length) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle characters
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  static evaluateStrength(password: string): PasswordScore {
    if (!password) {
      return {
        strength: 'very_weak',
        entropyBits: 0,
        label: 'Empty',
        color: '#EF4444',
        barPercent: 0,
        suggestions: ['Enter a password to evaluate.'],
      };
    }

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

    const entropyBits = Math.round(password.length * Math.log2(Math.max(1, poolSize)));
    const suggestions: string[] = [];

    if (password.length < 12) suggestions.push('Increase length to at least 14+ characters.');
    if (!/[A-Z]/.test(password)) suggestions.push('Add uppercase letters.');
    if (!/[0-9]/.test(password)) suggestions.push('Add numeric digits.');
    if (!/[^a-zA-Z0-9]/.test(password)) suggestions.push('Add special symbols.');

    if (entropyBits < 30 || password.length < 8) {
      return {
        strength: 'very_weak',
        entropyBits,
        label: 'Very Weak ⚠️',
        color: '#EF4444',
        barPercent: 20,
        suggestions,
      };
    }
    if (entropyBits < 50 || password.length < 10) {
      return {
        strength: 'weak',
        entropyBits,
        label: 'Weak',
        color: '#F97316',
        barPercent: 40,
        suggestions,
      };
    }
    if (entropyBits < 75 || password.length < 12) {
      return {
        strength: 'fair',
        entropyBits,
        label: 'Fair',
        color: '#F59E0B',
        barPercent: 65,
        suggestions,
      };
    }
    if (entropyBits < 95 || password.length < 16) {
      return {
        strength: 'strong',
        entropyBits,
        label: 'Strong 🔒',
        color: '#3B82F6',
        barPercent: 85,
        suggestions: suggestions.length ? suggestions : ['Good strong password.'],
      };
    }

    return {
      strength: 'military_grade',
      entropyBits,
      label: 'KeePassDX Grade 🛡️',
      color: '#10B981',
      barPercent: 100,
      suggestions: ['Excellent military-grade encryption entropy.'],
    };
  }
}
