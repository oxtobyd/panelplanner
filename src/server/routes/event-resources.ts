import express from 'express';
import { 
  getEventResources,
  assignResourceToEvent,
  removeResourceFromEvent
} from '../db/repositories/resource-repository';

const router = express.Router();

// Get resources for an event
router.get('/:eventId/resources', async (req, res) => {
  try {
    const resources = await getEventResources(req.params.eventId);
    res.json(resources);
  } catch (error) {
    console.error('Error getting event resources:', error);
    res.status(500).json({ error: 'Failed to get event resources' });
  }
});

// Assign resource to event
router.post('/:eventId/resources', async (req, res) => {
  try {
    await assignResourceToEvent(req.params.eventId, req.body.resourceId);
    res.status(204).send();
  } catch (error) {
    console.error('Error assigning resource:', error);
    res.status(500).json({ error: 'Failed to assign resource' });
  }
});

// Remove resource from event
router.delete('/:eventId/resources/:resourceId', async (req, res) => {
  try {
    await removeResourceFromEvent(req.params.eventId, req.params.resourceId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing resource:', error);
    res.status(500).json({ error: 'Failed to remove resource' });
  }
});

export default router; 