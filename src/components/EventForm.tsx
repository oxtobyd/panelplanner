import React, { useState, useEffect } from 'react';
import { InterviewEvent, Secretary, Venue } from '../types';

interface EventFormProps {
  event: InterviewEvent | null;
  venues: Venue[];
  secretaries: Secretary[];
  onSubmit: (event: InterviewEvent) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  event,
  venues,
  secretaries,
  onSubmit,
  onDelete,
  onClose,
}) => {
  const [formData, setFormData] = useState<Partial<InterviewEvent>>({
    type: 'Panel',
    date: new Date().toISOString().split('T')[0],
    venue: venues[0],
    status: 'Available' as const,
    notes: '',
    ...((!['TeamResidential', 'Training', 'Conference'].includes(event?.type || 'Panel')) && {
      secretary: secretaries[0],
      panelNumber: '',
      weekNumber: 1,
      estimatedAttendance: 12,
      actualAttendance: 0,
    })
  });

  const isSpecialEvent = ['TeamResidential', 'Training', 'Conference'].includes(formData.type as string);

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        reportDate: event.reportDate ? new Date(event.reportDate).toISOString().split('T')[0] : '',
        reportDeadline: event.reportDeadline ? new Date(event.reportDeadline).toISOString().split('T')[0] : '',
        venue: event.venue || venues[0],
        secretary: event.secretary || secretaries[0],
        type: event.type || 'Panel',
        status: event.status || 'Available',
        panelNumber: event.panelNumber || '',
        weekNumber: event.weekNumber || 1,
        estimatedAttendance: event.estimatedAttendance || 12,
        actualAttendance: event.actualAttendance || 0,
        notes: event.notes || ''
      });
    }
  }, [event, venues, secretaries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData: InterviewEvent = {
      id: event?.id || String(Date.now()),
      type: formData.type as InterviewType,
      panelNumber: formData.panelNumber || '',
      date: new Date(formData.date as string),
      time: formData.time,
      weekNumber: formData.weekNumber || 1,
      venue: formData.venue as Venue,
      secretary: isSpecialEvent ? undefined : (formData.secretary as Secretary),
      estimatedAttendance: formData.estimatedAttendance || 12,
      maxAttendees: formData.maxAttendees || 30,
      actualAttendance: formData.actualAttendance || 0,
      reportDate: formData.reportDate ? new Date(formData.reportDate as string) : new Date(),
      reportDeadline: formData.reportDeadline ? new Date(formData.reportDeadline as string) : new Date(),
      status: formData.status as 'Confirmed' | 'Booked' | 'Available',
      notes: formData.notes,
      impactedSecretaryIds: formData.impactedSecretaryIds || [],
    };
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-8">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {event ? 'Edit Event' : 'New Event'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as InterviewType })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Panel">Panel</option>
                <option value="Carousel">Carousel</option>
                <option value="TeamResidential">Team Residential</option>
                <option value="Training">Training</option>
                <option value="Conference">Conference</option>
                <option value="CandidatesPanel">Candidates Panel</option>
              </select>
            </div>

            {!isSpecialEvent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secretary</label>
                <select
                  value={formData.secretary?.id}
                  onChange={(e) => {
                    const secretary = secretaries.find(s => s.id === e.target.value);
                    setFormData({ ...formData, secretary });
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {secretaries.map((secretary) => (
                    <option key={secretary.id} value={secretary.id}>
                      {secretary.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSpecialEvent && (
              <div className="border border-gray-200 rounded-md p-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Impacted Secretaries</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {secretaries.map((secretary) => (
                    <label key={secretary.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.impactedSecretaryIds?.includes(Number(secretary.id))}
                        onChange={() => {
                          const currentIds = formData.impactedSecretaryIds || [];
                          const newIds = currentIds.includes(Number(secretary.id))
                            ? currentIds.filter(id => id !== Number(secretary.id))
                            : [...currentIds, Number(secretary.id)];
                          setFormData({ ...formData, impactedSecretaryIds: newIds });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{secretary.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!isSpecialEvent && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Panel Number</label>
                  <input
                    type="text"
                    value={formData.panelNumber}
                    onChange={(e) => setFormData({ ...formData, panelNumber: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week Number</label>
                  <input
                    type="number"
                    value={formData.weekNumber}
                    onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value) })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Attendance
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedAttendance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedAttendance: parseInt(e.target.value),
                      })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              {formData.type === 'Carousel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <select
                value={formData.venue?.id}
                onChange={(e) => {
                  const venue = venues.find(v => v.id === e.target.value);
                  setFormData({ ...formData, venue });
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Confirmed' | 'Booked' | 'Available' })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {event && (
                <>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this event?')) {
                          onDelete(event.id);
                          onClose();
                        }
                      }}
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      // Create a new event with the same details but as a new record
                      const duplicatedEvent = {
                        type: event.type,
                        panelNumber: event.panelNumber,
                        date: event.date, // Keep original date
                        weekNumber: event.weekNumber,
                        venue: event.venue,
                        secretary: event.secretary,
                        estimatedAttendance: event.estimatedAttendance,
                        actualAttendance: event.actualAttendance,
                        notes: event.notes,
                        status: event.status,
                        impactedSecretaryIds: event.impactedSecretaryIds
                      };
                      // Submit as new event without closing the form
                      onSubmit(duplicatedEvent);
                    }}
                    className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Duplicate
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {event ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventForm;