import express from 'express';
import {
  getCalendarEvents,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingEvents,
} from '../controllers/calendarController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCalendarEvents)
  .post(createCalendarEvent);

router.route('/upcoming')
  .get(getUpcomingEvents);

router.route('/:id')
  .get(getCalendarEvent)
  .put(updateCalendarEvent)
  .delete(deleteCalendarEvent);

export default router;
