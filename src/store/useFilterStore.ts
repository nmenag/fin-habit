import { create } from 'zustand';
import {
  DateRange,
  FilterType,
  getAllTimeRange,
  getMonthRange,
  getRangeForType,
} from '../utils/dateFilters';

interface FilterState {
  selectedRange: DateRange;
  isDefaultFilter: boolean;
  setFilter: (type: FilterType, customStart?: Date, customEnd?: Date) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
  clearFilter: () => void;
  setDefaultFilter: (type: FilterType) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedRange: getMonthRange(),
  isDefaultFilter: true,

  setFilter: (type, customStart, customEnd) => {
    set({
      selectedRange: getRangeForType(type, customStart, customEnd),
      isDefaultFilter: false,
    });
  },

  setCustomRange: (startDate, endDate) => {
    set({
      selectedRange: { type: 'custom', startDate, endDate },
      isDefaultFilter: false,
    });
  },

  clearFilter: () => {
    set({
      selectedRange: getAllTimeRange(),
      isDefaultFilter: false,
    });
  },

  setDefaultFilter: (type) => {
    set({
      selectedRange: getRangeForType(type),
      isDefaultFilter: true,
    });
  },
}));
