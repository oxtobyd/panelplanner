import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllSecretaries } from './db/repositories/secretary-repository';
import { getAllVenues } from './db/repositories/venue-repository';
import termDatesRouter from './routes/termDates';
import eventsRouter from './api/events';

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

// Use the events router for all /api/events routes
app.use('/api/events', eventsRouter);

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

app.use('/api/term-dates', termDatesRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 