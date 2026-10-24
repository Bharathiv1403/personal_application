import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateMonthlyVatti, calculateGoldWorth, recalculateAfterPartPayment } from '@/core/utils/vatti';

export interface LoanItem {
  id: string;
  lenderName: string;
  lenderPhone?: string;
  principalAmount: number;
  initialPrincipal: number;
  monthlyRatePercent: number; // e.g. 2 for 2% (2 rooba vatti)
  monthlyInterestAmount: number;
  dueDayOfMonth: number; // e.g. 5 for 5th of each month
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
  name: string; // e.g. "22K Sovereign Chain", "Wedding Ring", "Gold Coin"
  weightGrams: number;
  sovereigns: number; // Grams / 8
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

interface WealthState {
  // Monthly Cash Flow
  monthlySalary: number;
  currentGoldRatePerGram: number;
  
  // Collections
  loans: LoanItem[];
  goldItems: GoldHolding[];
  trips: Trip[];
  groceries: GroceryItem[];

  // Actions - Salary & Gold Rate
  setMonthlySalary: (amount: number) => void;
  setGoldRate: (rate: number) => void;

  // Actions - Loans / Vatti Engine
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

  // Actions - Gold
  addGoldItem: (item: Omit<GoldHolding, 'id' | 'sovereigns'>) => void;
  deleteGoldItem: (id: string) => void;

  // Actions - Trips
  addTrip: (name: string, budget: number, members: string[]) => void;
  addTripExpense: (tripId: string, expense: Omit<TripExpense, 'id'>) => void;

  // Actions - Groceries
  addGroceryItem: (name: string, approxPrice: number, category: GroceryItem['category']) => void;
  toggleGroceryItem: (id: string) => void;
  clearPurchasedGroceries: () => void;
}

export const useWealthStore = create<WealthState>()(
  persist(
    (set, get) => ({
      monthlySalary: 0,
      currentGoldRatePerGram: 7850,

      // Clean real empty collections - no mock loans, trips, or groceries
      loans: [],
      goldItems: [],
      trips: [],
      groceries: [],

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
            t.id === tripId
              ? { ...t, expenses: [{ ...expense, id: `te-${Date.now()}` }, ...t.expenses] }
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
    }),
    {
      name: 'personal-app:wealth-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
