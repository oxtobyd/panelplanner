import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewEvent } from '../types';
import { 
  isWeekend, 
  isEqual, 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek,
  isBefore,
  isWithinInterval,
  parseISO 
} from 'date-fns';

// Function to calculate Easter Sunday for a given year
// Using the Meeus/Jones/Butcher algorithm
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

interface TermDate {
  start_date: string;
  end_date: string;
  type: 'term' | 'holiday';
  name: string;
}

interface SeasonReportProps {
  events: InterviewEvent[];
  bankHolidays: string[];
  termDates: TermDate[];
}

interface ValidationIssue {
  event: InterviewEvent;
  issue: string;
  severity: 'error' | 'warning';
}

const SeasonReport: React.FC<SeasonReportProps> = ({ events, bankHolidays, termDates }) => {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  // Get unique seasons from non-cancelled events
  const seasons = Array.from(new Set(
    events
      .filter(event => event.status !== 'Cancelled')
      .map(event => event.season)
  )).filter(Boolean);

  const handleEventClick = (event: InterviewEvent) => {
    const date = new Date(event.date);
    navigate(`/?date=${format(date, 'yyyy-MM-dd')}&highlight=${event.id}`);
  };

  const validateEvents = (season: string) => {
    // Filter out cancelled events at the start
    const seasonEvents = events.filter(event => 
      event.season === season && event.status !== 'Cancelled'
    );
    const issues: ValidationIssue[] = [];

    // Check Carousel afternoon ratio
    const carousels = seasonEvents.filter(event => 
      event.type === 'Carousel'
    );
    const afternoonCarousels = carousels.filter(event => {
      const time = event.time?.split(':')[0];
      return time && parseInt(time) >= 12;
    });

    const afternoonRatio = (afternoonCarousels.length / carousels.length) * 100;
    if (carousels.length > 0 && afternoonRatio < 20) {
      issues.push({
        event: carousels[0],
        issue: `Only ${afternoonRatio.toFixed(1)}% of active Carousels are scheduled in the afternoon (minimum 20% required). ${afternoonCarousels.length} of ${carousels.length} Carousels are after 12:00.`,
        severity: 'error'
      });
    }

    // Check secretary workload limits
    const secretaryLimits = [
      { name: 'Robert Avery', maxCarousels: 8, maxPanels: 4 },
      { name: 'Carys Walsh', maxCarousels: 8, maxPanels: 4 },
      { name: 'Joy Gilliver', maxCarousels: 3, maxPanels: 2 }
    ];

    secretaryLimits.forEach(secretary => {
      const secretaryEvents = seasonEvents.filter(event => 
        event.secretary?.name === secretary.name
      );

      const carouselCount = secretaryEvents.filter(event => 
        event.type === 'Carousel'
      ).length;

      const panelCount = secretaryEvents.filter(event => 
        event.type === 'Panel'
      ).length;

      if (carouselCount > secretary.maxCarousels) {
        issues.push({
          event: secretaryEvents[0],
          issue: `${secretary.name} has ${carouselCount} active Carousels scheduled (maximum ${secretary.maxCarousels} per season)`,
          severity: 'error'
        });
      }

      if (panelCount > secretary.maxPanels) {
        issues.push({
          event: secretaryEvents[0],
          issue: `${secretary.name} has ${panelCount} active Panels scheduled (maximum ${secretary.maxPanels} per season)`,
          severity: 'error'
        });
      }
    });

    // Check spacing between events for ALL Panel Secretaries
    const uniqueSecretaries = Array.from(new Set(
      events
        .filter(event => 
          event.secretary && 
          ['Panel', 'Carousel'].includes(event.type)
        )
        .map(event => event.secretary.name)
    ));

    console.log('Checking all secretaries:', uniqueSecretaries);

    uniqueSecretaries.forEach(secretaryName => {
      // Get ALL events for this secretary in the season
      const secretaryEvents = events.filter(event => 
        event.secretary?.name === secretaryName && // Match secretary name
        event.season === season && // Only check events in current season
        event.status !== 'Cancelled' && // Exclude cancelled events
        ['Panel', 'Carousel'].includes(event.type) // Only Panels and Carousels
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log(`Checking events for ${secretaryName}:`, secretaryEvents);

      // Check each event against all subsequent events
      secretaryEvents.forEach((currentEvent, index) => {
        // Look at all following events
        for (let i = index + 1; i < secretaryEvents.length; i++) {
          const nextEvent = secretaryEvents[i];
          
          const currentDate = new Date(currentEvent.date);
          const nextDate = new Date(nextEvent.date);
          currentDate.setHours(0, 0, 0, 0);
          nextDate.setHours(0, 0, 0, 0);
          
          const daysBetween = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Define minimum days based on event types
          let minDays: number;
          let description: string;
          
          if (currentEvent.type === 'Panel' && nextEvent.type === 'Panel') {
            minDays = 21;  // Panel to Panel: 21 days
            description = 'Panel to Panel';
          } else if (currentEvent.type === 'Carousel' && nextEvent.type === 'Carousel') {
            minDays = 5;   // Carousel to Carousel: 5 days (changed from 7)
            description = 'Carousel to Carousel';
          } else if (currentEvent.type === 'Carousel' && nextEvent.type === 'Panel') {
            minDays = 10;  // Carousel to Panel: 10 days (changed from 14)
            description = 'Carousel to Panel';
          } else {
            // Panel to Carousel
            minDays = 10;  // Panel to Carousel: 10 days (unchanged)
            description = 'Panel to Carousel';
          }
          
          if (daysBetween < minDays) {
            issues.push({
              event: nextEvent,
              issue: `${secretaryName} has ${description} events scheduled only ${daysBetween} days apart (${format(currentDate, 'dd/MM/yyyy')} to ${format(nextDate, 'dd/MM/yyyy')})`,
              severity: 'error'
            });
          }
        }
      });
    });

    // Check term holiday ratio
    const panelsAndCarousels = seasonEvents.filter(event => 
      ['Panel', 'Carousel'].includes(event.type)
    );
    console.log('Total Panels and Carousels:', panelsAndCarousels.length);
    console.log('Term Dates received:', termDates);

    // Filter term dates to get only holiday periods
    const holidayTermDates = termDates.filter(term => term.type === 'holiday');
    console.log('Holiday Term Dates:', holidayTermDates);

    const inHolidayEvents = panelsAndCarousels.filter(event => {
      const eventDate = new Date(event.date);
      return holidayTermDates.some(holiday => {
        const isInHoliday = isWithinInterval(eventDate, {
          start: parseISO(holiday.start_date),
          end: parseISO(holiday.end_date)
        });
        if (isInHoliday) {
          console.log('Found holiday event:', event.type, event.panelNumber, 'in', holiday.name);
        }
        return isInHoliday;
      });
    });

    console.log('Events in holidays:', inHolidayEvents);
    const holidayRatio = (inHolidayEvents.length / panelsAndCarousels.length) * 100;
    if (panelsAndCarousels.length > 0 && holidayRatio < 10) {
      issues.push({
        event: panelsAndCarousels[0],
        issue: `Only ${holidayRatio.toFixed(1)}% of active Panels and Carousels are scheduled during term holidays (minimum 10% required). ${inHolidayEvents.length} of ${panelsAndCarousels.length} events are during holidays.`,
        severity: 'error'
      });
    }

    // Get all unique years in the season's events
    const years = Array.from(new Set(
      seasonEvents.map(event => new Date(event.date).getFullYear())
    ));

    // Calculate Easter weeks for all years in the season
    const easterWeeks = years.map(year => {
      const easterSunday = getEasterSunday(year);
      const weekStart = addDays(easterSunday, -7); // Start of Holy Week
      return {
        start: weekStart,
        end: easterSunday
      };
    });

    // Sort events by date for consecutive day checks
    const sortedEvents = [...seasonEvents].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Find all Candidates Panel weeks (from non-cancelled events)
    const candidatesPanelWeeks = new Set(
      seasonEvents
        .filter(event => event.type === 'CandidatesPanel')
        .map(event => {
          const date = new Date(event.date);
          return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        })
    );

    sortedEvents.forEach((event, index) => {
      const eventDate = new Date(event.date);

      // Only check Panels and Carousels that aren't cancelled
      if (['Panel', 'Carousel'].includes(event.type) && event.status !== 'Cancelled') {

        // Check for weekends
        if (isWeekend(eventDate)) {
          issues.push({
            event,
            issue: `${event.type} scheduled on a weekend (${event.date})`,
            severity: 'error'
          });
        }

        // Check for bank holidays
        if (bankHolidays.some(holiday => isEqual(new Date(holiday), eventDate))) {
          issues.push({
            event,
            issue: `${event.type} scheduled on a bank holiday (${event.date})`,
            severity: 'error'
          });
        }

        // Check Robert Avery's availability
        if (event.secretary?.name === 'Robert Avery') {
          const dayOfWeek = eventDate.getDay();
          if (dayOfWeek === 1 || dayOfWeek === 2) { // 1=Monday, 2=Tuesday
            issues.push({
              event,
              issue: `${event.type} scheduled for Robert Avery on ${format(eventDate, 'EEEE')} - unavailable on Mondays and Tuesdays`,
              severity: 'error'
            });
          }
        }

        // Check Panel conflicts with Candidates Panel weeks
        if (event.type === 'Panel') {
          const eventWeekStart = format(startOfWeek(eventDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
          if (candidatesPanelWeeks.has(eventWeekStart)) {
            issues.push({
              event,
              issue: `Panel scheduled in the same week as a Candidates Panel (week beginning ${format(startOfWeek(eventDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')})`,
              severity: 'error'
            });
          }
        }

        // Check Carousel day restrictions
        if (event.type === 'Carousel') {
          const dayOfWeek = eventDate.getDay();
          if (![2, 3, 5].includes(dayOfWeek)) { // 2=Tue, 3=Wed, 5=Fri
            issues.push({
              event,
              issue: `Carousel scheduled on ${format(eventDate, 'EEEE')} - must be Tuesday, Wednesday, or Friday`,
              severity: 'error'
            });
          }

          // Check for Carousel density (no more than 4 over two consecutive days)
          const nextDayDate = addDays(eventDate, 1);
          const carouselsOnCurrentDay = seasonEvents.filter(e => 
            e.type === 'Carousel' && 
            e.status !== 'Cancelled' &&
            isEqual(new Date(e.date), eventDate)
          ).length;
          
          const carouselsOnNextDay = seasonEvents.filter(e => 
            e.type === 'Carousel' && 
            e.status !== 'Cancelled' &&
            isEqual(new Date(e.date), nextDayDate)
          ).length;

          if (carouselsOnCurrentDay + carouselsOnNextDay > 4) {
            issues.push({
              event,
              issue: `Too many Carousels: ${carouselsOnCurrentDay} on ${format(eventDate, 'dd/MM/yyyy')} and ${carouselsOnNextDay} on ${format(nextDayDate, 'dd/MM/yyyy')} (maximum 4 over two consecutive days)`,
              severity: 'error'
            });
          }
        }

        // Check for Holy Week
        const isHolyWeek = easterWeeks.some(week => 
          isWithinInterval(eventDate, { 
            start: week.start, 
            end: week.end 
          })
        );

        if (isHolyWeek) {
          issues.push({
            event,
            issue: `${event.type} scheduled during Holy Week (the week before Easter Sunday)`,
            severity: 'error'
          });
        }
      }
    });

    setValidationIssues(issues);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Season Report</h2>
      
      {/* Rules Description Box */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Validation Rules</h3>
        <h4 className="text-sm text-blue-700 mb-2 italic">Note: All rules apply only to active (non-cancelled) events</h4>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Panels and Carousels must not be scheduled on weekends</li>
          <li>Panels and Carousels must not be scheduled on bank holidays</li>
          <li>Carousels can only be scheduled on Tuesday, Wednesday, or Friday</li>
          <li>No more than 4 Carousels can be scheduled over any two consecutive days</li>
          <li>At least 20% of Carousels must be scheduled in the afternoon (after 12:00)</li>
          <li>No Panels can be scheduled in the same week as a Candidates Panel</li>
          <li>Panel Secretary Robert Avery is unavailable for Panels and Carousels on Mondays and Tuesdays</li>
          <li>Panel Secretaries Robert Avery and Carys Walsh are limited to 8 Carousels and 4 Panels per season</li>
          <li>Panel Secretary Joy Gilliver is limited to 3 Carousels and 2 Panels per season</li>
          <li>No Panels or Carousels can be scheduled during Holy Week (the week before Easter Sunday)</li>
          <li>At least 10% of Panels and Carousels must be scheduled during term holidays</li>
          <li>Panel Secretaries must have at least 7 days between Carousels</li>
          <li>Panel Secretaries must have at least 21 days between Panels</li>
        </ul>
      </div>
      
      {/* Season Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Season
        </label>
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(e.target.value);
            validateEvents(e.target.value);
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Select a season...</option>
          {seasons.map(season => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>
      </div>

      {/* Validation Results */}
      {selectedSeason && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
          
          {/* Rules Status */}
          <div className="mb-6 bg-white border border-gray-200 rounded-md p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Rules Status</h4>
            <div className="space-y-2">
              {validationIssues.length === 0 ? (
                <div className="text-green-600">
                  ✓ All rules passed
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { rule: 'No weekend scheduling', check: !validationIssues.some(i => i.issue.includes('weekend')) },
                    { rule: 'No bank holiday scheduling', check: !validationIssues.some(i => i.issue.includes('bank holiday')) },
                    { rule: 'Carousels on Tuesday, Wednesday, or Friday only', check: !validationIssues.some(i => i.issue.includes('must be Tuesday, Wednesday, or Friday')) },
                    { rule: 'Maximum 4 Carousels over two consecutive days', check: !validationIssues.some(i => i.issue.includes('Too many Carousels')) },
                    { rule: 'Minimum 20% afternoon Carousels', check: !validationIssues.some(i => i.issue.includes('afternoon')) },
                    { rule: 'No Panels in Candidates Panel weeks', check: !validationIssues.some(i => i.issue.includes('Candidates Panel')) },
                    { rule: 'Robert Avery availability', check: !validationIssues.some(i => i.issue.includes('Robert Avery') && i.issue.includes('unavailable')) },
                    { rule: 'Secretary workload limits', check: !validationIssues.some(i => i.issue.includes('maximum')) },
                    { rule: 'No events during Holy Week', check: !validationIssues.some(i => i.issue.includes('Holy Week')) },
                    { rule: 'Minimum 10% events during term holidays', check: !validationIssues.some(i => i.issue.includes('term holidays')) },
                    { 
                      rule: 'Minimum days between events', 
                      check: !validationIssues.some(i => 
                        i.issue.includes('days apart')
                      ) 
                    },
                  ].map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded`}
                      onClick={() => {
                        const issue = validationIssues.find(i => i.issue.includes(item.rule));
                        if (issue) {
                          handleEventClick(issue.event);
                        }
                      }}
                    >
                      <span className={`mr-2 ${item.check ? 'text-green-600' : 'text-red-600'}`}>
                        {item.check ? '✓' : '✗'}
                      </span>
                      <span className={item.check ? 'text-gray-700' : 'text-red-700'}>
                        {item.rule}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Issues */}
          {validationIssues.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Detailed Issues</h4>
              {validationIssues.map((issue, index) => {
                // Determine background color based on issue type
                let bgColor = '';
                let textColor = '';
                let hoverBg = '';
                
                if (issue.issue.includes('days apart')) {
                  // Spacing violations
                  bgColor = 'bg-red-50';
                  textColor = 'text-red-700';
                  hoverBg = 'hover:bg-red-100';
                } else if (issue.issue.includes('weekend')) {
                  // Weekend scheduling
                  bgColor = 'bg-orange-50';
                  textColor = 'text-orange-700';
                  hoverBg = 'hover:bg-orange-100';
                } else if (issue.issue.includes('bank holiday')) {
                  // Bank holiday scheduling
                  bgColor = 'bg-yellow-50';
                  textColor = 'text-yellow-700';
                  hoverBg = 'hover:bg-yellow-100';
                } else if (issue.issue.includes('Holy Week')) {
                  // Holy Week violations
                  bgColor = 'bg-purple-50';
                  textColor = 'text-purple-700';
                  hoverBg = 'hover:bg-purple-100';
                } else if (issue.issue.includes('term holidays')) {
                  // Term holiday ratio issues
                  bgColor = 'bg-blue-50';
                  textColor = 'text-blue-700';
                  hoverBg = 'hover:bg-blue-100';
                } else if (issue.issue.includes('maximum')) {
                  // Secretary workload limits
                  bgColor = 'bg-indigo-50';
                  textColor = 'text-indigo-700';
                  hoverBg = 'hover:bg-indigo-100';
                } else if (issue.issue.includes('afternoon')) {
                  // Afternoon ratio issues
                  bgColor = 'bg-cyan-50';
                  textColor = 'text-cyan-700';
                  hoverBg = 'hover:bg-cyan-100';
                } else if (issue.issue.includes('Candidates Panel')) {
                  // Candidates Panel week conflicts
                  bgColor = 'bg-emerald-50';
                  textColor = 'text-emerald-700';
                  hoverBg = 'hover:bg-emerald-100';
                } else {
                  // Default fallback
                  bgColor = 'bg-gray-50';
                  textColor = 'text-gray-700';
                  hoverBg = 'hover:bg-gray-100';
                }

                return (
                  <div 
                    key={index} 
                    onClick={() => handleEventClick(issue.event)}
                    className={`p-4 rounded-md cursor-pointer ${bgColor} ${textColor} ${hoverBg}`}
                  >
                    <div className="font-medium">{issue.issue}</div>
                    <div className="text-sm mt-1 opacity-90">
                      Event: {issue.event.title || `${issue.event.type} ${issue.event.panelNumber}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeasonReport; 