import express from 'express';
import { updateSecretaryAvailability, getSecretaryById, deleteSecretaryAvailability } from '../db/repositories/secretary-repository';

const router = express.Router();

router.get('/:id/availability', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log('Fetching availability for secretary ID:', id);
    
    const secretary = await getSecretaryById(id);
    console.log('Secretary data:', JSON.stringify(secretary, null, 2));
    
    if (!secretary) {
      console.log('No secretary found with ID:', id);
      return res.status(404).json({ error: 'Secretary not found' });
    }
    
    res.json(secretary.availability || []);
  } catch (error) {
    console.error('Detailed error in GET /:id/availability:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Failed to fetch availability',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post('/availability', async (req, res) => {
  try {
    const { secretaryId, date, isAvailable, reason } = req.body;
    await updateSecretaryAvailability(
      parseInt(secretaryId),
      new Date(date),
      isAvailable,
      reason
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

router.delete('/:id/availability/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    await deleteSecretaryAvailability(parseInt(id), new Date(date));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

export default router; 