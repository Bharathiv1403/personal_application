import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateMonthlyVatti, recalculateAfterPartPayment } from '@/core/utils/vatti';

// ==========================================
// Financial Management Types
// ==========================================

export type AccountType = 'bank' | 'cash' | 'credit_card' | 'wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // For credit card, this represents current outstanding due
  creditLimit?: number; // Only for credit cards
  accountNumberMasked?: string;
  icon: string;
  color: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Net Banking';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  categoryId: string;
  accountId: string; // Source account
  toAccountId?: string; // For transfers
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  merchant?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  name: string;
  categoryId?: string; // undefined = overall monthly budget
  amount: number;
  period: 'monthly' | 'weekly';
  alertThresholdPercent: number; // default 80%
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  dueDate: string; // YYYY-MM-DD
  accountId?: string;
  isPaid: boolean;
  paidDate?: string;
  recurring: 'monthly' | 'quarterly' | 'yearly' | 'none';
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  categoryIcon: string;
  color: string;
}

// ==========================================
// Existing Wealth / Vatti / Gold / Trip Types
// ==========================================

export interface LoanItem {
  id: string;
  lenderName: string;
  lenderPhone?: string;
  principalAmount: number;
  initialPrincipal: number;
  monthlyRatePercent: number;
  monthlyInterestAmount: number;
  dueDayOfMonth: number;
  startDate: string;
  lifetimeInterestPaid: number;
  status: 'active' | 'settled';
  history: {
    id: string;
    type: 'interest' | 'principal';
    amount: number;
    date: string;
    note?: string;
  }[];
}

export interface GoldHolding {
  id: string;
  name: string;
  weightGrams: number;
  sovereigns: number;
  purity: '24K' | '22K' | '18K';
  location: 'Home Locker' | 'Bank Locker' | 'Wearing';
  purchaseDate?: string;
}

export type TripExpenseCategory =
  | 'fuel'
  | 'driver'
  | 'toll_parking'
  | 'repair'
  | 'stay'
  | 'food'
  | 'activity'
  | 'shopping'
  | 'misc';

export interface TripContribution {
  id: string;
  memberName: string;
  amount: number;
  date: string;
}

export interface TripExpense {
  id: string;
  title: string;
  category: TripExpenseCategory;
  amount: number;
  paidBy: string; // 'Common Pool' or member name
  splitAmong?: string[]; // which members share this cost (defaults to all trip members)
  date: string;
}

export interface Trip {
  id: string;
  name: string;
  budget: number;
  tripType: 'solo' | 'group';
  startDate?: string;
  members: string[];
  contributions: TripContribution[];
  expenses: TripExpense[];
  status: 'ongoing' | 'completed';
}

export type PeerDebtType = 'gave' | 'took'; // 'gave' = Lent (You'll get back), 'took' = Borrowed (You owe)

export interface PeerDebt {
  id: string;
  personName: string;
  personPhone?: string;
  type: PeerDebtType;
  amount: number;
  paidAmount: number; // partial payment tracking (default 0)
  date: string;
  note?: string;
  status: 'pending' | 'settled';
  settledDate?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  approxPrice: number;
  isPurchased: boolean;
  category: 'provisions' | 'vegetables' | 'dairy' | 'household';
}

// ==========================================
// Default Seed Constants
// ==========================================

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'food', name: 'Food & Dining', type: 'expense', icon: 'restaurant', color: '#EF4444' },
  { id: 'groceries', name: 'Groceries', type: 'expense', icon: 'cart', color: '#10B981' },
  { id: 'transport', name: 'Fuel & Travel', type: 'expense', icon: 'car', color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', type: 'expense', icon: 'bag-handle', color: '#EC4899' },
  { id: 'housing', name: 'Rent & Housing', type: 'expense', icon: 'home', color: '#F59E0B' },
  { id: 'utilities', name: 'Bills & Utilities', type: 'expense', icon: 'flash', color: '#8B5CF6' },
  { id: 'health', name: 'Health & Medical', type: 'expense', icon: 'medkit', color: '#06B6D4' },
  { id: 'entertainment', name: 'Entertainment & OTT', type: 'expense', icon: 'film', color: '#6366F1' },
  { id: 'emi_loans', name: 'EMI & Loans', type: 'expense', icon: 'card', color: '#F97316' },
  { id: 'personal', name: 'Personal Care', type: 'expense', icon: 'sparkles', color: '#14B8A6' },
  { id: 'misc', name: 'Miscellaneous', type: 'expense', icon: 'grid', color: '#64748B' },
  
  // Income Categories
  { id: 'salary', name: 'Monthly Salary', type: 'income', icon: 'cash', color: '#10B981' },
  { id: 'freelance', name: 'Freelance & Tech', type: 'income', icon: 'laptop', color: '#3B82F6' },
  { id: 'business', name: 'Business Income', type: 'income', icon: 'briefcase', color: '#8B5CF6' },
  { id: 'investments', name: 'Investments & Returns', type: 'income', icon: 'trending-up', color: '#F59E0B' },
  { id: 'gifts', name: 'Gifts & Others', type: 'income', icon: 'gift', color: '#EC4899' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Cash / Primary Account',
    type: 'cash',
    balance: 0,
    icon: 'wallet',
    color: '#10B981',
  },
];

