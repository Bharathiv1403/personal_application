import { create } from 'zustand';
import { DailyCalendarData, TamilCalendarService } from '../services/tamil-calendar-service';

interface TamilCalendarState {
  isOpen: boolean;
  selectedDate: Date;
  calendarData: DailyCalendarData;
  openModal: (initialDate?: Date) => void;
  closeModal: () => void;
  nextDay: () => void;
  prevDay: () => void;
  jumpToToday: () => void;
  setDate: (date: Date) => void;
}

const initialDate = new Date();
const initialData = TamilCalendarService.getDailyCalendar(initialDate);

export const useTamilCalendarStore = create<TamilCalendarState>((set, get) => ({
  isOpen: false,
  selectedDate: initialDate,
  calendarData: initialData,

  openModal: (initialDate?: Date) => {
    const targetDate = initialDate || new Date();
    const data = TamilCalendarService.getDailyCalendar(targetDate);
    set({
      isOpen: true,
      selectedDate: targetDate,
      calendarData: data,
    });
  },

  closeModal: () => {
    set({ isOpen: false });
  },

  nextDay: () => {
    const current = new Date(get().selectedDate);
    current.setDate(current.getDate() + 1);
    const data = TamilCalendarService.getDailyCalendar(current);
    set({
      selectedDate: current,
      calendarData: data,
    });
  },

  prevDay: () => {
    const current = new Date(get().selectedDate);
    current.setDate(current.getDate() - 1);
    const data = TamilCalendarService.getDailyCalendar(current);
    set({
      selectedDate: current,
      calendarData: data,
    });
  },

  jumpToToday: () => {
    const today = new Date();
    const data = TamilCalendarService.getDailyCalendar(today);
    set({
      selectedDate: today,
      calendarData: data,
    });
  },

  setDate: (date: Date) => {
    const data = TamilCalendarService.getDailyCalendar(date);
    set({
      selectedDate: date,
      calendarData: data,
    });
  },
}));

