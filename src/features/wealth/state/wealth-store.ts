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

export interface TripExpense {
  id: string;
  title: string;
  category: 'travel' | 'stay' | 'food' | 'activity' | 'shopping';
  amount: number;
  paidBy: string;
  date: string;
}

export interface Trip {
  id: string;
  name: string;
  budget: number;
  members: string[];
  expenses: TripExpense[];
  status: 'ongoing' | 'completed';
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
    id: 'acc-sbi',
    name: 'SBI Primary Salary',
    type: 'bank',
    balance: 68450,
    accountNumberMasked: '•••• 4892',
    icon: 'business',
    color: '#2563EB',
  },
  {
    id: 'acc-hdfc',
    name: 'HDFC Savings',
    type: 'bank',
    balance: 34200,
    accountNumberMasked: '•••• 8134',
    icon: 'wallet',
    color: '#059669',
  },
  {
    id: 'acc-cash',
    name: 'Cash in Hand',
    type: 'cash',
    balance: 4500,
    icon: 'cash',
    color: '#D97706',
  },
  {
    id: 'acc-card',
    name: 'HDFC Millennia Card',
    type: 'credit_card',
    balance: 12350, // Outstanding
    creditLimit: 150000,
    accountNumberMasked: '•••• 7029',
    icon: 'card',
    color: '#DC2626',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b-overall', name: 'Overall Monthly Budget', amount: 50000, period: 'monthly', alertThresholdPercent: 80 },
  { id: 'b-food', name: 'Food & Dining', categoryId: 'food', amount: 8000, period: 'monthly', alertThresholdPercent: 80 },
  { id: 'b-shopping', name: 'Shopping & Gear', categoryId: 'shopping', amount: 6000, period: 'monthly', alertThresholdPercent: 80 },
  { id: 'b-transport', name: 'Fuel & Commute', categoryId: 'transport', amount: 4000, period: 'monthly', alertThresholdPercent: 80 },
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'bill-1',
    title: 'TNEB Electricity Bill',
    amount: 1850,
    categoryId: 'utilities',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    isPaid: false,
    recurring: 'monthly',
  },
  {
    id: 'bill-2',
    title: 'Airtel Xstream Fiber',
    amount: 1179,
    categoryId: 'utilities',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    isPaid: false,
    recurring: 'monthly',
  },
  {
    id: 'bill-3',
    title: 'Netflix Premium & Prime',
    amount: 799,
    categoryId: 'entertainment',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    isPaid: false,
    recurring: 'monthly',
  },
];

export const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Reserve (6 Months)',
    targetAmount: 150000,
    currentAmount: 85000,
    targetDate: '2026-12-31',
    categoryIcon: 'shield-checkmark',
    color: '#10B981',
  },
  {
    id: 'goal-2',
    name: 'MacBook Pro M3 Max',
    targetAmount: 180000,
    currentAmount: 72000,
    targetDate: '2026-11-30',
    categoryIcon: 'laptop',
    color: '#3B82F6',
  },
];

const getTodayDate = () => new Date().toISOString().slice(0, 10);

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    title: 'October Salary Inflow',
    amount: 120000,
    categoryId: 'salary',
    accountId: 'acc-sbi',
    date: getTodayDate(),
    paymentMethod: 'Net Banking',
    merchant: 'Sagasoft Technologies',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tx-2',
    type: 'expense',
    title: 'Monthly Organic Groceries',
    amount: 3450,
    categoryId: 'groceries',
    accountId: 'acc-sbi',
    date: getTodayDate(),
    paymentMethod: 'UPI',
    merchant: 'Reliance Smart Superstore',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'tx-3',
    type: 'expense',
    title: 'HP Auto Fuel Tank Refill',
    amount: 800,
    categoryId: 'transport',
    accountId: 'acc-sbi',
    date: getTodayDate(),
    paymentMethod: 'UPI',
    merchant: 'HP Fuel Station',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'tx-4',
    type: 'expense',
    title: 'Weekend Team Dinner & Treats',
    amount: 1250,
    categoryId: 'food',
    accountId: 'acc-hdfc',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    paymentMethod: 'UPI',
    merchant: 'Anjappar Chettinad',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'tx-5',
    type: 'expense',
    title: 'Mechanical Keyboard & Accessories',
    amount: 4200,
    categoryId: 'shopping',
    accountId: 'acc-card',
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    paymentMethod: 'Card',
    merchant: 'Amazon India',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

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

  // Transaction Management
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
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
  deleteGoal: (id: string) => void;

  // Legacy Actions
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
  addTrip: (name: string, budget: number, members: string[]) => void;
  addTripExpense: (tripId: string, expense: Omit<TripExpense, 'id'>) => void;
  addGroceryItem: (name: string, approxPrice: number, category: GroceryItem['category']) => void;
  toggleGroceryItem: (id: string) => void;
  clearPurchasedGroceries: () => void;
}

export const useWealthStore = create<WealthState>()(
  persist(
    (set, get) => ({
      // Initialize with Seed Data
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      categories: DEFAULT_CATEGORIES,
      budgets: INITIAL_BUDGETS,
      bills: INITIAL_BILLS,
      savingsGoals: INITIAL_GOALS,

      monthlySalary: 120000,
      currentGoldRatePerGram: 7850,
      loans: [],
      goldItems: [],
      trips: [],
      groceries: [],

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

      addTrip: (name, budget, members) => {
        const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          name,
          budget,
          members,
          expenses: [],
          status: 'ongoing',
        };
        set((state) => ({ trips: [newTrip, ...state.trips] }));
      },

      addTripExpense: (tripId, expense) => {
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId ? { ...t, expenses: [{ ...expense, id: `te-${Date.now()}` }, ...t.expenses] } : t
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
    }),
    {
      name: 'personal-app:finance-store-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
