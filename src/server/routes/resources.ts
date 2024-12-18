import express from 'express';
import { 
  getResources, 
  createResource, 
  updateResource,
  deleteResource,
  getEventResources,
  assignResourceToEvent,
  removeResourceFromEvent
} from '../db/repositories/resource-repository';

const router = express.Router();

// Get all resources
router.get('/', async (req, res) => {
  try {
    const resources = await getResources();
    res.json(resources);
  } catch (error) {
    console.error('Error getting resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new resource
router.post('/', async (req, res) => {
  try {
    const resource = await createResource(req.body);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a resource
router.patch('/:id', async (req, res) => {
  try {
    const resource = await updateResource(req.params.id, req.body);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a resource
router.delete('/:id', async (req, res) => {
  try {
    await deleteResource(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// Get resources for an event
router.get('/events/:eventId/resources', async (req, res) => {
  try {
    const resources = await getEventResources(req.params.eventId);
    res.json(resources);
  } catch (error) {
    console.error('Error getting event resources:', error);
    res.status(500).json({ error: 'Failed to get event resources' });
  }
});

// Assign resource to event
router.post('/events/:eventId/resources', async (req, res) => {
  try {
    await assignResourceToEvent(req.params.eventId, req.body.resourceId);
    res.status(204).send();
  } catch (error) {
    console.error('Error assigning resource:', error);
    res.status(500).json({ error: 'Failed to assign resource' });
  }
});

// Remove resource from event
router.delete('/events/:eventId/resources/:resourceId', async (req, res) => {
  try {
    await removeResourceFromEvent(req.params.eventId, req.params.resourceId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing resource:', error);
    res.status(500).json({ error: 'Failed to remove resource' });
  }
});

export default router; 