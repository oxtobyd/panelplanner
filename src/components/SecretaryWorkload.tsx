import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { Secretary } from '../types';

interface SecretaryWorkloadProps {
  secretaries: Secretary[];
  onSecretaryClick: (secretaryName: string) => void;
}

const SecretaryWorkload: React.FC<SecretaryWorkloadProps> = ({ secretaries, onSecretaryClick }) => {
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  // Get unique seasons from all secretary events
  const uniqueSeasons = Array.from(
    new Set(
      secretaries.flatMap(secretary => 
        secretary.workload?.upcomingEvents?.events?.map(event => event.season) || []
      )
    )
  ).sort().reverse();

  // Get filtered rest violations for a secretary
  const getFilteredRestViolations = (secretary: Secretary) => {
    if (seasonFilter === 'all') {
      return secretary.workload?.upcomingEvents?.restViolations;
    }

    const seasonEvents = secretary.workload?.upcomingEvents?.events?.filter(
      event => event.season === seasonFilter
    ) || [];

    // Only include rest violation dates that correspond to events in the selected season
    const filteredDates = secretary.workload?.upcomingEvents?.restViolations?.dates?.filter(date => {
      // Find the event that caused this violation
      const violationEvent = secretary.workload?.upcomingEvents?.events?.find(event => 
        new Date(event.date).getTime() === date.getTime() && 
        event.season === seasonFilter
      );
      return violationEvent !== undefined;
    }) || [];

    return {
      dates: filteredDates,
      details: secretary.workload?.upcomingEvents?.restViolations?.details || []
    };
  };

  // Filter out secretaries with no events in the selected season
  const activeSecretaries = secretaries.filter(secretary => {
    if (seasonFilter === 'all') {
      return secretary.workload?.upcomingEvents?.total > 0;
    }
    return secretary.workload?.upcomingEvents?.events?.some(
      event => event.season === seasonFilter
    );
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Secretary Workload
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
        {activeSecretaries.map(secretary => {
          const restViolations = getFilteredRestViolations(secretary);
          return (
            <div key={secretary.id} className="flex items-center justify-between">
              <div 
                className="text-base font-medium text-gray-900 flex items-center gap-1.5 cursor-pointer hover:text-blue-600"
                onClick={() => onSecretaryClick(secretary.name)}
              >
                {secretary.name}
                {restViolations?.dates?.length > 0 && (
                  <span 
                    className="inline-flex items-center px-1 py-0.5 text-[10px] font-medium bg-red-100 text-red-800 rounded-full cursor-help"
                    title={`Rest period violations:\n${restViolations.dates
                      .map(date => formatDate(date))
                      .join('\n')}`}
                  >
                    !{restViolations.dates.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-8 text-center">
                  {seasonFilter === 'all' 
                    ? secretary.workload?.upcomingEvents?.panels 
                    : secretary.workload?.upcomingEvents?.events?.filter(
                        e => e.type === 'Panel' && e.season === seasonFilter
                      ).length || 0
                  }
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-8 text-center">
                  {seasonFilter === 'all'
                    ? secretary.workload?.upcomingEvents?.carousels
                    : secretary.workload?.upcomingEvents?.events?.filter(
                        e => e.type === 'Carousel' && e.season === seasonFilter
                      ).length || 0
                  }
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-8 text-center">
                  {seasonFilter === 'all'
                    ? secretary.workload?.upcomingEvents?.total
                    : secretary.workload?.upcomingEvents?.events?.filter(
                        e => e.season === seasonFilter
                      ).length || 0
                  }
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecretaryWorkload;