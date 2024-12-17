import express from 'express';
import { createEvent, getAllEvents, updateEvent, deleteEvent } from '../db/repositories/event-repository';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  try {
    const event = req.body;
    // For special events, ensure we handle the impactedSecretaryIds
    if (['TeamResidential', 'Training', 'Conference'].includes(event.type)) {
      event.secretary = null;  // Clear individual secretary for special events
      event.panelNumber = event.type;  // Use event type as panel number for special events
    }
    
    const createdEvent = await createEvent(event);
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const event = req.body;
    console.log('API Update - Time value:', event.time);
    
    if (['TeamResidential', 'Training', 'Conference'].includes(event.type)) {
      event.secretary = null;
      event.panelNumber = event.type;
    }
    
    const updatedEvent = await updateEvent({ ...event, id: req.params.id });
    console.log('After Update - Time value:', updatedEvent.time);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteEvent(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router; 