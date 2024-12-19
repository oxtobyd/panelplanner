import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Secretary, SecretaryAvailability as SecretaryAvailabilityType } from '../types';
import { availabilityApi } from '../api/availability';
import { Copy, Trash2 } from 'lucide-react';

interface SecretaryAvailabilityProps {
  secretaries: Secretary[];
  onAvailabilityChange: () => void;
}

interface DuplicateFormProps {
  record: SecretaryAvailabilityType;
  onSubmit: (date: Date) => Promise<void>;
  onCancel: () => void;
}

const DuplicateForm: React.FC<DuplicateFormProps> = ({ record, onSubmit, onCancel }) => {
  const [newDate, setNewDate] = useState<string>(
    new Date(record.date).toISOString().split('T')[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(new Date(newDate));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <input
        type="date"
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
        className="block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200"
        required
      />
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-sm text-gray-300 hover:text-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-2 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Duplicate
        </button>
      </div>
    </form>
  );
};

interface SecretaryAvailabilityFormProps {
  secretary: Secretary;
  date: Date;
  onSubmit: (isAvailable: boolean, reason?: string) => Promise<void>;
  onCancel: () => void;
}

const SecretaryAvailabilityForm: React.FC<SecretaryAvailabilityFormProps> = ({
  secretary,
  date,
  onSubmit,
  onCancel,
}) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(isAvailable, reason);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-medium text-gray-200 mb-4">
        Set Availability for {date.toLocaleDateString()}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center space-x-2 text-gray-200">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-primary-600"
            />
            <span>Available</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Reason {!isAvailable && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200"
            placeholder={isAvailable ? "Optional reason" : "Required reason for unavailability"}
            required={!isAvailable}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-300 hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

const SecretaryAvailabilityComponent: React.FC<SecretaryAvailabilityProps> = ({
  secretaries,
  onAvailabilityChange
}) => {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [availabilityRecords, setAvailabilityRecords] = useState<SecretaryAvailabilityType[]>([]);
  const secretary = secretaries.find(s => s.id === id);
  const [duplicatingRecord, setDuplicatingRecord] = useState<SecretaryAvailabilityType | null>(null);

  const fetchAvailability = async () => {
    if (id) {
      const records = await availabilityApi.getSecretaryAvailability(id);
      setAvailabilityRecords(records);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  const handleAvailabilitySubmit = async (isAvailable: boolean, reason?: string) => {
    if (!selectedDate || !id) return;
    
    try {
      await availabilityApi.updateAvailability(id, selectedDate, isAvailable, reason);
      await fetchAvailability();
      onAvailabilityChange();
      setShowForm(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  };

  const handleDuplicate = async (date: Date) => {
    if (!duplicatingRecord || !id) return;
    
    try {
      await availabilityApi.updateAvailability(
        id,
        date,
        duplicatingRecord.isAvailable,
        duplicatingRecord.reason
      );
      await fetchAvailability();
      onAvailabilityChange();
      setDuplicatingRecord(null);
    } catch (error) {
      console.error('Failed to duplicate availability:', error);
    }
  };

  const handleDelete = async (date: Date) => {
    if (!id) return;
    
    try {
      await availabilityApi.deleteAvailability(id, date);
      await fetchAvailability();
      onAvailabilityChange();
    } catch (error) {
      console.error('Failed to delete availability:', error);
    }
  };

  const sortedAvailabilityRecords = availabilityRecords
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">{secretary?.name}'s Availability</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Select Date
          <input
            type="date"
            onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-300">Current Availability</h3>
        {sortedAvailabilityRecords.length > 0 ? (
          <ul className="space-y-2">
            {sortedAvailabilityRecords.map((record) => (
              <li 
                key={new Date(record.date).toISOString()} 
                className={`p-2 rounded ${
                  record.isAvailable ? 'bg-green-900/50' : 'bg-red-900/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-200">
                    {new Date(record.date).toLocaleDateString()} - {record.isAvailable ? 'Available' : 'Unavailable'}
                    {record.reason && ` (${record.reason})`}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDuplicatingRecord(record)}
                      className="text-gray-400 hover:text-gray-200"
                      title="Duplicate to another date"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(new Date(record.date))}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {duplicatingRecord?.date === record.date && (
                  <DuplicateForm
                    record={record}
                    onSubmit={handleDuplicate}
                    onCancel={() => setDuplicatingRecord(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No availability records set</p>
        )}
      </div>

      {selectedDate && (
        <div className="mt-4">
          <SecretaryAvailabilityForm
            secretary={secretary}
            date={selectedDate}
            onSubmit={handleAvailabilitySubmit}
            onCancel={() => setSelectedDate(null)}
          />
        </div>
      )}
    </div>
  );
};

export default SecretaryAvailabilityComponent; 