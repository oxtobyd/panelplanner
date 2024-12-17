import React from 'react';
import { UserCheck } from 'lucide-react';
import { Secretary } from '../types';

interface SecretaryWorkloadProps {
  secretaries: Secretary[];
  onSecretaryClick: (secretaryName: string) => void;
}

const SecretaryWorkload: React.FC<SecretaryWorkloadProps> = ({ secretaries, onSecretaryClick }) => {
  // Filter out secretaries with no events
  const activeSecretaries = secretaries.filter(
    secretary => secretary.workload.upcomingEvents.total > 0
  );

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
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Secretary Workload
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {activeSecretaries.map(secretary => (
          <div key={secretary.id} className="flex items-center justify-between">
            <div 
              className="text-base font-medium text-gray-900 flex items-center gap-1.5 cursor-pointer hover:text-blue-600"
              onClick={() => onSecretaryClick(secretary.name)}
            >
              {secretary.name}
              {secretary.workload.upcomingEvents.restViolations?.dates?.length > 0 && (
                <span 
                  className="inline-flex items-center px-1 py-0.5 text-[10px] font-medium bg-red-100 text-red-800 rounded-full cursor-help"
                  title={`Rest period violations:\n${secretary.workload.upcomingEvents.restViolations.dates
                    .map(date => formatDate(date))
                    .join('\n')}`}
                >
                  !{secretary.workload.upcomingEvents.restViolations.dates.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-8 text-center">
                {secretary.workload.upcomingEvents.panels}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-8 text-center">
                {secretary.workload.upcomingEvents.carousels}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 w-8 text-center">
                {secretary.workload.upcomingEvents.total}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecretaryWorkload;