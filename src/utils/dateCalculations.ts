// src/utils/dateCalculations.ts
import { addDays, format, subWeeks } from 'date-fns';

interface BankHoliday {
  title: string;
  date: string;
  notes: string;
  bunting: boolean;
}

interface BankHolidayResponse {
  "england-and-wales": {
    division: string;
    events: BankHoliday[];
  };
}

let bankHolidayCache: string[] = [];

// Fetch and cache bank holidays
export const fetchBankHolidays = async (): Promise<string[]> => {
  if (bankHolidayCache.length > 0) {
    return bankHolidayCache;
  }

  try {
    const response = await fetch('https://www.gov.uk/bank-holidays.json');
    const data: BankHolidayResponse = await response.json();
    
    bankHolidayCache = data['england-and-wales'].events.map(holiday => 
      format(new Date(holiday.date), 'yyyy-MM-dd')
    );
    
    return bankHolidayCache;
  } catch (error) {
    console.error('Failed to fetch bank holidays:', error);
    return [];
  }
};

// Check if date is a weekend
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

// Check if date is a bank holiday
export const isBankHoliday = (date: string): boolean => {
  return bankHolidayCache.includes(date);
};

// Add working days to a date
export const addWorkingDays = async (date: Date, days: number): Promise<Date> => {
  // Ensure bank holidays are loaded
  if (bankHolidayCache.length === 0) {
    await fetchBankHolidays();
  }

  let currentDate = date;
  let remainingDays = days;

  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    const dateString = format(currentDate, 'yyyy-MM-dd');
    
    if (!isWeekend(currentDate) && !isBankHoliday(dateString)) {
      remainingDays--;
    }
  }

  return currentDate;
};

// Calculate report due date
export const calculateReportDueDate = async (date: Date, type: 'Panel' | 'Carousel'): Promise<Date> => {
  if (type === 'Carousel') {
    // For Carousels: event date + 5 working days
    return addWorkingDays(date, 5);
  } else {
    // For Panels: (event date + 2 days) + 5 working days
    const panelEndDate = addDays(date, 2);
    return addWorkingDays(panelEndDate, 5);
  }
};

// Calculate paperwork due date
export const calculatePaperworkDueDate = (date: Date, type: InterviewType): Date => {
  const eventDate = new Date(date);
  
  if (type === 'Carousel') {
    // For Carousels: event date - 4 weeks
    return subWeeks(eventDate, 4);
  } else if (type === 'Panel') {
    // For Panels: event date - 6 weeks
    return subWeeks(eventDate, 6);
  }
  
  // Default to 4 weeks for other types
  return subWeeks(eventDate, 4);
};