export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_BILLS: Bill[] = [];
export const INITIAL_GOALS: SavingsGoal[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// ==========================================
// Store Interface & Implementation
// ==========================================

export interface WealthState {
  // Financial Core
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];

  // Legacy/Gold & Vatti Collections
  monthlySalary: number;
  currentGoldRatePerGram: number;
  loans: LoanItem[];
  goldItems: GoldHolding[];
  trips: Trip[];
  groceries: GroceryItem[];
  isStealthMode: boolean;
  toggleStealthMode: () => void;

  // Transaction Management
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updatedFields: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;

  // Account Management
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccountBalance: (id: string, newBalance: number) => void;
  deleteAccount: (id: string) => void;

  // Budget Management
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, amount: number) => void;
  deleteBudget: (id: string) => void;

  // Bill Management
  addBill: (bill: Omit<Bill, 'id' | 'isPaid'>) => void;
  payBill: (billId: string, accountId: string) => void;
  deleteBill: (id: string) => void;

  // Goal Management
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  depositToGoal: (goalId: string, amount: number, accountId: string) => void;
  withdrawFromGoal: (goalId: string, amount: number, accountId: string, reason?: string) => void;
  deleteGoal: (id: string) => void;

  // Peer Debts (Friends Khata)
  peerDebts: PeerDebt[];
  addPeerDebt: (debt: Omit<PeerDebt, 'id' | 'status' | 'paidAmount'>) => void;
  settlePeerDebt: (id: string) => void;
  recordPeerDebtPartialPayment: (id: string, partialAmount: number) => void;
  deletePeerDebt: (id: string) => void;

  // Legacy Actions & Enhanced Trips
  setMonthlySalary: (amount: number) => void;
  setGoldRate: (rate: number) => void;
  addLoan: (params: {
    lenderName: string;
    lenderPhone?: string;
    principalAmount: number;
    monthlyRatePercent: number;
    dueDayOfMonth: number;
  }) => void;
  payMonthlyVatti: (loanId: string, amount?: number) => void;
  partRepayPrincipal: (loanId: string, amount: number) => void;
  deleteLoan: (loanId: string) => void;
  addGoldItem: (item: Omit<GoldHolding, 'id' | 'sovereigns'>) => void;
  deleteGoldItem: (id: string) => void;
  addTrip: (
    name: string,
    budget: number,
    members: string[],
    initialContributions?: { memberName: string; amount: number }[],
    tripType?: 'solo' | 'group'
  ) => void;
  deleteTrip: (id: string) => void;
  addTripMember: (tripId: string, memberName: string) => void;
  addTripContribution: (tripId: string, memberName: string, amount: number) => void;
  addTripExpense: (tripId: string, expense: Omit<TripExpense, 'id'>) => void;
  deleteTripExpense: (tripId: string, expenseId: string) => void;
  completeTrip: (tripId: string) => void;
  toggleTripStatus: (tripId: string) => void;
  addGroceryItem: (name: string, approxPrice: number, category: GroceryItem['category']) => void;
  toggleGroceryItem: (id: string) => void;
  clearPurchasedGroceries: () => void;
  restoreBackupData: (backupJson: string) => boolean;
  resetAllData: () => void;
}

