import React, { useState, useEffect } from 'react';
import { Resource, ResourceType } from '../types/resource';
import { resourcesApi } from '../api/resources';
import { 
  Image, 
  Church, 
  Globe, 
  Users, 
  Mail, 
  Shield, 
  MessageSquare,
  Group,
  Archive
} from 'lucide-react';

interface ResourceSelectorProps {
  eventId?: string;
  onResourcesChange?: (resources: Resource[]) => void;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({ eventId, onResourcesChange }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignedResources, setAssignedResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState<ResourceType>('Image Set');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resourceTabs = [
    { type: 'Image Set', icon: Image, abbr: 'IMG' },
    { type: 'CofE News Item', icon: Church, abbr: 'CofE' },
    { type: 'World News Item', icon: Globe, abbr: 'News' },
    { type: 'Pastoral Scenario', icon: Users, abbr: 'Past.' },
    { type: 'Pastoral E-Mail', icon: Mail, abbr: 'P.Mail' },
    { type: 'Safeguarding Scenario', icon: Shield, abbr: 'Safe.' },
    { type: 'Safeguarding E-Mail', icon: MessageSquare, abbr: 'S.Mail' },
    { type: 'Group Exercise', icon: Group, abbr: 'Group' },
    { type: 'Other', icon: Archive, abbr: 'Other' }
  ] as const;

  useEffect(() => {
    if (eventId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const loadData = async () => {
    if (!eventId) return;
    try {
      const [allResources, eventResources] = await Promise.all([
        resourcesApi.getResources(),
        resourcesApi.getEventResources(eventId)
      ]);
      setResources(allResources);
      setAssignedResources(eventResources);
      onResourcesChange?.(eventResources);
    } catch (err) {
      setError('Failed to load resources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (resourceId: string) => {
    if (!eventId) return;
    try {
      await resourcesApi.assignToEvent(eventId, resourceId);
      const resourceToAssign = resources.find(r => r.id === resourceId);
      if (resourceToAssign) {
        const updatedAssignedResources = [...assignedResources, resourceToAssign];
        setAssignedResources(updatedAssignedResources);
        onResourcesChange?.(updatedAssignedResources);
      }
    } catch (err) {
      setError('Failed to assign resource');
      console.error(err);
    }
  };

  const handleRemove = async (resourceId: string) => {
    if (!eventId) return;
    try {
      await resourcesApi.removeFromEvent(eventId, resourceId);
      const updatedAssignedResources = assignedResources.filter(r => r.id !== resourceId);
      setAssignedResources(updatedAssignedResources);
      onResourcesChange?.(updatedAssignedResources);
    } catch (err) {
      setError('Failed to remove resource');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const availableResources = resources.filter(
    resource => !assignedResources.some(ar => ar.id === resource.id)
  );

  return (
    <div className="space-y-4">
      {/* Assigned Resources Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Resources</h4>
        {assignedResources.length === 0 ? (
          <p className="text-sm text-gray-500">No resources assigned</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {assignedResources.map(resource => (
              <li key={resource.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-medium">{resource.name}</span>
                  <span className="ml-2 text-sm text-gray-500">({resource.resourceType})</span>
                </div>
                <button
                  onClick={() => handleRemove(resource.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Resource Type Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {resourceTabs.map(({ type, icon: Icon, abbr }) => (
              <button
                key={type}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveTab(type);
                }}
                className={`
                  whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium
                  flex items-center space-x-1
                  ${activeTab === type
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                title={type}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{abbr}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Available Resources for Selected Type */}
        <div className="mt-4">
          <ul className="divide-y divide-gray-200">
            {availableResources
              .filter(r => r.resourceType === activeTab)
              .map(resource => (
                <li 
                  key={resource.id} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssign(resource.id);
                  }}
                  className="py-2 px-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
                >
                  <div>
                    <span className="font-medium">{resource.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {resource.timesUsed > 0 && `(Used ${resource.timesUsed} times)`}
                    </span>
                  </div>
                  <span className="text-primary-600 hover:text-primary-800 text-sm">
                    Assign
                  </span>
                </li>
              ))}
          </ul>
          {availableResources.filter(r => r.resourceType === activeTab).length === 0 && (
            <p className="text-sm text-gray-500 py-4 text-center">
              No available resources of this type
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 