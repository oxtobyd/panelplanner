export type ResourceType = 
  | 'Image Set'
  | 'CofE News Item'
  | 'World News Item'
  | 'Pastoral Scenario'
  | 'Pastoral E-Mail'
  | 'Safeguarding Scenario'
  | 'Safeguarding E-Mail'
  | 'Group Exercise'
  | 'Other';

export type ResourceStatus = 'Available' | 'InUse' | 'Retired';

export interface Resource {
  id: string;
  name: string;
  resourceType: ResourceType;
  status: ResourceStatus;
  timesUsed: number;
  lastUsed?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
} 