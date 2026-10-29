export type VaultGroup =
  | 'logins'
  | 'cards'
  | 'servers'
  | 'notes'
  | 'api_keys'
  | 'identities';

export interface VaultField {
  id: string;
  label: string;
  value: string;
  isProtected?: boolean;
}

export interface PasswordHistoryItem {
  password: string;
  changedAt: string;
}

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  totpSecret?: string;
  group: VaultGroup;
  notes?: string;
  customFields?: VaultField[];
  tags?: string[];
  isFavorite?: boolean;
  history?: PasswordHistoryItem[];
  createdAt: string;
  updatedAt: string;
  passwordUpdatedAt: string;
}

export interface VaultHealthReport {
  totalEntries: number;
  weakCount: number;
  reusedCount: number;
  oldPasswordCount: number;
  securityScore: number;
  weakIds: string[];
  reusedIds: string[];
  oldIds: string[];
}
