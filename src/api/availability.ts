import { SecretaryAvailability } from '../types';

export const availabilityApi = {
  // Get availability for a secretary
  getSecretaryAvailability: async (secretaryId: string) => {
    const response = await fetch(`/api/secretary/${secretaryId}/availability`);
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json() as Promise<SecretaryAvailability[]>;
  },

  // Update availability for a date
  updateAvailability: async (
    secretaryId: string, 
    date: Date, 
    isAvailable: boolean, 
    reason?: string
  ) => {
    const response = await fetch('/api/secretary/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secretaryId,
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        isAvailable,
        reason
      }),
    });
    if (!response.ok) throw new Error('Failed to update availability');
    return response.json() as Promise<SecretaryAvailability>;
  },

  // Delete availability entry
  deleteAvailability: async (secretaryId: string, date: Date) => {
    const response = await fetch(`/api/secretary/${secretaryId}/availability/${date.toISOString().split('T')[0]}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete availability');
  }
}; 