export const useWealthStore = create<WealthState>()(
  persist(
    (set, get) => ({
      // Initialize with completely fresh empty data
      accounts: INITIAL_ACCOUNTS,
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      bills: [],
      savingsGoals: [],

      monthlySalary: 0,
      currentGoldRatePerGram: 7850,
      loans: [],
      goldItems: [],
      trips: [],
      peerDebts: [],
      groceries: [],
      isStealthMode: false,
      toggleStealthMode: () => set((state) => ({ isStealthMode: !state.isStealthMode })),

      // -------------------------------------------------------------
      // Transaction Actions (Atomic Balance Updates)
      // -------------------------------------------------------------
      addTransaction: (txData) => {
        const id = `tx-${Date.now()}`;
        const newTx: Transaction = {
          ...txData,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (newTx.type === 'expense') {
              if (acc.id === newTx.accountId) {
                // If it's a credit card, expense increases the outstanding due
                const newBal = acc.type === 'credit_card' ? acc.balance + newTx.amount : acc.balance - newTx.amount;
                return { ...acc, balance: newBal };
              }
            } else if (newTx.type === 'income') {
              if (acc.id === newTx.accountId) {
                return { ...acc, balance: acc.balance + newTx.amount };
              }
            } else if (newTx.type === 'transfer') {
              // Deduct from source
              if (acc.id === newTx.accountId) {
                return { ...acc, balance: acc.balance - newTx.amount };
              }
              // Add to destination
              if (acc.id === newTx.toAccountId) {
                // If destination is credit card, this is a card payment (reduces outstanding due)
                const newBal = acc.type === 'credit_card' ? Math.max(0, acc.balance - newTx.amount) : acc.balance + newTx.amount;
                return { ...acc, balance: newBal };
              }
            }
            return acc;
          });

          return {
            transactions: [newTx, ...state.transactions],
            accounts: updatedAccounts,
          };
        });
      },

      updateTransaction: (id, updatedFields) => {
        set((state) => {
          const oldTx = state.transactions.find((t) => t.id === id);
          if (!oldTx) return state;

          const newTx = { ...oldTx, ...updatedFields };

          // 1. Revert oldTx balance changes
          let tempAccounts = state.accounts.map((acc) => {
            if (oldTx.type === 'expense' && acc.id === oldTx.accountId) {
              const newBal = acc.type === 'credit_card' ? acc.balance - oldTx.amount : acc.balance + oldTx.amount;
              return { ...acc, balance: newBal };
            }
            if (oldTx.type === 'income' && acc.id === oldTx.accountId) {
              return { ...acc, balance: acc.balance - oldTx.amount };
            }
            if (oldTx.type === 'transfer') {
              if (acc.id === oldTx.accountId) return { ...acc, balance: acc.balance + oldTx.amount };
              if (acc.id === oldTx.toAccountId) {
                const newBal = acc.type === 'credit_card' ? acc.balance + oldTx.amount : acc.balance - oldTx.amount;
                return { ...acc, balance: newBal };
              }
            }
            return acc;
          });

          // 2. Apply newTx balance changes
          tempAccounts = tempAccounts.map((acc) => {
            if (newTx.type === 'expense' && acc.id === newTx.accountId) {
              const newBal = acc.type === 'credit_card' ? acc.balance + newTx.amount : acc.balance - newTx.amount;
              return { ...acc, balance: newBal };
            }
            if (newTx.type === 'income' && acc.id === newTx.accountId) {
              return { ...acc, balance: acc.balance + newTx.amount };
            }
            if (newTx.type === 'transfer') {
              if (acc.id === newTx.accountId) return { ...acc, balance: acc.balance - newTx.amount };
              if (acc.id === newTx.toAccountId) {
                const newBal = acc.type === 'credit_card' ? Math.max(0, acc.balance - newTx.amount) : acc.balance + newTx.amount;
                return { ...acc, balance: newBal };
              }
            }
            return acc;
          });

          return {
            transactions: state.transactions.map((t) => (t.id === id ? newTx : t)),
            accounts: tempAccounts,
          };
        });
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (!tx) return state;

          // Revert balance changes
          const updatedAccounts = state.accounts.map((acc) => {
            if (tx.type === 'expense' && acc.id === tx.accountId) {
              const newBal = acc.type === 'credit_card' ? acc.balance - tx.amount : acc.balance + tx.amount;
              return { ...acc, balance: newBal };
            }
            if (tx.type === 'income' && acc.id === tx.accountId) {
              return { ...acc, balance: acc.balance - tx.amount };
            }
            if (tx.type === 'transfer') {
              if (acc.id === tx.accountId) return { ...acc, balance: acc.balance + tx.amount };
              if (acc.id === tx.toAccountId) return { ...acc, balance: acc.balance - tx.amount };
            }
            return acc;
          });

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
          };
        });
      },

      // -------------------------------------------------------------
      // Account Actions
      // -------------------------------------------------------------
      addAccount: (accData) => {
        const newAcc: Account = {
          ...accData,
          id: `acc-${Date.now()}`,
        };
        set((state) => ({ accounts: [...state.accounts, newAcc] }));
      },

      updateAccountBalance: (id, newBalance) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, balance: newBalance } : a)),
        }));
      },

      deleteAccount: (id) => {
        set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
      },

      // -------------------------------------------------------------
      // Budget Actions
      // -------------------------------------------------------------
      addBudget: (bData) => {
        const newB: Budget = { ...bData, id: `budget-${Date.now()}` };
        set((state) => ({ budgets: [...state.budgets, newB] }));
      },

      updateBudget: (id, amount) => {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? { ...b, amount } : b)),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
      },

      // -------------------------------------------------------------
      // Bill Actions
      // -------------------------------------------------------------
      addBill: (billData) => {
        const newBill: Bill = {
          ...billData,
          id: `bill-${Date.now()}`,
          isPaid: false,
        };
        set((state) => ({ bills: [...state.bills, newBill] }));
        try {
          const { NotificationService } = require('@/core/utils/notification-service');
          NotificationService.scheduleBillReminder(newBill.id, newBill.title, newBill.amount, newBill.dueDate);
        } catch (e) {
          console.warn('[WealthStore] Notification schedule note:', e);
        }
      },

      payBill: (billId, accountId) => {
        const bill = get().bills.find((b) => b.id === billId);
        if (!bill || bill.isPaid) return;

        // Create transaction
        get().addTransaction({
          type: 'expense',
          title: `Bill Paid: ${bill.title}`,
          amount: bill.amount,
          categoryId: bill.categoryId,
          accountId,
          date: new Date().toISOString().slice(0, 10),
          paymentMethod: 'UPI',
          merchant: bill.title,
        });

        // Mark bill as paid
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === billId ? { ...b, isPaid: true, paidDate: new Date().toISOString().slice(0, 10) } : b
          ),
        }));
      },

      deleteBill: (id) => {
        set((state) => ({ bills: state.bills.filter((b) => b.id !== id) }));
        try {
          const { NotificationService } = require('@/core/utils/notification-service');
          NotificationService.cancelReminder(`bill_reminder_${id}`);
        } catch (e) {
          console.warn('[WealthStore] Notification cancel note:', e);
        }
      },

      // -------------------------------------------------------------
      // Savings Goal Actions
      // -------------------------------------------------------------
      addGoal: (goalData) => {
        const newGoal: SavingsGoal = {
          ...goalData,
          id: `goal-${Date.now()}`,
          currentAmount: 0,
        };
        set((state) => ({ savingsGoals: [...state.savingsGoals, newGoal] }));
      },

      depositToGoal: (goalId, amount, accountId) => {
        const goal = get().savingsGoals.find((g) => g.id === goalId);
        if (!goal) return;

        // Deduct from source account via transfer
        get().addTransaction({
          type: 'transfer',
          title: `Goal Deposit: ${goal.name}`,
          amount,
          categoryId: 'investments',
          accountId,
          date: new Date().toISOString().slice(0, 10),
          paymentMethod: 'Net Banking',
        });

        // Increment goal
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) =>
            g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) }));
      },

      withdrawFromGoal: (goalId, amount, accountId, reason) => {
        const goal = get().savingsGoals.find((g) => g.id === goalId);
        if (!goal || goal.currentAmount < amount) return;

        // Credit to target account via income transaction
        get().addTransaction({
          type: 'income',
          title: `Goal Withdrawal: ${goal.name}${reason ? ` (${reason})` : ''}`,
          amount,
          categoryId: 'investments',
          accountId,
          date: new Date().toISOString().slice(0, 10),
          paymentMethod: 'Net Banking',
        });

        // Deduct from goal
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) =>
            g.id === goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) } : g
          ),
        }));
      },

      // -------------------------------------------------------------
      // Friends Khata (Peer Debt) Actions
      // -------------------------------------------------------------
      addPeerDebt: (debtData) => {
        const newDebt: PeerDebt = {
          ...debtData,
          id: `debt-${Date.now()}`,
          paidAmount: 0,
          status: 'pending',
        };
        set((state) => ({ peerDebts: [newDebt, ...state.peerDebts] }));
      },

      settlePeerDebt: (id) => {
        set((state) => ({
          peerDebts: state.peerDebts.map((d) =>
            d.id === id
              ? {
                  ...d,
                  paidAmount: d.amount,
                  status: 'settled',
                  settledDate: new Date().toISOString().slice(0, 10),
                }
              : d
          ),
        }));
      },

      recordPeerDebtPartialPayment: (id, partialAmount) => {
        if (partialAmount <= 0) return;
        set((state) => ({
          peerDebts: state.peerDebts.map((d) => {
            if (d.id !== id) return d;
            const currentPaid = d.paidAmount || 0;
            const newPaid = currentPaid + partialAmount;
            const isSettled = newPaid >= d.amount;
            return {
              ...d,
              paidAmount: Math.min(d.amount, newPaid),
              status: isSettled ? 'settled' : 'pending',
              settledDate: isSettled ? new Date().toISOString().slice(0, 10) : d.settledDate,
            };
          }),
        }));
      },

      deletePeerDebt: (id) => {
        set((state) => ({ peerDebts: state.peerDebts.filter((d) => d.id !== id) }));
      },

      // -------------------------------------------------------------
      // Legacy Vatti / Gold / Trips Actions
      // -------------------------------------------------------------
      setMonthlySalary: (amount) => set({ monthlySalary: amount }),
      setGoldRate: (rate) => set({ currentGoldRatePerGram: rate }),

      addLoan: ({ lenderName, lenderPhone, principalAmount, monthlyRatePercent, dueDayOfMonth }) => {
        const { monthlyInterestAmount } = calculateMonthlyVatti(principalAmount, monthlyRatePercent);
        const newLoan: LoanItem = {
          id: `loan-${Date.now()}`,
          lenderName,
          lenderPhone,
          principalAmount,
          initialPrincipal: principalAmount,
          monthlyRatePercent,
          monthlyInterestAmount,
          dueDayOfMonth,
          startDate: new Date().toISOString().slice(0, 10),
          lifetimeInterestPaid: 0,
          status: 'active',
          history: [],
        };
        set((state) => ({ loans: [newLoan, ...state.loans] }));
      },

      payMonthlyVatti: (loanId, customAmount) => {
        set((state) => ({
          loans: state.loans.map((loan) => {
            if (loan.id !== loanId) return loan;
            const amountToPay = customAmount || loan.monthlyInterestAmount;
            return {
              ...loan,
              lifetimeInterestPaid: loan.lifetimeInterestPaid + amountToPay,
              history: [
                {
                  id: `pay-${Date.now()}`,
                  type: 'interest',
                  amount: amountToPay,
                  date: new Date().toISOString().slice(0, 10),
                  note: `Paid monthly interest for ${new Date().toLocaleString('default', { month: 'short' })}`,
                },
                ...loan.history,
              ],
            };
          }),
        }));
      },

      partRepayPrincipal: (loanId, partPaymentAmount) => {
        set((state) => ({
          loans: state.loans.map((loan) => {
            if (loan.id !== loanId) return loan;
            const { newPrincipal, newMonthlyInterest } = recalculateAfterPartPayment(
              loan.principalAmount,
              partPaymentAmount,
              loan.monthlyRatePercent
            );
            return {
              ...loan,
              principalAmount: newPrincipal,
              monthlyInterestAmount: newMonthlyInterest,
              status: newPrincipal <= 0 ? 'settled' : 'active',
              history: [
                {
                  id: `part-${Date.now()}`,
                  type: 'principal',
                  amount: partPaymentAmount,
                  date: new Date().toISOString().slice(0, 10),
                  note: `Principal Repayment. Remaining: ₹${newPrincipal.toLocaleString('en-IN')}`,
                },
                ...loan.history,
              ],
            };
          }),
        }));
      },

      deleteLoan: (loanId) => {
        set((state) => ({ loans: state.loans.filter((l) => l.id !== loanId) }));
      },

      addGoldItem: (item) => {
        const sovereigns = Number((item.weightGrams / 8).toFixed(2));
        const newGold: GoldHolding = {
          ...item,
          id: `gold-${Date.now()}`,
          sovereigns,
        };
        set((state) => ({ goldItems: [newGold, ...state.goldItems] }));
      },

      deleteGoldItem: (id) => {
        set((state) => ({ goldItems: state.goldItems.filter((g) => g.id !== id) }));
      },

      addTrip: (name, budget, members, initialContributions = [], tripType = 'group') => {
        const isSolo = tripType === 'solo';
        const finalMembers = isSolo ? ['Me (Self)'] : members.length > 0 ? members : ['Me (Self)'];
        const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          name,
          budget,
          tripType,
          members: finalMembers,
          startDate: new Date().toISOString().slice(0, 10),
          contributions: isSolo
            ? []
            : initialContributions.map((c, idx) => ({
                id: `tc-${Date.now()}-${idx}`,
                memberName: c.memberName,
                amount: c.amount,
                date: new Date().toISOString().slice(0, 10),
              })),
          expenses: [],
          status: 'ongoing',
        };
        set((state) => ({ trips: [newTrip, ...state.trips] }));
      },

      deleteTrip: (id) => {
        set((state) => ({ trips: state.trips.filter((t) => t.id !== id) }));
      },

      addTripContribution: (tripId, memberName, amount) => {
        const newContrib: TripContribution = {
          id: `tc-${Date.now()}`,
          memberName,
          amount,
          date: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, contributions: [newContrib, ...t.contributions] } : t
          ),
        }));
      },

      addTripExpense: (tripId, expense) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, expenses: [{ ...expense, id: `te-${Date.now()}` }, ...t.expenses] } : t
          ),
        }));
      },

      deleteTripExpense: (tripId, expenseId) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) } : t
          ),
        }));
      },

      addTripMember: (tripId, memberName) => {
        const trimmed = memberName.trim();
        if (!trimmed) return;
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId && !t.members.includes(trimmed)
              ? { ...t, members: [...t.members, trimmed] }
              : t
          ),
        }));
      },

      completeTrip: (tripId) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, status: 'completed' } : t
          ),
        }));
      },

      toggleTripStatus: (tripId) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, status: t.status === 'completed' ? 'ongoing' : 'completed' }
              : t
          ),
        }));
      },

      addGroceryItem: (name, approxPrice, category) => {
        const newItem: GroceryItem = {
          id: `gr-${Date.now()}`,
          name,
          approxPrice,
          isPurchased: false,
          category,
        };
        set((state) => ({ groceries: [newItem, ...state.groceries] }));
      },

      toggleGroceryItem: (id) => {
        set((state) => ({
          groceries: state.groceries.map((item) =>
            item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
          ),
        }));
      },

      clearPurchasedGroceries: () => {
        set((state) => ({ groceries: state.groceries.filter((g) => !g.isPurchased) }));
      },

      restoreBackupData: (backupJson: string) => {
        try {
          const parsed = JSON.parse(backupJson);
          if (!parsed || typeof parsed !== 'object') return false;

          set({
            accounts: Array.isArray(parsed.accounts) ? parsed.accounts : get().accounts,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : get().transactions,
            budgets: Array.isArray(parsed.budgets) ? parsed.budgets : get().budgets,
            bills: Array.isArray(parsed.bills) ? parsed.bills : get().bills,
            savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : get().savingsGoals,
            loans: Array.isArray(parsed.loans) ? parsed.loans : get().loans,
            goldItems: Array.isArray(parsed.goldItems) ? parsed.goldItems : get().goldItems,
            trips: Array.isArray(parsed.trips) ? parsed.trips : get().trips,
            peerDebts: Array.isArray(parsed.peerDebts) ? parsed.peerDebts : get().peerDebts,
            monthlySalary:
              typeof parsed.monthlySalary === 'number' ? parsed.monthlySalary : get().monthlySalary,
          });
          return true;
        } catch {
          return false;
        }
      },

      resetAllData: () => {
        set({
          accounts: INITIAL_ACCOUNTS,
          transactions: [],
          budgets: [],
          bills: [],
          savingsGoals: [],
          monthlySalary: 0,
          loans: [],
          goldItems: [],
          trips: [],
          peerDebts: [],
          groceries: [],
        });
      },
    }),
    {
      name: 'personal-app:finance-store-fresh-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
