import { create } from 'zustand';
import {
  DateRange,
  FilterType,
  getAllTimeRange,
  getMonthRange,
  getRangeForType,
} from '../utils/dateFilters';
import { useStore } from './useStore';

interface FilterState {
  selectedRange: DateRange;
  isDefaultFilter: boolean;
  setFilter: (
    type: FilterType,
    customStart?: Date,
    customEnd?: Date,
    cycleStartDay?: number,
  ) => void;
  setCustomRange: (startDate: Date, endDate: Date) => void;
  clearFilter: () => void;
  setDefaultFilter: (type: FilterType, cycleStartDay?: number) => void;
  updateCycleStartDay: (cycleStartDay: number) => void;
}

const getCycleDay = (override?: number): number => {
  if (override !== undefined) return override;
  try {
    const day = useStore.getState().cycleStartDay;
    return typeof day === 'number' ? day : 1;
  } catch {
    return 1;
  }
};

export const useFilterStore = create<FilterState>((set, get) => ({
  selectedRange: getMonthRange(1),
  isDefaultFilter: true,

  setFilter: (type, customStart, customEnd, cycleStartDay) => {
    const day = getCycleDay(cycleStartDay);
    set({
      selectedRange: getRangeForType(type, customStart, customEnd, day),
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

  setDefaultFilter: (type, cycleStartDay) => {
    const day = getCycleDay(cycleStartDay);
    set({
      selectedRange: getRangeForType(type, undefined, undefined, day),
      isDefaultFilter: true,
    });
  },

  updateCycleStartDay: (cycleStartDay) => {
    const { selectedRange } = get();
    if (selectedRange.type === 'month' || selectedRange.type === 'lastMonth') {
      set({
        selectedRange: getRangeForType(
          selectedRange.type,
          undefined,
          undefined,
          cycleStartDay,
        ),
      });
    }
  },
}));
