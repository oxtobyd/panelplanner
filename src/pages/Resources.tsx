import React, { useState, useEffect } from 'react';
import { Resource, ResourceType, ResourceStatus } from '../types/resource';
import { resourcesApi } from '../api/resources';
import { Pencil, Trash2, Link } from 'lucide-react'; // Import icons

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newResource, setNewResource] = useState({
    name: '',
    resourceType: 'Image Set' as ResourceType,
    status: 'Available' as ResourceStatus,
    notes: ''
  });
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const resourceTypes: ResourceType[] = [
    'Image Set',
    'CofE News Item',
    'World News Item',
    'Pastoral Scenario',
    'Pastoral E-Mail',
    'Safeguarding Scenario',
    'Safeguarding E-Mail',
    'Group Exercise',
    'Other'
  ];

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await resourcesApi.getResources();
      setResources(data);
    } catch (err) {
      setError('Failed to load resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resourcesApi.createResource(newResource);
      setNewResource({
        name: '',
        resourceType: 'Image Set',
        status: 'Available',
        notes: ''
      });
      loadResources();
    } catch (err) {
      setError('Failed to create resource');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: ResourceStatus) => {
    try {
      await resourcesApi.updateResource(id, { status });
      loadResources();
    } catch (err) {
      setError('Failed to update resource');
      console.error(err);
    }
  };

  const handleEditClick = (resource: Resource) => {
    setEditingResource(resource);
    setIsEditModalOpen(true);
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await resourcesApi.deleteResource(id);
        loadResources();
      } catch (err) {
        setError('Failed to delete resource');
        console.error(err);
      }
    }
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;

    try {
      await resourcesApi.updateResource(editingResource.id, editingResource);
      setIsEditModalOpen(false);
      setEditingResource(null);
      loadResources();
    } catch (err) {
      setError('Failed to update resource');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Resources</h1>
      
      {/* Add new resource form */}
      <form onSubmit={handleCreateResource} className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-medium">Add New Resource</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={newResource.name}
            onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
            placeholder="Resource name"
            className="rounded-md border-gray-300"
            required
          />
          <select
            value={newResource.resourceType}
            onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value as ResourceType })}
            className="rounded-md border-gray-300"
          >
            {resourceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <textarea
            value={newResource.notes}
            onChange={(e) => setNewResource({ ...newResource, notes: e.target.value })}
            placeholder="Notes (optional)"
            className="rounded-md border-gray-300"
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Add Resource
        </button>
      </form>

      {/* Resources list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map(resource => (
              <tr key={resource.id}>
                <td className="px-6 py-4 whitespace-nowrap">{resource.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{resource.resourceType}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${resource.status === 'Available' ? 'bg-green-100 text-green-800' : 
                      resource.status === 'InUse' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {resource.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{resource.timesUsed}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {resource.lastUsed ? new Date(resource.lastUsed).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleEditClick(resource)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(resource.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Edit Resource</h2>
            <form onSubmit={handleUpdateResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editingResource.name}
                  onChange={(e) => setEditingResource({
                    ...editingResource,
                    name: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={editingResource.resourceType}
                  onChange={(e) => setEditingResource({
                    ...editingResource,
                    resourceType: e.target.value as ResourceType
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  {resourceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editingResource.status}
                  onChange={(e) => setEditingResource({
                    ...editingResource,
                    status: e.target.value as ResourceStatus
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="Available">Available</option>
                  <option value="InUse">In Use</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={editingResource.notes || ''}
                  onChange={(e) => setEditingResource({
                    ...editingResource,
                    notes: e.target.value
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingResource(null);
                  }}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources; 