import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { InterviewEvent, Secretary, Venue } from './types';
import { api } from './api/client';
import { distributeWorkload } from './utils/workload-utils';
import Calendar from './components/Calendar';
import EventTable from './components/EventTable';
import EventForm from './components/EventForm';
import SecretaryWorkload from './components/SecretaryWorkload';
import VenueAllocation from './components/VenueAllocation';
import TermDateAdmin from './components/TermDateAdmin';
import Resources from './pages/Resources';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Building,
  Menu,
  X,
  Archive,
} from 'lucide-react';

// Utility function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Utility function to get week number
const getWeekNumber = (date: Date): number => {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startDate.getDay() + 1) / 7);
};

function AppContent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'table'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<InterviewEvent | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [secretaryFilter, setSecretaryFilter] = useState<string>('all');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [infiniteScroll, setInfiniteScroll] = useState(false);

  const fetchEvents = async () => {
    try {
      const fetchedEvents = await api.getEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventsData, secretariesData, venuesData] = await Promise.all([
          api.getEvents(),
          api.getSecretaries(),
          api.getVenues()
        ]);
        
        //console.log('Raw Events Data:', eventsData);
        //console.log('Raw Secretaries Data:', secretariesData);
        
        setEvents(eventsData);
        setSecretaries(secretariesData);
        setVenues(venuesData);
      } catch (error) {
        setError('Failed to load data');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (secretaries.length && events.length) {
      console.log('Before workload calculation:', { 
        secretaries: secretaries.map(s => ({
          id: s.id,
          name: s.name,
          workload: s.workload
        })), 
        events: events.map(e => ({
          id: e.id,
          type: e.type,
          secretary: e.secretary?.id,
          impactedSecretaryIds: e.impactedSecretaryIds
        }))
      });
      
      const updatedSecretaries = distributeWorkload(secretaries, events);
      
      console.log('After workload calculation:', 
        updatedSecretaries.map(s => ({
          id: s.id,
          name: s.name,
          workload: s.workload
        }))
      );
      
      setSecretaries(updatedSecretaries);
    }
  }, [events]);

  const handleEventClick = (event: InterviewEvent) => {
    setSelectedEvent(event);
    setIsEventFormOpen(true);
  };

  const handleEventUpdate = async (updatedEvent: InterviewEvent) => {
    try {
      const updated = await api.updateEvent(updatedEvent);
      setEvents(events.map(event => 
        event.id === updated.id ? updated : event
      ));
      setIsEventFormOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      setError('Failed to update event');
      console.error('Error updating event:', error);
    }
  };

  const handleEventCreate = async (newEvent: InterviewEvent) => {
    try {
      const createdEvent = await api.createEvent(newEvent);
      setEvents([...events, createdEvent]);
      setIsEventFormOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      setError('Failed to create event');
      console.error('Error creating event:', error);
    }
  };

  const handleEventDelete = async (id: string) => {
    try {
      await api.deleteEvent(id);
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      setError('Failed to delete event');
      console.error('Error deleting event:', error);
    }
  };

  const handleNewEventClick = () => {
    setSelectedEvent(null);
    setIsEventFormOpen(true);
  };

  const handleSecretaryClick = (secretaryName: string) => {
    setView('table');
    setSecretaryFilter(secretaryName);
    navigate('/');
  };

  const handleVenueClick = (venueName: string) => {
    setView('table');
    setVenueFilter(venueName);
    navigate('/');
  };

  const refreshEvents = useCallback(async () => {
    try {
      const updatedEvents = await api.getEvents();
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  }, []);

  const handleEventDateChange = async (event: InterviewEvent, newDate: Date) => {
    try {
      if (!newDate || !(newDate instanceof Date) || isNaN(newDate.getTime())) {
        throw new Error('Invalid date provided');
      }

      console.log('Updating event with new date:', newDate);

      const updatedEvent = {
        ...event,
        date: formatDate(newDate),
        weekNumber: getWeekNumber(newDate)
      };

      console.log('Updated event object:', updatedEvent);

      await api.updateEvent(updatedEvent);
      await refreshEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to update event: ${error.message}`);
      } else {
        throw new Error('Failed to update event: Unknown error');
      }
    }
  };

  const handleInfiniteScrollChange = (value: boolean) => {
    setInfiniteScroll(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-shrink-0 flex items-center space-x-3">
                <img src="/Logo.png" alt="Panel Planner Logo" className="h-8 w-auto" />
                <h1 className="text-xl font-semibold text-gray-900">Panel Planner</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex rounded-lg shadow-sm">
                <button
                  onClick={() => setView('calendar')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                    view === 'calendar'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setView('table')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b -ml-px ${
                    view === 'table'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Table
                </button>
              </div>
              <button
                onClick={() => setIsEventFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div 
          className={`bg-white border-r border-gray-200 transition-all duration-300 ${
            isSidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <nav className="mt-5 px-2">
            <Link
              to="/"
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-primary-600"
            >
              <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={`${isSidebarOpen ? '' : 'hidden'}`}>Home</span>
            </Link>
            <Link
              to="/secretary-workload"
              className="mt-1 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-primary-600"
            >
              <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className={`${isSidebarOpen ? '' : 'hidden'}`}>Secretary Workload</span>
            </Link>
            <Link
              to="/venue-allocation"
              className="mt-1 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-primary-600"
            >
              <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className={`${isSidebarOpen ? '' : 'hidden'}`}>Venue Allocation</span>
            </Link>
            <Link
              to="/term-dates"
              className="mt-1 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-primary-600"
            >
              <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`${isSidebarOpen ? '' : 'hidden'}`}>Term Dates</span>
            </Link>
            <Link
              to="/resources"
              className="mt-1 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 hover:bg-gray-50 hover:text-primary-600"
            >
              <Archive 
                className={`${
                  location.pathname === '/resources'
                    ? 'text-gray-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 flex-shrink-0 h-5 w-5`}
                aria-hidden="true"
              />
              <span className={`${isSidebarOpen ? '' : 'hidden'}`}>Resources</span>
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            ) : (
              <Routes>
                <Route 
                  path="/" 
                  element={
                    view === 'calendar' ? (
                      <Calendar 
                        events={events} 
                        onEventClick={handleEventClick}
                        onEventDateChange={handleEventDateChange}
                        secretaryFilter={secretaryFilter}
                        onSecretaryFilterChange={setSecretaryFilter}
                        infiniteScroll={infiniteScroll}
                        onInfiniteScrollChange={handleInfiniteScrollChange}
                      />
                    ) : (
                      <EventTable 
                        events={events} 
                        onEventClick={handleEventClick}
                        secretaryFilter={secretaryFilter}
                        onSecretaryFilterChange={setSecretaryFilter}
                        venueFilter={venueFilter}
                        onVenueFilterChange={setVenueFilter}
                      />
                    )
                  } 
                />
                <Route 
                  path="/secretary-workload" 
                  element={<SecretaryWorkload 
                    secretaries={secretaries} 
                    onSecretaryClick={handleSecretaryClick}
                  />} 
                />
                <Route 
                  path="/venue-allocation" 
                  element={<VenueAllocation 
                    venues={venues} 
                    events={events}
                    onVenueClick={handleVenueClick}
                  />} 
                />
                <Route 
                  path="/term-dates" 
                  element={<TermDateAdmin />} 
                />
                <Route 
                  path="/resources" 
                  element={<Resources />} 
                />
              </Routes>
            )}
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {isEventFormOpen && (
        <EventForm
          event={selectedEvent}
          venues={venues}
          secretaries={secretaries}
          onClose={() => {
            setIsEventFormOpen(false);
            setSelectedEvent(null);
          }}
          onSubmit={async (eventData) => {
            try {
              if (selectedEvent && !eventData.id) {
                // This is a duplicate operation
                await api.createEvent(eventData);
                setEvents(await api.getEvents());
                setIsEventFormOpen(false);
                setSelectedEvent(null);
              } else if (selectedEvent) {
                // This is an update operation
                await api.updateEvent({ ...eventData, id: selectedEvent.id });
                setEvents(await api.getEvents());
                setIsEventFormOpen(false);
                setSelectedEvent(null);
              } else {
                // This is a new event operation
                await api.createEvent(eventData);
                setEvents(await api.getEvents());
                setIsEventFormOpen(false);
                setSelectedEvent(null);
              }
            } catch (error) {
              console.error('Failed to save event:', error);
            }
          }}
          onDelete={handleEventDelete}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;