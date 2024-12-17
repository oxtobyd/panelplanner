export type { InterviewType } from './event';

export type Venue = {
  id: string;
  name: string;
  isOnline: boolean;
  capacity: number;
};

export type Secretary = {
  id: string;
  name: string;
  availability: Date[];
};

export type InterviewEvent = {
  id: string;
  type: InterviewType;
  panelNumber: string;
  date: Date;
  weekNumber: number;
  venue: Venue;
  secretary: Secretary;
  estimatedAttendance: number;
  actualAttendance: number;
  notes?: string;
  status: 'Confirmed' | 'Booked' | 'Available';
  impactedSecretaryIds?: number[];
};