import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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
  ExternalLink,
  ArrowUp as ArrowUpIcon
} from 'lucide-react';
import { fetchBankHolidays } from '../utils/dateCalculations';
import { termDatesApi, TermDate } from '../api/termDates';
import { useInView } from 'react-intersection-observer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
import { DraggableEvent } from './DraggableEvent';

interface CalendarProps {
  events: InterviewEvent[];
  secretaries: Secretary[];
  onEventClick: (event: InterviewEvent) => void;
  onEventDateChange: (event: InterviewEvent, newDate: Date) => Promise<void>;
  secretaryFilter: string;
  onSecretaryFilterChange: (value: string) => void;
  infiniteScroll: boolean;
  onInfiniteScrollChange: (value: boolean) => void;
  currentDate?: Date;
}

const DroppableCell: React.FC<{
  date: Date;
  children: React.ReactNode;
  onDrop: (event: InterviewEvent, date: Date) => void;
}> = ({ date, children, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'EVENT',
    drop: (item: { event: InterviewEvent }) => {
      if (typeof onDrop === 'function') {
        onDrop(item.event, date);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`min-h-[8rem] p-2 border-r border-b ${
        isOver ? 'bg-blue-50' : ''
      }`}
    >
      {children}
    </div>
  );
};

const Calendar: React.FC<CalendarProps> = ({ 
  events, 
  secretaries, 
  onEventClick,
  onEventDateChange,
  secretaryFilter,
  onSecretaryFilterChange,
  infiniteScroll,
  onInfiniteScrollChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayMonths, setDisplayMonths] = useState<Date[]>([currentDate]);
  const [bankHolidays, setBankHolidays] = useState<string[]>([]);
  const [termDates, setTermDates] = useState<TermDate[]>([]);
  const { ref, inView } = useInView();
  const calendarRef = useRef<HTMLDivElement>(null);

  // Disable infinite scroll and return to top
  const handleDisableInfiniteScroll = useCallback(() => {
    onInfiniteScrollChange(false);
  }, [onInfiniteScrollChange]);

  // Jump to today and scroll to today's month
  const scrollToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    const initialMonths = [];
    for (let i = -6; i <= 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      initialMonths.push(monthDate);
    }
    setDisplayMonths(initialMonths);

    // Wait for the DOM to update before scrolling
    setTimeout(() => {
      const todayMonthElement = document.querySelector(`[data-month="${format(today, 'yyyy-MM')}"]`);
      if (todayMonthElement) {
        todayMonthElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  // Get events for a specific month
  const getEventsForDay = (day: Date) => {
    // Get regular events
    const dayEvents = filteredEvents.filter(event => {
      if (event.type === 'Panel') {
        const eventStart = new Date(event.date);
        const eventEnd = new Date(event.date);
        eventEnd.setDate(eventEnd.getDate() + 2);
        
        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(23, 59, 59, 999);
        const compareDate = new Date(day);
        compareDate.setHours(0, 0, 0, 0);
        
        return compareDate >= eventStart && compareDate <= eventEnd;
      } else {
        return isSameDay(new Date(event.date), day);
      }
    });

    // Add all availability events for this day (with null check)
    if (secretaries?.length > 0) {
      secretaries.forEach(secretary => {
        const availability = secretary.availability?.find(a => 
          isSameDay(new Date(a.date), day)
        );
        
        if (availability) {
          dayEvents.push({
            id: `availability-${secretary.id}-${day.toISOString()}`,
            type: 'Availability',
            date: day,
            secretary: secretary,
            title: `${secretary.name} - ${availability.isAvailable ? 'Available' : 'Unavailable'}`,
            isAvailable: availability.isAvailable,
            reason: availability.reason,
            panelNumber: '',
            weekNumber: 0,
            season: '',
            venue: { id: '', name: '' },
            estimatedAttendance: 0,
            actualAttendance: 0,
            reportDate: new Date(),
            reportDeadline: new Date(),
            status: 'Available'
          });
        }
      });
    }

    return dayEvents;
  };

  // Filter events based on secretary
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Always show availability events
      if (event.type === 'Availability') return true;
      
      // Always show special events (non-Panel and non-Carousel) when filtering by secretary
      if (secretaryFilter !== 'all' && 
          !['Panel', 'Carousel'].includes(event.type)) {
        return true;
      }
      
      // Filter Panel and Carousel events by secretary
      if (secretaryFilter !== 'all' && 
          ['Panel', 'Carousel'].includes(event.type) && 
          event.secretary?.name !== secretaryFilter) {
        return false;
      }
      
      return true;
    });
  }, [events, secretaryFilter]);

  // Navigation handlers
  const previousMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (!infiniteScroll) {
      setDisplayMonths([newDate]);
    }
  };

  const nextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (!infiniteScroll) {
      setDisplayMonths([newDate]);
    }
  };

  const previousYear = () => {
    const newDate = subMonths(currentDate, 12);
    setCurrentDate(newDate);
    if (!infiniteScroll) {
      setDisplayMonths([newDate]);
    }
  };

  const nextYear = () => {
    const newDate = addMonths(currentDate, 12);
    setCurrentDate(newDate);
    if (!infiniteScroll) {
      setDisplayMonths([newDate]);
    }
  };

  const today = () => {
    const newDate = new Date();
    setCurrentDate(newDate);
    if (!infiniteScroll) {
      setDisplayMonths([newDate]);
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    if (infiniteScroll) {
      if (inView) {
        // Add 3 more months when reaching the bottom
        setDisplayMonths(prev => {
          const lastMonth = prev[prev.length - 1];
          const newMonths = [
            addMonths(lastMonth, 1),
            addMonths(lastMonth, 2),
            addMonths(lastMonth, 3)
          ];
          return [...prev, ...newMonths];
        });
      }
    }
  }, [inView, infiniteScroll]); // Remove currentDate dependency

  // Initialize display months
  useEffect(() => {
    if (infiniteScroll) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Scroll the view to today's month
      const todayMonthElement = document.querySelector(`[data-month="${format(today, 'yyyy-MM')}"]`);
      if (todayMonthElement) {
        todayMonthElement.scrollIntoView({ behavior: 'smooth' });
      }
      
      const initialMonths = [];
      for (let i = -6; i <= 6; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        initialMonths.push(monthDate);
      }
      setDisplayMonths(initialMonths);
      setCurrentDate(today);
    } else {
      setDisplayMonths([currentDate]);
    }
  }, [infiniteScroll]);

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

  // Generate days for a specific month
  const getDaysForMonth = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    
    // Calculate padding days
    const startDay = start.getDay();
    const paddingDays = Array(startDay).fill(null);
    
    return [...paddingDays, ...daysInMonth];
  };

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
    const baseStyle = 'text-xs p-1 rounded mb-1 ';

    // Handle availability events
    if (event.type === 'Availability') {
      return baseStyle + (event.isAvailable 
        ? 'bg-green-600/20 text-green-800 border border-green-600/30' 
        : 'bg-red-600/20 text-red-800 border border-red-600/30');
    }

    // Keep all existing event type styles
    switch (event.type) {
      case 'Panel':
        return baseStyle + 'bg-primary-600/50 text-primary-100';
      case 'Carousel':
        return baseStyle + 'bg-blue-600/50 text-blue-100';
      case 'TeamResidential':
        return baseStyle + 'bg-purple-600/50 text-purple-100';
      case 'Training':
        return baseStyle + 'bg-orange-600/50 text-orange-100';
      case 'Conference':
        return baseStyle + 'bg-emerald-600/50 text-emerald-100';
      case 'CandidatesPanel':
        return baseStyle + 'bg-pink-600/50 text-pink-100';
      default:
        return baseStyle + 'bg-gray-600/50 text-gray-100';
    }
  };

  // Get unique secretaries for filter dropdown - only from Panels and Carousels
  const uniqueSecretaries = Array.from(
    new Set(
      events
        .filter(event => event.type === 'Panel' || event.type === 'Carousel')
        .map(event => event.secretary?.name)
    )
  )
    .filter(Boolean)
    .sort();

  const handleEventDrop = async (event: InterviewEvent, newDate: Date) => {
    try {
      if (typeof onEventDateChange === 'function') {
        await onEventDateChange(event, newDate);
      }
    } catch (error) {
      console.error('Error updating event date:', error);
    }
  };

  // Simple scroll to top of page
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle infinite scroll toggle
  const handleInfiniteScrollToggle = (checked: boolean) => {
    if (checked) {
      const today = new Date();
      setCurrentDate(today);
      const initialMonths = [];
      for (let i = -6; i <= 6; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        initialMonths.push(monthDate);
      }
      setDisplayMonths(initialMonths);
      
      // Wait for the DOM to update before scrolling
      setTimeout(() => {
        const todayMonthElement = document.querySelector(`[data-month="${format(today, 'yyyy-MM')}"]`);
        if (todayMonthElement) {
          todayMonthElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setDisplayMonths([currentDate]);
    }
    onInfiniteScrollChange(checked);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div ref={calendarRef} className="bg-white rounded-lg shadow relative">
        {infiniteScroll && (
          <div className="fixed bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={handleDisableInfiniteScroll}
              className="bg-gray-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 z-10 flex items-center gap-2"
            >
              <ArrowUpIcon className="h-4 w-4" />
              <span>Exit Scroll</span>
            </button>
            <button
              onClick={scrollToToday}
              className="bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 z-10 flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Today</span>
            </button>
          </div>
        )}
        
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

            {/* Add secretary filter */}
            <div className="flex items-center space-x-2">
              <select
                value={secretaryFilter}
                onChange={(e) => onSecretaryFilterChange(e.target.value)}
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="all">All Panel Secretaries</option>
                {uniqueSecretaries.map((secretary) => (
                  <option key={secretary} value={secretary}>
                    {secretary}
                  </option>
                ))}
              </select>
            </div>

            {/* Add infinite scroll toggle */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={infiniteScroll}
                  onChange={(e) => handleInfiniteScrollToggle(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>Infinite Scroll</span>
              </label>
            </div>
          </div>
        </div>

        {/* Render multiple months if infinite scroll is enabled */}
        {infiniteScroll ? (
          displayMonths.map((monthDate, index) => (
            <div 
              key={monthDate.toISOString()}
              ref={index === displayMonths.length - 1 ? ref : undefined}
              data-month={format(monthDate, 'yyyy-MM')}
            >
              <h3 className="text-lg font-semibold text-gray-900 px-6 py-4">
                {format(monthDate, 'MMMM yyyy')}
              </h3>
              <div className="border-b border-gray-200">
                {/* Days of week header */}
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
                  {getDaysForMonth(monthDate).map((day, dayIdx) => {
                    if (!day) {
                      return <div key={`empty-${dayIdx}-${monthDate.getTime()}`} className="min-h-[8rem] p-2 border-r border-b" />;
                    }
                    
                    const dayEvents = getEventsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isBankHoliday = bankHolidays.includes(format(day, 'yyyy-MM-dd'));
                    const isTermTime = isInTerm(day);

                    return (
                      <DroppableCell
                        key={day.toISOString()}
                        date={day}
                        onDrop={handleEventDrop}
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
                          {dayEvents.map((event) => (
                            <DraggableEvent
                              key={event.id}
                              event={event}
                              className={getEventStyles(event)}
                              onClick={() => onEventClick(event)}
                              currentDate={day}
                            />
                          ))}
                        </div>
                      </DroppableCell>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Single month view
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
              {getDaysForMonth(currentDate).map((day, dayIdx) => {
                if (!day) {
                  // Render empty cell for padding at start of month
                  return <div key={`empty-${dayIdx}`} className="min-h-[8rem] p-2 border-r border-b" />;
                }
                
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isBankHoliday = bankHolidays.includes(format(day, 'yyyy-MM-dd'));
                const isTermTime = isInTerm(day);

                return (
                  <DroppableCell
                    key={day?.toISOString() || dayIdx}
                    date={day}
                    onDrop={handleEventDrop}
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
                      {dayEvents.map((event) => (
                        <DraggableEvent
                          key={event.id}
                          event={event}
                          className={getEventStyles(event)}
                          onClick={() => onEventClick(event)}
                          currentDate={day}
                        />
                      ))}
                    </div>
                  </DroppableCell>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default Calendar;