import { InterviewEvent } from './event';

export interface SecretaryAvailability {
  date: Date;
  isAvailable: boolean;
  reason?: string;
}

export interface SecretaryWorkload {
  upcomingEvents: {
    panels: number;
    carousels: number;
    total: number;
    restViolations: {
      dates: Date[];
      details: string[];
    };
  };
}

export interface Secretary {
  id: string;
  name: string;
  availability: SecretaryAvailability[];
  workload: SecretaryWorkload;
}