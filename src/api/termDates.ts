import { api } from './client';

export interface TermDate {
  id: number;
  academic_year: number;
  term_name: string;
  start_date: string;
  end_date: string;
  type: 'term' | 'holiday';
  region: string;
}

export const termDatesApi = {
  getTermDates: api.getTermDates,
  createTermDate: api.createTermDate,
  updateTermDate: api.updateTermDate,
  deleteTermDate: api.deleteTermDate
}; 