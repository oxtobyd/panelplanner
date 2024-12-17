import { InterviewEvent, Secretary, Venue } from '../types';

export const sampleSecretaries: Secretary[] = [
  {
    id: '1',
    name: 'Gary',
    availability: [],
    workload: {
      upcomingEvents: 0,
      restPeriodViolations: []
    }
  },
  {
    id: '2',
    name: 'Chris',
    availability: [],
    workload: {
      upcomingEvents: 0,
      restPeriodViolations: []
    }
  },
  {
    id: '3',
    name: 'David',
    availability: [],
    workload: {
      upcomingEvents: 0,
      restPeriodViolations: []
    }
  }
];

export const sampleVenues: Venue[] = [
  { id: '1', name: 'Pleshey', isOnline: false, capacity: 30 },
  { id: '2', name: 'Zoom', isOnline: true, capacity: 100 },
  { id: '3', name: 'Woking', isOnline: false, capacity: 25 },
  { id: '4', name: 'Foxhill', isOnline: false, capacity: 35 },
  { id: '5', name: 'Ammerdown', isOnline: false, capacity: 40 }
];

export const sampleEvents: InterviewEvent[] = [
  {
    id: '1',
    type: 'Panel',
    panelNumber: 'P17',
    date: new Date('2024-05-01'),
    weekNumber: 1,
    venue: sampleVenues[0],
    secretary: sampleSecretaries[0],
    estimatedAttendance: 12,
    actualAttendance: 11,
    reportDate: new Date('2024-05-13'),
    reportDeadline: new Date('2024-05-20'),
    status: 'Confirmed'
  },
  {
    id: '2',
    type: 'Panel',
    panelNumber: 'P18',
    date: new Date('2024-05-21'),
    weekNumber: 2,
    venue: sampleVenues[3],
    secretary: sampleSecretaries[0],
    estimatedAttendance: 12,
    actualAttendance: 4,
    reportDate: new Date('2024-05-16'),
    reportDeadline: new Date('2024-05-26'),
    status: 'Booked'
  }
];