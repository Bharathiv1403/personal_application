import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { VaultEntry, VaultGroup } from '../types';

const INITIAL_SEED_ENTRIES: VaultEntry[] = [
  {
    id: 'vault_github_live',
    title: 'GitHub Enterprise & Personal',
    username: 'bharathi-ragav',
    password: 'vK9#mQ$4pL!zR7@xT2*wY',
    url: 'https://github.com/login',
    totpSecret: 'JBSWY3DPEHPK3PXP', // Demo Base32 secret for live TOTP preview
    group: 'logins',
    notes: 'Personal & SagaSoft production organization access.',
    tags: ['DevOps', 'Personal', '2FA'],
    isFavorite: true,
    history: [],
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
    passwordUpdatedAt: '2026-10-01T12:00:00Z',
  },
  {
    id: 'vault_aws_iam',
    title: 'AWS Production Cloud Console',
    username: 'admin-bharathi@sagasoft',
    password: 'N9*kL2!vP4#mX8$qW5&zR',
    url: 'https://aws.amazon.com/console',
    totpSecret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
    group: 'servers',
    notes: 'EC2 & S3 storage root management. Strictly requires hardware token / TOTP.',
    tags: ['Cloud', 'Production', 'High Security'],
    isFavorite: true,
    history: [],
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
    passwordUpdatedAt: '2026-09-15T14:30:00Z',
  },
  {
    id: 'vault_hdfc_bank',
    title: 'HDFC Corporate NetBanking',
    username: '98412034',
    password: 'Hdfc#Corporate2026!Lock',
    url: 'https://netbanking.hdfcbank.com',
    group: 'cards',
    notes: 'Salary disbursement & main savings account.',
    customFields: [
      { id: 'f1', label: 'Account No', value: '50100492817291' },
      { id: 'f2', label: 'IFSC Code', value: 'HDFC0001248' },
      { id: 'f3', label: 'UPI ID', value: 'bharathi@okhdfcbank' },
      { id: 'f4', label: 'ATM PIN', value: '8492', isProtected: true },
    ],
    tags: ['Banking', 'Finance'],
    isFavorite: true,
    history: [],
    createdAt: '2026-06-10T11:00:00Z',
    updatedAt: '2026-10-20T09:00:00Z',
    passwordUpdatedAt: '2026-10-20T09:00:00Z',
  },
  {
    id: 'vault_openai_api',
    title: 'OpenAI & Claude API Production Key',
    username: 'api-service-account',
    password: 'sk-proj-9481940294810482019482019481029',
    url: 'https://platform.openai.com',
    group: 'api_keys',
    notes: 'Enterprise Tier 5 API Key for AI Agents & Assistant Workflows.',
    tags: ['AI', 'API', 'Secret'],
    isFavorite: false,
    history: [],
    createdAt: '2026-09-01T15:00:00Z',
    updatedAt: '2026-09-01T15:00:00Z',
    passwordUpdatedAt: '2026-09-01T15:00:00Z',
  },
  {
    id: 'vault_secure_memo',
    title: 'Server Master Root Recovery Seed',
    username: 'root-admin',
    password: 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima',
    group: 'notes',
    notes: 'Cold storage seed recovery phrase. NEVER sync to public clouds unencrypted.',
    tags: ['Seed', 'Recovery', 'Cold Storage'],
    isFavorite: false,
    history: [],
    createdAt: '2026-05-12T08:00:00Z',
    updatedAt: '2026-05-12T08:00:00Z',
    passwordUpdatedAt: '2026-05-12T08:00:00Z',
  },
];

interface VaultState {
  entries: VaultEntry[];
  isUnlocked: boolean;
  searchQuery: string;
  selectedGroup: string; // 'all' | 'favorites' | VaultGroup
  autoLockMinutes: number;

  // Actions
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedGroup: (group: string) => void;
  setAutoLockMinutes: (min: number) => void;

  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt' | 'passwordUpdatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<VaultEntry>) => void;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  importEntries: (newEntries: VaultEntry[]) => number;
  resetVault: () => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      entries: [],
      isUnlocked: false,
      searchQuery: '',
      selectedGroup: 'all',
      autoLockMinutes: 1,

      unlockWithPin: async (pin: string) => {
        try {
          const storedPin = await SecureStore.getItemAsync('nova_user_security_pin');
          if (storedPin && pin === storedPin) {
            set({ isUnlocked: true });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      unlockWithBiometrics: async () => {
        try {
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (!hasHardware || !isEnrolled) {
            return false;
          }

          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Unlock KeePassDX Security Vault 🛡️',
            fallbackLabel: 'Use PIN instead',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });

          if (res.success) {
            set({ isUnlocked: true });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      lock: () => set({ isUnlocked: false }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedGroup: (group) => set({ selectedGroup: group }),
      setAutoLockMinutes: (min) => set({ autoLockMinutes: min }),

      addEntry: (entry) => {
        const now = new Date().toISOString();
        const newEntry: VaultEntry = {
          ...entry,
          id: `vault_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          history: [],
          createdAt: now,
          updatedAt: now,
          passwordUpdatedAt: now,
        };
        set({ entries: [newEntry, ...get().entries] });
      },

      updateEntry: (id, updates) => {
        const now = new Date().toISOString();
        set({
          entries: get().entries.map((item) => {
            if (item.id !== id) return item;

            // If password changed, push old password to history
            const history = [...(item.history || [])];
            if (updates.password && updates.password !== item.password) {
              history.unshift({
                password: item.password,
                changedAt: item.passwordUpdatedAt || now,
              });
            }

            return {
              ...item,
              ...updates,
              history: history.slice(0, 5), // retain past 5 passwords
              updatedAt: now,
              passwordUpdatedAt: updates.password && updates.password !== item.password ? now : item.passwordUpdatedAt,
            };
          }),
        });
      },

      deleteEntry: (id) => {
        set({ entries: get().entries.filter((item) => item.id !== id) });
      },

      toggleFavorite: (id) => {
        set({
          entries: get().entries.map((item) =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
          ),
        });
      },

      importEntries: (newEntries) => {
        const current = get().entries;
        const currentIds = new Set(current.map((e) => e.id));
        const toAdd = newEntries.filter((e) => !currentIds.has(e.id));
        set({ entries: [...toAdd, ...current] });
        return toAdd.length;
      },

      resetVault: () => {
        set({ entries: INITIAL_SEED_ENTRIES, isUnlocked: false });
      },
    }),
    {
      name: '@nova:keepass_vault',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        autoLockMinutes: state.autoLockMinutes,
      }),
    }
  )
);
