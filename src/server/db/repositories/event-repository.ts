import { query } from '../config';
import { InterviewEvent } from '../../../types/event';

export async function getAllEvents(): Promise<InterviewEvent[]> {
  try {
    const result = await query(`
      SELECT 
        e.id,
        e.type,
        e.panel_number as "panelNumber",
        e.date,
        e.time,
        calculate_season(e.date) as season,
        e.week_number as "weekNumber",
        json_build_object(
          'id', v.id,
          'name', v.name,
          'isOnline', false,
          'capacity', v.default_candidate_count
        ) as venue,
        json_build_object(
          'id', s.id,
          'name', s.name
        ) as secretary,
        e.estimated_attendance as "estimatedAttendance",
        e.actual_attendance as "actualAttendance",
        e.report_date as "reportDate",
        e.report_deadline as "reportDeadline",
        e.notes,
        e.status,
        e.impacted_secretary_ids as "impactedSecretaryIds",
        (SELECT avg_per_event FROM get_historical_attendance(EXTRACT(WEEK FROM e.date)::integer, e.type)) as "historicalAverage"
      FROM panel_events e
      JOIN panel_venues v ON e.venue_id = v.id
      LEFT JOIN panel_secretaries s ON e.secretary_id = s.id
      ORDER BY e.date
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Database error in getAllEvents:', error);
    throw new Error('Failed to fetch events from database');
  }
}
export async function createEvent(event: InterviewEvent): Promise<InterviewEvent> {
  const result = await query(`
    INSERT INTO panel_events (
      type,
      panel_number,
      date,
      time,
      week_number,
      venue_id,
      secretary_id,
      estimated_attendance,
      actual_attendance,
      report_date,
      report_deadline,
      notes,
      status,
      impacted_secretary_ids
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING 
      id,
      type,
      panel_number as "panelNumber",
      date,
      time,
      calculate_season(date) as season,
      week_number as "weekNumber",
      (SELECT json_build_object(
        'id', v.id,
        'name', v.name,
        'capacity', v.default_candidate_count
      ) FROM panel_venues v WHERE v.id = venue_id) as venue,
      (SELECT json_build_object(
        'id', s.id,
        'name', s.name
      ) FROM panel_secretaries s WHERE s.id = secretary_id) as secretary,
      estimated_attendance as "estimatedAttendance",
      actual_attendance as "actualAttendance",
      report_date as "reportDate",
      report_deadline as "reportDeadline",
      notes,
      status,
      impacted_secretary_ids as "impactedSecretaryIds"
  `, [
    event.type,
    event.panelNumber,
    event.date,
    event.time,
    event.weekNumber,
    event.venue.id,
    event.secretary?.id,
    event.estimatedAttendance,
    event.actualAttendance,
    event.reportDate,
    event.reportDeadline,
    event.notes,
    event.status,
    event.impactedSecretaryIds
  ]);
  
  return result.rows[0];
}

export async function updateEvent(event: InterviewEvent): Promise<InterviewEvent> {
  console.log('Repository Update - Time value:', event.time);
  const result = await query(`
    UPDATE panel_events SET
      type = $1,
      panel_number = $2,
      date = $3,
      time = $4,
      week_number = $5,
      venue_id = $6,
      secretary_id = $7,
      estimated_attendance = $8,
      actual_attendance = $9,
      report_date = $10,
      report_deadline = $11,
      notes = $12,
      status = $13,
      impacted_secretary_ids = $14
    WHERE id = $15
    RETURNING 
      id,
      type,
      panel_number as "panelNumber",
      date,
      time,
      calculate_season(date) as season,
      week_number as "weekNumber",
      (SELECT json_build_object(
        'id', v.id,
        'name', v.name,
        'capacity', v.default_candidate_count
      ) FROM panel_venues v WHERE v.id = venue_id) as venue,
      (SELECT json_build_object(
        'id', s.id,
        'name', s.name
      ) FROM panel_secretaries s WHERE s.id = secretary_id) as secretary,
      estimated_attendance as "estimatedAttendance",
      actual_attendance as "actualAttendance",
      report_date as "reportDate",
      report_deadline as "reportDeadline",
      notes,
      status,
      impacted_secretary_ids as "impactedSecretaryIds"
  `, [
    event.type,
    event.panelNumber,
    event.date,
    event.time,
    event.weekNumber,
    event.venue.id,
    event.secretary?.id,
    event.estimatedAttendance,
    event.actualAttendance,
    event.reportDate,
    event.reportDeadline,
    event.notes,
    event.status,
    event.impactedSecretaryIds,
    event.id
  ]);
  
  return result.rows[0];
}

export async function deleteEvent(id: string): Promise<void> {
  await query('DELETE FROM panel_events WHERE id = $1', [id]);
}

export async function getHistoricalAttendance(panelType: string, weekNumber: number) {
  try {
    const result = await query(
      'SELECT * FROM get_historical_attendance($1, $2)',
      [weekNumber, panelType]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Database error in getHistoricalAttendance:', error);
    throw new Error('Failed to fetch historical attendance data');
  }
}