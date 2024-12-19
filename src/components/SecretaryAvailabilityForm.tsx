import React, { useState } from 'react';
import { Secretary } from '../types';

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
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecretaryAvailabilityForm; 