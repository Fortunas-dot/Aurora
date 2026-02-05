import { Response } from 'express';
import CalendarEvent, { ICalendarEvent } from '../models/Calendar';
import { AuthRequest } from '../middleware/auth';

// @desc    Get user's calendar events
// @route   GET /api/calendar
// @access  Private
export const getCalendarEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, type } = req.query;

    const query: any = { user: req.userId };

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate as string);
      }
    }

    if (type) {
      query.type = type;
    }

    const events = await CalendarEvent.find(query)
      .sort({ startDate: 1 })
      .lean();

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching calendar events',
    });
  }
};

// @desc    Get a single calendar event
// @route   GET /api/calendar/:id
// @access  Private
export const getCalendarEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Calendar event not found',
      });
      return;
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching calendar event',
    });
  }
};

// @desc    Create a new calendar event
// @route   POST /api/calendar
// @access  Private
export const createCalendarEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      type,
      reminder,
      recurrence,
    } = req.body;

    if (!title || !startDate) {
      res.status(400).json({
        success: false,
        message: 'Title and start date are required',
      });
      return;
    }

    const event = await CalendarEvent.create({
      user: req.userId,
      title: title.trim(),
      description: description?.trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      allDay: allDay === true,
      location: location?.trim(),
      type: type || 'other',
      reminder: reminder || { enabled: false, minutesBefore: 15 },
      recurrence: recurrence || { frequency: 'none', interval: 1 },
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating calendar event',
    });
  }
};

// @desc    Update a calendar event
// @route   PUT /api/calendar/:id
// @access  Private
export const updateCalendarEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Calendar event not found',
      });
      return;
    }

    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      type,
      reminder,
      recurrence,
    } = req.body;

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description?.trim();
    if (startDate !== undefined) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : undefined;
    if (allDay !== undefined) event.allDay = allDay;
    if (location !== undefined) event.location = location?.trim();
    if (type !== undefined) event.type = type;
    if (reminder !== undefined) event.reminder = reminder;
    if (recurrence !== undefined) event.recurrence = recurrence;

    await event.save();

    res.json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating calendar event',
    });
  }
};

// @desc    Delete a calendar event
// @route   DELETE /api/calendar/:id
// @access  Private
export const deleteCalendarEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Calendar event not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting calendar event',
    });
  }
};

// @desc    Get upcoming calendar events for AI context
// @route   GET /api/calendar/upcoming
// @access  Private
export const getUpcomingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const now = new Date();

    const events = await CalendarEvent.find({
      user: req.userId,
      startDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching upcoming events',
    });
  }
};
