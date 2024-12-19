import { query } from '../config';
import { Secretary } from '../../../types/secretary';

export async function getAllSecretaries(): Promise<Secretary[]> {
  try {
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        json_agg(json_build_object(
          'date', sa.date,
          'isAvailable', sa.is_available,
          'reason', sa.reason
        )) FILTER (WHERE sa.date IS NOT NULL) as availability
      FROM panel_secretaries s
      LEFT JOIN secretary_availability sa ON s.id = sa.secretary_id
      WHERE s.active = true
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);
    
    return result.rows.map(row => ({
      ...row,
      availability: row.availability || [],
      workload: {
        upcomingEvents: {
          panels: 0,
          carousels: 0,
          total: 0,
          restViolations: {
            dates: [],
            details: []
          }
        }
      }
    }));
  } catch (error) {
    console.error('Database error in getAllSecretaries:', error);
    throw new Error('Failed to fetch secretaries from database');
  }
}

export async function getSecretaryById(id: number): Promise<Secretary | null> {
  const result = await query(`
    SELECT 
      s.id,
      s.name,
      json_agg(json_build_object(
        'date', sa.date,
        'isAvailable', sa.is_available,
        'reason', sa.reason
      )) FILTER (WHERE sa.date IS NOT NULL) as availability
    FROM panel_secretaries s
    LEFT JOIN secretary_availability sa ON s.id = sa.secretary_id
    WHERE s.id = $1
    GROUP BY s.id, s.name
  `, [id]);
  
  if (!result.rows[0]) return null;
  
  return {
    ...result.rows[0],
    availability: result.rows[0].availability || [],
    workload: {
      upcomingEvents: {
        panels: 0,
        carousels: 0,
        total: 0,
        restViolations: {
          dates: [],
          details: []
        }
      }
    }
  };
}

export async function updateSecretaryAvailability(
  secretaryId: number,
  date: Date,
  isAvailable: boolean,
  reason?: string
): Promise<void> {
  await query(`
    INSERT INTO secretary_availability (secretary_id, date, is_available, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (secretary_id, date)
    DO UPDATE SET is_available = $3, reason = $4
  `, [secretaryId, date, isAvailable, reason]);
}

export async function deleteSecretaryAvailability(
  secretaryId: number,
  date: Date
): Promise<void> {
  await query(
    'DELETE FROM secretary_availability WHERE secretary_id = $1 AND date = $2',
    [secretaryId, date]
  );
}