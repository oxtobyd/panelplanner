import { Resource } from '../../../types/resource';
import { query } from '../config';

export async function getResources(): Promise<Resource[]> {
  const result = await query(`
    SELECT 
      id,
      name,
      resource_type as "resourceType",
      status,
      times_used as "timesUsed",
      last_used as "lastUsed",
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM panel_resources
    ORDER BY name ASC
  `);
  return result.rows;
}

export async function createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
  const result = await query(`
    INSERT INTO panel_resources (
      name,
      resource_type,
      status,
      notes
    ) VALUES ($1, $2, $3, $4)
    RETURNING 
      id,
      name,
      resource_type as "resourceType",
      status,
      times_used as "timesUsed",
      last_used as "lastUsed",
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [
    resource.name,
    resource.resourceType,
    resource.status,
    resource.notes
  ]);
  return result.rows[0];
}

export async function updateResource(id: string, resource: Partial<Resource>): Promise<Resource> {
  const result = await query(`
    UPDATE panel_resources 
    SET 
      name = COALESCE($1, name),
      resource_type = COALESCE($2, resource_type),
      status = COALESCE($3, status),
      notes = COALESCE($4, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING 
      id,
      name,
      resource_type as "resourceType",
      status,
      times_used as "timesUsed",
      last_used as "lastUsed",
      notes,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [
    resource.name,
    resource.resourceType,
    resource.status,
    resource.notes,
    id
  ]);
  return result.rows[0];
}

export async function deleteResource(id: string): Promise<void> {
  await query(`
    DELETE FROM panel_resources 
    WHERE id = $1
  `, [id]);
}

export async function getEventResources(eventId: string): Promise<Resource[]> {
  const result = await query(`
    SELECT 
      r.id,
      r.name,
      r.resource_type as "resourceType",
      r.status,
      r.times_used as "timesUsed",
      r.last_used as "lastUsed",
      r.notes,
      r.created_at as "createdAt",
      r.updated_at as "updatedAt"
    FROM panel_resources r
    JOIN event_resources er ON r.id = er.resource_id
    WHERE er.event_id = $1
    ORDER BY r.name ASC
  `, [eventId]);
  return result.rows;
}

export async function assignResourceToEvent(eventId: string, resourceId: string): Promise<void> {
  await query(`
    INSERT INTO event_resources (event_id, resource_id)
    VALUES ($1, $2)
    ON CONFLICT (event_id, resource_id) DO NOTHING
  `, [eventId, resourceId]);
  
  // Update the times_used and last_used
  await query(`
    UPDATE panel_resources
    SET 
      times_used = times_used + 1,
      last_used = CURRENT_TIMESTAMP,
      status = 'InUse'
    WHERE id = $1
  `, [resourceId]);
}

export async function removeResourceFromEvent(eventId: string, resourceId: string): Promise<void> {
  // Start a transaction to ensure data consistency
  await query('BEGIN');
  
  try {
    // Delete the relationship
    await query(`
      DELETE FROM event_resources
      WHERE event_id = $1 AND resource_id = $2
    `, [eventId, resourceId]);
    
    // Check if resource is still used in any other events
    const result = await query(`
      SELECT COUNT(*) as count
      FROM event_resources
      WHERE resource_id = $1
    `, [resourceId]);
    
    // Update the resource
    await query(`
      UPDATE panel_resources
      SET 
        times_used = (
          SELECT COUNT(*) 
          FROM event_resources 
          WHERE resource_id = $1
        ),
        status = CASE 
          WHEN (SELECT COUNT(*) FROM event_resources WHERE resource_id = $1) = 0 
          THEN 'Available' 
          ELSE status 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [resourceId]);

    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
  