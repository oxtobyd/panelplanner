import React from 'react';
import { HistoricalAttendanceData } from '../api/client';

interface HistoricalAttendanceTableProps {
  data: HistoricalAttendanceData | null;
  isLoading: boolean;
  weekNumber?: number;
}

const HistoricalAttendanceTable: React.FC<HistoricalAttendanceTableProps> = ({
  data,
  isLoading,
  weekNumber
}) => {
  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Historical Attendance {weekNumber ? `(Week ${weekNumber})` : ''}
        </h3>
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          <div className="text-gray-500">Loading historical data...</div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Historical Attendance {weekNumber ? `(Week ${weekNumber})` : ''}
      </h3>
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <div className="px-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">Total Events</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{data.events}</p>
          </div>
          <div className="px-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm text-gray-500">Total Candidates</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{data.total_candidates}</p>
          </div>
          <div className="px-4 text-center">
            <div className="flex items-center justify-center mb-1">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-500">Avg. per Event</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900">{data.avg_per_event}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalAttendanceTable;
