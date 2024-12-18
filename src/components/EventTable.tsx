import React, { useState, useEffect } from 'react';
import { Table, ArrowUpDown, Calendar as CalendarIcon, Filter, ExternalLink } from 'lucide-react';
import { InterviewEvent, InterviewType } from '../types';
import { calculateReportDueDate, fetchBankHolidays, calculatePaperworkDueDate } from '../utils/dateCalculations';
import { format, differenceInDays } from 'date-fns';

interface EventTableProps {
  events: InterviewEvent[];
  onEventClick: (event: InterviewEvent) => void;
  secretaryFilter: string;
  onSecretaryFilterChange: (value: string) => void;
  venueFilter: string;
  onVenueFilterChange: (value: string) => void;
}

type SortField = 'date' | 'panelNumber' | 'venue' | 'secretary' | 'status' | 'daysToNext';
type SortDirection = 'asc' | 'desc';

interface NextEvent {
  days: number;
  nextType: InterviewType;
}

const EventTable: React.FC<EventTableProps> = ({ 
  events, 
  onEventClick, 
  secretaryFilter,
  onSecretaryFilterChange,
  venueFilter,
  onVenueFilterChange 
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [reportDueDates, setReportDueDates] = useState<{ [key: string]: Date }>({});
  const [typeFilter, setTypeFilter] = useState<InterviewType | 'all'>('all');
  const [showFutureOnly, setShowFutureOnly] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  useEffect(() => {
    const loadReportDueDates = async () => {
      // Ensure bank holidays are loaded first
      await fetchBankHolidays();
      
      // Calculate all report due dates
      const dueDates: Record<string, Date> = {};
      
      for (const event of events) {
        const dueDate = await calculateReportDueDate(
          new Date(event.date),
          event.type
        );
        dueDates[event.id] = dueDate;
      }
      
      setReportDueDates(dueDates);
    };

    loadReportDueDates();
  }, [events]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get unique secretaries for filter dropdown
  const uniqueSecretaries = Array.from(new Set(events.map(event => event.secretary.name))).sort();

  // Get unique venues for filter dropdown
  const uniqueVenues = [...new Set(events.map(event => event.venue?.name))].filter(Boolean).sort();

  // Get unique seasons for filter dropdown
  const uniqueSeasons = Array.from(new Set(events.map(event => event.season))).sort().reverse();

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesSecretary = secretaryFilter === 'all' || event.secretary?.name === secretaryFilter;
    const matchesVenue = venueFilter === 'all' || event.venue?.name === venueFilter;
    const matchesFuture = !showFutureOnly || new Date(event.date) >= new Date();
    const matchesSeason = seasonFilter === 'all' || event.season === seasonFilter;
    return matchesType && matchesSecretary && matchesVenue && matchesFuture && matchesSeason;
  });

  // Sort filtered events
  const sortedAndFilteredEvents = filteredEvents.sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'date':
        return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'panelNumber':
        return multiplier * a.panelNumber.localeCompare(b.panelNumber);
      case 'venue':
        return multiplier * (a.venue?.name || '').localeCompare(b.venue?.name || '');
      case 'secretary':
        return multiplier * (a.secretary?.name || '').localeCompare(b.secretary?.name || '');
      case 'status':
        return multiplier * a.status.localeCompare(b.status);
      case 'daysToNext': {
        const daysA = calculateDaysToNextEvent(a)?.days || Infinity;
        const daysB = calculateDaysToNextEvent(b)?.days || Infinity;
        return multiplier * (daysA - daysB);
      }
      default:
        return 0;
    }
  });

  const calculateDaysToNextEvent = (currentEvent: InterviewEvent): NextEvent | null => {
    if (!currentEvent.secretary) return null;

    // Get all events for this secretary
    const secretaryEvents = events
      .filter(e => e.secretary?.id === currentEvent.secretary?.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find current event's index
    const currentIndex = secretaryEvents.findIndex(e => e.id === currentEvent.id);
    
    // If there's a next event, calculate days difference
    if (currentIndex < secretaryEvents.length - 1) {
      const nextEvent = secretaryEvents[currentIndex + 1];
      return {
        days: differenceInDays(new Date(nextEvent.date), new Date(currentEvent.date)),
        nextType: nextEvent.type
      };
    }

    return null;
  };

  const getRestPeriodStyling = (currentType: InterviewType, nextEvent: NextEvent | null) => {
    if (!nextEvent) return 'text-gray-400';

    const { days, nextType } = nextEvent;

    // Panel -> Panel (21 days)
    if (currentType === 'Panel' && nextType === 'Panel') {
      return days < 14 ? 'bg-red-100 text-red-800' : // Severe violation
             days < 21 ? 'bg-yellow-100 text-yellow-800' : // Minor violation
             'bg-green-100 text-green-800'; // OK
    }
    
    // Carousel -> Carousel (7 days)
    if (currentType === 'Carousel' && nextType === 'Carousel') {
      return days < 5 ? 'bg-red-100 text-red-800' : // Severe violation
             days < 7 ? 'bg-yellow-100 text-yellow-800' : // Minor violation
             'bg-green-100 text-green-800'; // OK
    }

    // Carousel -> Panel (14 days)
    if (currentType === 'Carousel' && nextType === 'Panel') {
      return days < 10 ? 'bg-red-100 text-red-800' : // Severe violation
             days < 14 ? 'bg-yellow-100 text-yellow-800' : // Minor violation
             'bg-green-100 text-green-800'; // OK
    }

    // Panel -> Carousel (10 days)
    if (currentType === 'Panel' && nextType === 'Carousel') {
      return days < 7 ? 'bg-red-100 text-red-800' : // Severe violation
             days < 10 ? 'bg-yellow-100 text-yellow-800' : // Minor violation
             'bg-green-100 text-green-800'; // OK
    }

    return 'bg-gray-100 text-gray-800'; // Fallback
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-2 text-left cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-4 h-4" />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Table className="w-5 h-5" />
          Event List
        </h2>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFutureOnly}
              onChange={(e) => setShowFutureOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Future Events Only
          </label>
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Seasons</option>
            {uniqueSeasons.map(season => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as InterviewType | 'all')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Types</option>
            <option value="Panel">Panel</option>
            <option value="Carousel">Carousel</option>
          </select>
          <select
            value={secretaryFilter}
            onChange={(e) => onSecretaryFilterChange(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Secretaries</option>
            {uniqueSecretaries.map(secretary => (
              <option key={secretary} value={secretary}>
                {secretary}
              </option>
            ))}
          </select>
          <select
            value={venueFilter}
            onChange={(e) => onVenueFilterChange(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">All Venues</option>
            {uniqueVenues.map(venueName => (
              <option key={venueName} value={venueName}>
                {venueName}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Panel/Event No.
              </th>
              <SortHeader field="venue">Venue</SortHeader>
              <SortHeader field="secretary">Secretary</SortHeader>
              <th className="px-4 py-2 text-left">Attendance</th>
              <th className="px-4 py-2 text-left">Historical Avg</th>
              <th className="px-4 py-2 text-left">Report Due</th>
              <th className="px-4 py-2 text-left">Paperwork Due</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Days to Next</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredEvents.map((event, index) => {
              const nextEvent = calculateDaysToNextEvent(event);
              const restPeriodClass = getRestPeriodStyling(event.type, nextEvent);
              
              return (
                <tr
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2 text-gray-900">
                      <span className="font-medium">{format(new Date(event.date), 'dd/MM/yyyy')}</span>
                      {event.time && (
                        <span className="text-gray-500">
                          {format(new Date(`2000-01-01T${event.time}`), 'HH:mm')}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.type === 'Panel' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'Carousel' ? 'bg-green-100 text-green-800' :
                        event.type === 'TeamResidential' ? 'bg-purple-100 text-purple-800' :
                        event.type === 'Training' ? 'bg-yellow-100 text-yellow-800' :
                        event.type === 'CandidatesPanel' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
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
                          className="text-blue-600 hover:text-blue-800"
                          title="Open in Helper"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.venue?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.secretary?.name || 'Unassigned'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {!['TeamResidential', 'Training', 'Conference'].includes(event.type) ? (
                      <div className="flex flex-col">
                        <span>{event.candidateCount || '-'}</span>
                        <span className="text-xs text-gray-500">
                          {event.actualAttendance > 0 ? `(Total: ${event.actualAttendance})` : ''}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {['Panel', 'Carousel'].includes(event.type) && event.historicalAverage ? (
                      <span className="text-gray-600">{event.historicalAverage}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(event.type === 'Panel' || event.type === 'Carousel') ? (
                      reportDueDates[event.id] 
                        ? format(reportDueDates[event.id], 'dd/MM/yyyy')
                        : 'Calculating...'
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(event.type === 'Panel' || event.type === 'Carousel') ? (
                      format(calculatePaperworkDueDate(new Date(event.date), event.type), 'dd/MM/yyyy')
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      event.status === 'Booked' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {!['TeamResidential', 'Training', 'Conference'].includes(event.type) 
                      ? (nextEvent ? (
                          <span className={`px-2 py-1 text-xs rounded-full ${restPeriodClass}`}>
                            {nextEvent.days}d → {nextEvent.nextType === 'Panel' ? 'P' : 'C'}
                          </span>
                        ) : (
                          <span className="text-gray-400">Last event</span>
                        ))
                      : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventTable;