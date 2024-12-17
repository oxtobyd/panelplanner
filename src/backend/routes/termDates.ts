import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM term_dates';
    if (year) {
      query += ' WHERE academic_year = $1';
    }
    query += ' ORDER BY start_date';
    
    const result = await pool.query(query, year ? [year] : []);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching term dates:', error);
    res.status(500).json({ error: 'Failed to fetch term dates' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { academic_year, term_name, start_date, end_date, type, region } = req.body;
    const result = await pool.query(
      'INSERT INTO term_dates (academic_year, term_name, start_date, end_date, type, region) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [academic_year, term_name, start_date, end_date, type, region]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating term date:', error);
    res.status(500).json({ error: 'Failed to create term date' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year, term_name, start_date, end_date, type, region } = req.body;
    const result = await pool.query(
      'UPDATE term_dates SET academic_year = $1, term_name = $2, start_date = $3, end_date = $4, type = $5, region = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [academic_year, term_name, start_date, end_date, type, region, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Term date not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating term date:', error);
    res.status(500).json({ error: 'Failed to update term date' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM term_dates WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Term date not found' });
    }
    res.json({ message: 'Term date deleted successfully' });
  } catch (error) {
    console.error('Error deleting term date:', error);
    res.status(500).json({ error: 'Failed to delete term date' });
  }
});

export default router; 