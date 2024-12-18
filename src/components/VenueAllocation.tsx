import React, { useState } from 'react';
import { Building } from 'lucide-react';
import { InterviewEvent, Venue } from '../types';

interface VenueAllocationProps {
  venues: Venue[];
  events: InterviewEvent[];
  onVenueClick: (venueName: string) => void;
}

const VenueAllocation: React.FC<VenueAllocationProps> = ({ venues = [], events = [], onVenueClick }) => {
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  
  // Get unique seasons from events
  const uniqueSeasons = Array.from(new Set(events.map(event => event.season))).sort().reverse();

  const getVenueEvents = (venue: Venue) => {
    if (!venue || !events) return { panels: 0, carousels: 0 };
    
    const filteredEvents = events.filter(event => {
      const matchesVenue = String(event?.venue?.id) === String(venue.id);
      const matchesSeason = seasonFilter === 'all' || event.season === seasonFilter;
      return matchesVenue && matchesSeason;
    });
    
    const panels = filteredEvents.filter(event => event.type === 'Panel').length;
    const carousels = filteredEvents.filter(event => event.type === 'Carousel').length;
    
    return { panels, carousels };
  };

  const activeVenues = venues.filter(venue => {
    const { panels, carousels } = getVenueEvents(venue);
    return panels + carousels > 0;
  });

  const onlineVenues = activeVenues.filter(venue => venue.isOnline);
  const physicalVenues = activeVenues.filter(venue => !venue.isOnline);

  const VenueRow = ({ venue }: { venue: Venue }) => {
    const { panels, carousels } = getVenueEvents(venue);
    const total = panels + carousels;
    
    return (
      <div className="flex items-center justify-between">
        <div 
          className="text-base font-medium text-gray-900 cursor-pointer hover:text-blue-600"
          onClick={() => onVenueClick(venue.name)}
        >
          {venue.name}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-8 text-center">
            {panels}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-8 text-center">
            {carousels}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-8 text-center">
            {total}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Venue Allocation
          </h2>
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Seasons</option>
            {uniqueSeasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Online Venues */}
        {onlineVenues.map((venue) => (
          <VenueRow key={venue.id} venue={venue} />
        ))}

        {/* Divider - only show if both sections have venues */}
        {onlineVenues.length > 0 && physicalVenues.length > 0 && (
          <div className="border-t border-gray-200 my-4"></div>
        )}

        {/* Physical Venues */}
        {physicalVenues.map((venue) => (
          <VenueRow key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  );
};

export default VenueAllocation;