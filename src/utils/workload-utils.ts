import { Secretary, InterviewEvent, InterviewType } from '../types';
import { differenceInDays } from 'date-fns';

function getMinimumRestDays(currentType: InterviewType, nextType: InterviewType): number {
  // Panel -> Panel: 21 days
  if (currentType === 'Panel' && nextType === 'Panel') {
    return 21;
  }
  // Carousel -> Carousel: 7 days
  if (currentType === 'Carousel' && nextType === 'Carousel') {
    return 7;
  }
  // Carousel -> Panel: 14 days
  if (currentType === 'Carousel' && nextType === 'Panel') {
    return 14;
  }
  // Panel -> Carousel: 10 days
  if (currentType === 'Panel' && nextType === 'Carousel') {
    return 10;
  }
  // Default fallback
  return 7;
}

export function calculateRestViolations(events: InterviewEvent[]) {
  // Filter out non-Panel and non-Carousel events
  const relevantEvents = events.filter(
    event => event.type === 'Panel' || event.type === 'Carousel'
  );
  
  const sortedEvents = [...relevantEvents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const violations = {
    dates: [] as Date[],
    details: [] as string[]
  };

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];
    const currentDate = new Date(currentEvent.date);
    const nextDate = new Date(nextEvent.date);
    const daysBetween = differenceInDays(nextDate, currentDate);
    
    const minimumDays = getMinimumRestDays(currentEvent.type, nextEvent.type);
    
    if (daysBetween < minimumDays) {
      violations.dates.push(nextDate);
      violations.details.push(
        `${daysBetween} days between ${currentEvent.type} and ${nextEvent.type} (minimum ${minimumDays})`
      );
    }
  }

  return violations;
}

export function distributeWorkload(secretaries: Secretary[], events: InterviewEvent[]): Secretary[] {
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
          restViolations: calculateRestViolations(secretaryEvents),
          events: secretaryEvents
        }
      }
    };
  });
}