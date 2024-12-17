import { Secretary, SecretaryAvailability, InterviewEvent } from '../types';

const MINIMUM_REST_DAYS = 7; // Minimum days between events for a secretary

export function checkSecretaryAvailability(
  secretary: Secretary,
  date: Date
): boolean {
  const availability = secretary.availability.find(
    (a) => a.date.toDateString() === date.toDateString()
  );
  return availability?.isAvailable ?? true;
}

export function calculateRestPeriodViolations(
  secretary: Secretary,
  events: InterviewEvent[]
): Date[] {
  const secretaryEvents = events
    .filter((event) => event.secretary.id === secretary.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const violations: Date[] = [];
  
  for (let i = 1; i < secretaryEvents.length; i++) {
    const daysBetween = Math.floor(
      (secretaryEvents[i].date.getTime() - secretaryEvents[i - 1].date.getTime()) /
      (1000 * 60 * 60 * 24)
    );
    
    if (daysBetween < MINIMUM_REST_DAYS) {
      violations.push(secretaryEvents[i].date);
    }
  }
  
  return violations;
}