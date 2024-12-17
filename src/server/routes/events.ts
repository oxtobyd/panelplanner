import express, { Request, Response } from 'express';
import pool from '../db';

const router = express.Router();

// GET events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        v.name as venue_name, 
        v.is_online as venue_is_online,
        v.capacity as venue_capacity,
        s.name as secretary_name
      FROM panel_events e
      LEFT JOIN panel_venues v ON e.venue_id = v.id
      LEFT JOIN panel_secretaries s ON e.secretary_id = s.id
      ORDER BY e.date ASC
    `);

    const events = result.rows.map(row => ({
      id: row.id.toString(),
      type: row.type,
      panelNumber: row.panel_number,
      date: row.date,
      time: row.time,
      weekNumber: row.week_number,
      venue: row.venue_id ? {
        id: row.venue_id.toString(),
        name: row.venue_name,
        isOnline: row.venue_is_online,
        capacity: row.venue_capacity
      } : null,
      secretary: row.secretary_id ? {
        id: row.secretary_id.toString(),
        name: row.secretary_name
      } : null,
      estimatedAttendance: row.estimated_attendance,
      actualAttendance: row.actual_attendance,
      reportDate: row.report_date,
      reportDeadline: row.report_deadline,
      notes: row.notes,
      status: row.status,
      impactedSecretaryIds: row.impacted_secretary_ids || []
    }));

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST new event
router.post('/events', async (req: Request, res: Response) => {
  const event = req.body;
  
  try {
    const result = await pool.query(`
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
      RETURNING *
    `, [
      event.type,
      event.panelNumber || '',
      event.date,
      event.time || null,
      event.weekNumber || null,
      event.venue?.id || null,
      event.secretary?.id || null,
      event.estimatedAttendance || 12,
      event.actualAttendance || 0,
      event.reportDate || null,
      event.reportDeadline || null,
      event.notes || '',
      event.status || 'Available',
      event.impactedSecretaryIds || []
    ]);

    // Format response similar to GET
    const newEvent = {
      id: result.rows[0].id.toString(),
      type: result.rows[0].type,
      // ... (same mapping as GET)
    };

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT update event
router.put('/events/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const event = req.body;

  try {
    const result = await pool.query(`
      UPDATE panel_events 
      SET 
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
        impacted_secretary_ids = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      event.type,
      event.panelNumber || '',
      event.date,
      event.time || null,
      event.weekNumber || null,
      event.venue?.id || null,
      event.secretary?.id || null,
      event.estimatedAttendance || 12,
      event.actualAttendance || 0,
      event.reportDate || null,
      event.reportDeadline || null,
      event.notes || '',
      event.status || 'Available',
      event.impactedSecretaryIds || [],
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: result.rows[0].id.toString(),
      type: result.rows[0].type,
      panelNumber: result.rows[0].panel_number,
      date: result.rows[0].date,
      time: result.rows[0].time,
      weekNumber: result.rows[0].week_number,
      venue: result.rows[0].venue_id ? {
        id: result.rows[0].venue_id.toString(),
        name: result.rows[0].venue_name,
        isOnline: result.rows[0].venue_is_online,
        capacity: result.rows[0].venue_capacity
      } : null,
      secretary: result.rows[0].secretary_id ? {
        id: result.rows[0].secretary_id.toString(),
        name: result.rows[0].secretary_name
      } : null,
      estimatedAttendance: result.rows[0].estimated_attendance,
      actualAttendance: result.rows[0].actual_attendance,
      reportDate: result.rows[0].report_date,
      reportDeadline: result.rows[0].report_deadline,
      notes: result.rows[0].notes,
      status: result.rows[0].status,
      impactedSecretaryIds: result.rows[0].impacted_secretary_ids || []
    });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

export default router;