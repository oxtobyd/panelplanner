import { query } from '../config';
import { Venue } from '../../../types/venue';

export async function getAllVenues(): Promise<Venue[]> {
  try {
    const result = await query(
      'SELECT id, name, default_candidate_count as capacity FROM panel_venues WHERE active = true ORDER BY name'
    );
    return result.rows.map(row => ({
      ...row,
      isOnline: false // Since there's no online column, defaulting to false
    }));
  } catch (error) {
    console.error('Database error in getAllVenues:', error);
    throw new Error('Failed to fetch venues from database');
  }
}

export async function getVenueById(id: number): Promise<Venue | null> {
  try {
    const result = await query(
      'SELECT id, name, default_candidate_count as capacity FROM panel_venues WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      isOnline: false
    };
  } catch (error) {
    console.error('Database error in getVenueById:', error);
    throw new Error('Failed to fetch venue from database');
  }
}

export async function createVenue(venue: Omit<Venue, 'id'>): Promise<Venue> {
  const result = await query(
    'INSERT INTO panel_venues (name, is_online, capacity) VALUES ($1, $2, $3) RETURNING id',
    [venue.name, venue.isOnline, venue.capacity]
  );
  return { ...venue, id: result.rows[0].id };
}