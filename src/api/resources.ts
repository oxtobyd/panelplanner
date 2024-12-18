import { Resource } from '../types/resource';

const API_URL = '/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  // Only try to parse JSON if there's content
  return response.status !== 204 ? response.json() : undefined;
};

export const resourcesApi = {
  getResources: async (): Promise<Resource[]> => {
    const response = await fetch(`${API_URL}/resources`);
    return handleResponse(response);
  },
  
  createResource: async (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> => {
    const response = await fetch(`${API_URL}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resource),
    });
    return handleResponse(response);
  },
  
  updateResource: async (id: string, updates: Partial<Resource>): Promise<Resource> => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },
  
  deleteResource: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
  
  // Get resources for an event
  getEventResources: async (eventId: string): Promise<Resource[]> => {
    const response = await fetch(`${API_URL}/events/${eventId}/resources`);
    return handleResponse(response);
  },
  
  // Assign resource to event
  assignToEvent: async (eventId: string, resourceId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/events/${eventId}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resourceId }),
    });
    return handleResponse(response);
  },
  
  // Remove resource from event
  removeFromEvent: async (eventId: string, resourceId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/events/${eventId}/resources/${resourceId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
}; 