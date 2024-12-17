import { Secretary, InterviewEvent } from '../types';
import { differenceInDays } from 'date-fns';

export function calculateRestViolations(events: InterviewEvent[]) {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const violations = {
    dates: [] as Date[],
    details: [] as string[]
  };

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentDate = new Date(sortedEvents[i].date);
    const nextDate = new Date(sortedEvents[i + 1].date);
    const daysBetween = differenceInDays(nextDate, currentDate);
    
    if (daysBetween < 7) {
      violations.dates.push(nextDate);
      violations.details.push(`Less than 7 days between events`);
    }
  }

  return violations;
}

export function distributeWorkload(secretaries: Secretary[], events: InterviewEvent[]): Secretary[] {
  // Debug first secretary and their events
  const firstSecretary = secretaries[0];
  console.log('Debug first secretary:', {
    secretary: firstSecretary,
    firstEvent: events[0],
    secondEvent: events[1],
    comparison: {
      secretaryId: firstSecretary.id,
      firstEventSecretaryId: events[0]?.secretary?.id,
      secondEventSecretaryId: events[1]?.secretary?.id,
      match1: events[0]?.secretary?.id === firstSecretary.id,
      match2: events[1]?.secretary?.id === firstSecretary.id
    }
  });

  return secretaries.map(secretary => {
    const secretaryEvents = events.filter(event => 
      String(event.secretary?.id) === secretary.id || 
      event.impactedSecretaryIds?.includes(secretary.id)
    );

    const panels = secretaryEvents.filter(e => e.type === 'Panel').length;
    const carousels = secretaryEvents.filter(e => e.type === 'Carousel').length;

    return {
      ...secretary,
      workload: {
        upcomingEvents: {
          panels,
          carousels,
          total: panels + carousels,
          restViolations: calculateRestViolations(secretaryEvents)
        }
      }
    };
  });
}