import { create } from 'zustand';
import {
  DailyCalendarData,
  MonthCalendarData,
  TamilCalendarService,
} from '../services/tamil-calendar-service';

export type CalendarViewMode = 'daily' | 'month';

interface TamilCalendarState {
  isOpen: boolean;
  viewMode: CalendarViewMode;
  selectedDate: Date;
  calendarData: DailyCalendarData;
  monthViewYear: number;
  monthViewMonth: number;
  monthCalendarData: MonthCalendarData;

  // Actions
  openModal: (initialDate?: Date, initialView?: CalendarViewMode) => void;
  closeModal: () => void;
  setViewMode: (mode: CalendarViewMode) => void;
  nextDay: () => void;
  prevDay: () => void;
  nextMonth: () => void;
  prevMonth: () => void;
  selectDateFromMonth: (date: Date, switchToDaily?: boolean) => void;
  jumpToToday: () => void;
  setDate: (date: Date) => void;
}

const initialDate = new Date();
const initialData = TamilCalendarService.getDailyCalendar(initialDate);
const initialMonthData = TamilCalendarService.getMonthCalendar(
  initialDate.getFullYear(),
  initialDate.getMonth()
);

export const useTamilCalendarStore = create<TamilCalendarState>((set, get) => ({
  isOpen: false,
  viewMode: 'daily',
  selectedDate: initialDate,
  calendarData: initialData,
  monthViewYear: initialDate.getFullYear(),
  monthViewMonth: initialDate.getMonth(),
  monthCalendarData: initialMonthData,

  openModal: (initialDate?: Date, initialView: CalendarViewMode = 'daily') => {
    const targetDate = initialDate || new Date();
    const data = TamilCalendarService.getDailyCalendar(targetDate);
    const mData = TamilCalendarService.getMonthCalendar(
      targetDate.getFullYear(),
      targetDate.getMonth()
    );
    set({
      isOpen: true,
      viewMode: initialView,
      selectedDate: targetDate,
      calendarData: data,
      monthViewYear: targetDate.getFullYear(),
      monthViewMonth: targetDate.getMonth(),
      monthCalendarData: mData,
    });
  },

  closeModal: () => {
    set({ isOpen: false });
  },

  setViewMode: (mode: CalendarViewMode) => {
    set({ viewMode: mode });
  },

  nextDay: () => {
    const current = new Date(get().selectedDate);
    current.setDate(current.getDate() + 1);
    const data = TamilCalendarService.getDailyCalendar(current);

    // If day rolls into another month, sync month view too
    const currentMonth = get().monthViewMonth;
    const currentYear = get().monthViewYear;
    let mData = get().monthCalendarData;
    let mYear = currentYear;
    let mMonth = currentMonth;

    if (current.getMonth() !== currentMonth || current.getFullYear() !== currentYear) {
      mYear = current.getFullYear();
      mMonth = current.getMonth();
      mData = TamilCalendarService.getMonthCalendar(mYear, mMonth);
    }

    set({
      selectedDate: current,
      calendarData: data,
      monthViewYear: mYear,
      monthViewMonth: mMonth,
      monthCalendarData: mData,
    });
  },

  prevDay: () => {
    const current = new Date(get().selectedDate);
    current.setDate(current.getDate() - 1);
    const data = TamilCalendarService.getDailyCalendar(current);

    const currentMonth = get().monthViewMonth;
    const currentYear = get().monthViewYear;
    let mData = get().monthCalendarData;
    let mYear = currentYear;
    let mMonth = currentMonth;

    if (current.getMonth() !== currentMonth || current.getFullYear() !== currentYear) {
      mYear = current.getFullYear();
      mMonth = current.getMonth();
      mData = TamilCalendarService.getMonthCalendar(mYear, mMonth);
    }

    set({
      selectedDate: current,
      calendarData: data,
      monthViewYear: mYear,
      monthViewMonth: mMonth,
      monthCalendarData: mData,
    });
  },

  nextMonth: () => {
    const currentMonth = get().monthViewMonth;
    const currentYear = get().monthViewYear;
    const nextDate = new Date(currentYear, currentMonth + 1, 1);
    const nextYear = nextDate.getFullYear();
    const nextM = nextDate.getMonth();
    const mData = TamilCalendarService.getMonthCalendar(nextYear, nextM);

    set({
      monthViewYear: nextYear,
      monthViewMonth: nextM,
      monthCalendarData: mData,
    });
  },

  prevMonth: () => {
    const currentMonth = get().monthViewMonth;
    const currentYear = get().monthViewYear;
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevM = prevDate.getMonth();
    const mData = TamilCalendarService.getMonthCalendar(prevYear, prevM);

    set({
      monthViewYear: prevYear,
      monthViewMonth: prevM,
      monthCalendarData: mData,
    });
  },

  selectDateFromMonth: (date: Date, switchToDaily = false) => {
    const data = TamilCalendarService.getDailyCalendar(date);
    const currentYear = get().monthViewYear;
    const currentMonth = get().monthViewMonth;

    let mData = get().monthCalendarData;
    let mYear = currentYear;
    let mMonth = currentMonth;

    if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
      mYear = date.getFullYear();
      mMonth = date.getMonth();
      mData = TamilCalendarService.getMonthCalendar(mYear, mMonth);
    }

    set({
      selectedDate: date,
      calendarData: data,
      monthViewYear: mYear,
      monthViewMonth: mMonth,
      monthCalendarData: mData,
      viewMode: switchToDaily ? 'daily' : get().viewMode,
    });
  },

  jumpToToday: () => {
    const today = new Date();
    const data = TamilCalendarService.getDailyCalendar(today);
    const mData = TamilCalendarService.getMonthCalendar(
      today.getFullYear(),
      today.getMonth()
    );
    set({
      selectedDate: today,
      calendarData: data,
      monthViewYear: today.getFullYear(),
      monthViewMonth: today.getMonth(),
      monthCalendarData: mData,
    });
  },

  setDate: (date: Date) => {
    const data = TamilCalendarService.getDailyCalendar(date);
    const mData = TamilCalendarService.getMonthCalendar(
      date.getFullYear(),
      date.getMonth()
    );
    set({
      selectedDate: date,
      calendarData: data,
      monthViewYear: date.getFullYear(),
      monthViewMonth: date.getMonth(),
      monthCalendarData: mData,
    });
  },
}));
