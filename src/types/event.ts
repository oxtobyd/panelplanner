import { Venue } from './venue';
import { Secretary } from './secretary';

export type InterviewType = 'Panel' | 'Carousel' | 'TeamResidential' | 'Training' | 'Conference' | 'CandidatesPanel';

export interface InterviewEvent {
  id: string;
  type: InterviewType;
  panelNumber: string;
  date: Date;
  time?: string;
  weekNumber: number;
  season: string;
  venue: Venue;
  secretary: Secretary;
  estimatedAttendance: number;
  actualAttendance: number;
  reportDate: Date;
  reportDeadline: Date;
  notes?: string;
  status: 'Confirmed' | 'Booked' | 'Available';
  impactedSecretaryIds?: number[];
}