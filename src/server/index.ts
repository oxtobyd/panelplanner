import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllEvents } from './db/repositories/event-repository';
import { getAllSecretaries } from './db/repositories/secretary-repository';
import { getAllVenues } from './db/repositories/venue-repository';
import { createEvent, updateEvent, deleteEvent } from './db/repositories/event-repository';
import termDatesRouter from './routes/termDates';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.get('/api/events', async (req, res, next) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    next(error);
  }
});

app.get('/api/secretaries', async (req, res, next) => {
  try {
    const secretaries = await getAllSecretaries();
    res.json(secretaries);
  } catch (error) {
    console.error('Error fetching secretaries:', error);
    next(error);
  }
});

app.get('/api/venues', async (req, res, next) => {
  try {
    const venues = await getAllVenues();
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    next(error);
  }
});

app.post('/api/events', async (req, res, next) => {
  try {
    const newEvent = await createEvent(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    next(error);
  }
});

app.put('/api/events/:id', async (req, res, next) => {
  try {
    const event = await updateEvent({ ...req.body, id: req.params.id });
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    next(error);
  }
});

app.delete('/api/events/:id', async (req, res, next) => {
  try {
    await deleteEvent(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    next(error);
  }
});

app.use('/api/term-dates', termDatesRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 