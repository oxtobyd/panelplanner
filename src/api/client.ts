import { InterviewEvent, Secretary, Venue } from '../types';
import { TermDate } from './termDates';

const API_URL = 'http://localhost:3001/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export interface HistoricalAttendanceData {
  events: number;
  total_candidates: number;
  avg_per_event: number;
}

export const api = {
  getEvents: async () => {
    const response = await fetch(`${API_URL}/events`);
    return handleResponse(response);
  },

  getSecretaries: async () => {
    const response = await fetch(`${API_URL}/secretaries`);
    return handleResponse(response);
  },

  getVenues: async () => {
    const response = await fetch(`${API_URL}/venues`);
    return handleResponse(response);
  },

  createEvent: async (event: Omit<InterviewEvent, 'id'>) => {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    return handleResponse(response);
  },

  updateEvent: async (event: InterviewEvent) => {
    const response = await fetch(`${API_URL}/events/${event.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    return handleResponse(response);
  },

  deleteEvent: async (id: string) => {
    await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE'
    });
  },

  getTermDates: async (year?: number) => {
    const response = await fetch(`${API_URL}/term-dates${year ? `?year=${year}` : ''}`);
    return handleResponse(response);
  },

  createTermDate: async (termDate: Omit<TermDate, 'id'>) => {
    const response = await fetch(`${API_URL}/term-dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(termDate),
    });
    return handleResponse(response);
  },

  updateTermDate: async (id: number, termDate: Partial<TermDate>) => {
    const response = await fetch(`${API_URL}/term-dates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(termDate),
    });
    return handleResponse(response);
  },

  deleteTermDate: async (id: number) => {
    const response = await fetch(`${API_URL}/term-dates/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  getHistoricalAttendance: async (weekNumber: number, panelType: string): Promise<HistoricalAttendanceData> => {
    const response = await fetch(
      `${API_URL}/events/historical-attendance?weekNumber=${weekNumber}&panelType=${panelType}`
    );
    return handleResponse(response);
  },
}; 