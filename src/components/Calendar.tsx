import React, { useMemo, useState, useEffect } from 'react';
import { InterviewEvent } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  addMonths,
  subMonths,
  setYear,
  getYear
} from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Users, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink
} from 'lucide-react';
import { fetchBankHolidays } from '../utils/dateCalculations';
import { termDatesApi, TermDate } from '../api/termDates';

interface CalendarProps {
  events: InterviewEvent[];
  onEventClick: (event: InterviewEvent) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bankHolidays, setBankHolidays] = useState<string[]>([]);
  const [termDates, setTermDates] = useState<TermDate[]>([]);
  
  // Month navigation handlers
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousYear = () => setCurrentDate(setYear(currentDate, getYear(currentDate) - 1));
  const nextYear = () => setCurrentDate(setYear(currentDate, getYear(currentDate) + 1));
  const today = () => setCurrentDate(new Date());

  // Fetch bank holidays when component mounts or year changes
  useEffect(() => {
    const loadDates = async () => {
      try {
        const [holidays, terms] = await Promise.all([
          fetchBankHolidays(),
          termDatesApi.getTermDates(getYear(currentDate))
        ]);
        //console.log('Loaded bank holidays:', holidays);
        //console.log('Loaded term dates:', terms);
        setBankHolidays(holidays);
        setTermDates(terms);
      } catch (error) {
        console.error('Error loading dates:', error);
      }
    };
    loadDates();
  }, [currentDate.getFullYear()]); // Only reload when year changes

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start, end });
    
    // Get the day of week of the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = start.getDay();
    
    // Create array for all cells needed in the calendar
    const calendarDays = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add the actual days of the month
    calendarDays.push(...daysInMonth);
    
    return calendarDays;
  }, [currentDate]);

  const isInTerm = (date: Date) => {
    return termDates.some(term => {
      // Remove time component and handle timezone
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const termStart = new Date(term.start_date);
      termStart.setHours(0, 0, 0, 0);
      const termEnd = new Date(term.end_date);
      termEnd.setHours(23, 59, 59, 999);
      
      return dayStart >= termStart && dayStart <= termEnd;
    });
  };

  const getTermLabel = (date: Date) => {
    const term = termDates.find(term => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const termStart = new Date(term.start_date);
      termStart.setHours(0, 0, 0, 0);
      const termEnd = new Date(term.end_date);
      termEnd.setHours(23, 59, 59, 999);
      
      return dayStart >= termStart && dayStart <= termEnd;
    });
    return term?.term_name || '';
  };

  const getEventStyles = (event: InterviewEvent) => {
    const baseStyle = event.status === 'Cancelled' ? 'line-through opacity-75 ' : '';
    
    switch (event.type) {
      case 'Panel':
        return baseStyle + 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Carousel':
        return baseStyle + 'bg-green-100 text-green-800 border border-green-200';
      case 'TeamResidential':
        return baseStyle + 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'Training':
        return baseStyle + 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'CandidatesPanel':
        return baseStyle + 'bg-red-100 text-red-800 border border-red-200';
      default:
        return baseStyle + 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={previousYear}
                className="p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
              <button
                onClick={previousMonth}
                className="p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={today}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={nextYear}
                className="p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
              >
                <ChevronsRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border-b border-gray-200">
        <div className="grid grid-cols-7 text-center text-xs leading-6 text-gray-500 border-b border-gray-200">
          <div className="py-2 font-semibold">Sun</div>
          <div className="py-2 font-semibold">Mon</div>
          <div className="py-2 font-semibold">Tue</div>
          <div className="py-2 font-semibold">Wed</div>
          <div className="py-2 font-semibold">Thu</div>
          <div className="py-2 font-semibold">Fri</div>
          <div className="py-2 font-semibold">Sat</div>
        </div>
        <div className="grid grid-cols-7 text-sm">
          {days.map((day, dayIdx) => {
            if (!day) {
              // Render empty cell for padding at start of month
              return <div key={`empty-${dayIdx}`} className="min-h-[8rem] p-2 border-r border-b" />;
            }
            
            const dayEvents = events.filter(event => {
              if (event.type === 'Panel') {
                // For Panel events, check if the day falls within the 3-day range
                const eventStart = new Date(event.date);
                const eventEnd = new Date(event.date);
                eventEnd.setDate(eventEnd.getDate() + 2); // Add 2 days to make it a 3-day span
                
                return day >= eventStart && day <= eventEnd;
              } else {
                // For other event types, keep the existing single-day check
                return isSameDay(new Date(event.date), day);
              }
            });
            const isToday = isSameDay(day, new Date());
            const isBankHoliday = bankHolidays.includes(format(day, 'yyyy-MM-dd'));
            const isTermTime = isInTerm(day);

            return (
              <div
                key={day.toString()}
                className={`
                  min-h-[8rem] p-2 border-r border-b relative
                  ${dayIdx === 0 ? 'border-l' : ''}
                  ${isToday ? 'bg-primary-50' : ''}
                  ${isBankHoliday ? 'bg-red-50' : ''}
                  ${!isInTerm(day) ? 'bg-gray-100' : ''}
                `}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={`
                    flex items-center justify-center h-6 w-6 rounded-full mx-auto
                    ${isToday ? 'bg-primary-600 text-white' : ''}
                    ${isBankHoliday ? 'text-red-600 font-semibold' : 'text-gray-900'}
                  `}
                >
                  {format(day, 'd')}
                </time>
                {/* Labels Container */}
                <div className="flex flex-col gap-0.5 mt-1">
                  {isBankHoliday && (
                    <div className="text-[10px] leading-tight text-red-600 font-medium px-1 py-0.5 bg-red-50 rounded">
                      Bank Holiday
                    </div>
                  )}
                  {getTermLabel(day) && (
                    <div className="text-[10px] leading-tight text-gray-600 font-medium px-1 py-0.5 bg-gray-50 rounded truncate">
                      {getTermLabel(day)}
                    </div>
                  )}
                </div>
                {/* Events Container */}
                <div className="space-y-1 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`
                        w-full text-left text-xs mb-1 px-2 py-1 rounded-md 
                        ${getEventStyles(event)}
                        ${event.type === 'Panel' && !isSameDay(new Date(event.date), day) ? 'opacity-75' : ''}
                      `}
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>
                          {event.type === 'Panel' && !isSameDay(new Date(event.date), day) ? '(cont.)' : ''}
                          {event.type === 'Panel' || event.type === 'Carousel' 
                            ? `${event.type} ${event.panelNumber}` 
                            : event.type}
                        </span>
                        {(event.type === 'Panel' || event.type === 'Carousel') && event.helperPanelId && (
                          <a
                            href={`https://helper.oxtobyhome.co.uk/panels/${event.helperPanelId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-current hover:opacity-75"
                            title="Open in Helper"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Users className="h-3 w-3" />
                        <span>{event.secretary?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <MapPin className="h-3 w-3" />
                        <span>{event.venue?.name}</span>
                      </div>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;